"""Leitura das páginas oficiais de marvel.com (personagens on-screen, filmes e séries).

As páginas trazem o conteúdo num estado JSON embutido (`window['__marvel-fitt__']`). Lemos só os blocos
de continuidade cinematográfica (`context: live_action`) e descartamos o resto: as mesmas páginas
misturam blocos de quadrinhos (ex.: "Iron Man: Legacy", edições de 1968) que não pertencem ao MCU.

Nada é inferido aqui. Cada fato vem de um campo explícito da página (aliados, inimigos, grupos, elenco,
direção) ou de um trecho de texto, e leva essa origem como evidência.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from freya.conhecimento.modelos import Documento, Entidade, Fato, TipoEvidencia
from freya.conhecimento.normalizacao import slug
from freya.conhecimento.ontologia import Predicado, TipoEntidade

BASE = "https://www.marvel.com"


@dataclass
class PaginaLida:
    documentos: list[Documento] = field(default_factory=list)
    entidades: list[Entidade] = field(default_factory=list)
    fatos: list[Fato] = field(default_factory=list)
    links: list[str] = field(default_factory=list)  # páginas on-screen a seguir
    descartados_quadrinhos: int = 0


class PaginaInvalida(ValueError):
    pass


def extrair_estado(html: str) -> dict:
    """Devolve `page.content` do estado embutido, ou PaginaInvalida."""
    for script in re.findall(r"<script[^>]*>(.*?)</script>", html, re.S):
        if "__marvel-fitt__" not in script:
            continue
        m = re.search(r"window\['__marvel-fitt__'\]\s*=\s*(\{.*\})\s*;?\s*$", script, re.S)
        if m:
            try:
                return json.loads(m.group(1))["page"]["content"]
            except (json.JSONDecodeError, KeyError) as e:  # página mudou de formato
                raise PaginaInvalida(f"estado embutido ilegível: {e}") from e
    raise PaginaInvalida("estado embutido não encontrado")


# ------------------------------------------------------------------ chaves a partir dos links oficiais

def chave_por_link(link: str) -> tuple[TipoEntidade, str] | None:
    """`/characters/iron-man-tony-stark` -> (PERSONAGEM, "character:iron-man-tony-stark")."""
    caminho = link.replace(BASE, "").split("?")[0].strip("/")
    partes = caminho.split("/")
    if len(partes) < 2:
        return None
    raiz, s = partes[0], partes[1]
    if raiz == "characters":
        return TipoEntidade.PERSONAGEM, f"character:{s}"
    if raiz == "teams-and-groups":
        return TipoEntidade.ORGANIZACAO, f"organization:{s}"
    if raiz == "movies":
        return TipoEntidade.FILME, f"film:{s}"
    if raiz == "tv-shows":
        temporada = f"-{partes[2]}" if len(partes) > 2 and partes[2].isdigit() else ""
        return TipoEntidade.SERIE, f"series:{s}{temporada}"
    return None


def url_perfil_on_screen(link: str) -> str | None:
    tipo = chave_por_link(link)
    if not tipo or tipo[0] != TipoEntidade.PERSONAGEM:
        return None
    s = link.replace(BASE, "").strip("/").split("/")[1]
    return f"{BASE}/characters/{s}/on-screen/profile"


def _ao_vivo(card: dict) -> bool:
    return card.get("context") == "live_action"


def _ano(texto: str | None) -> int | None:
    m = re.search(r"\b(19|20)\d{2}\b", texto or "")
    return int(m.group(0)) if m else None


# ------------------------------------------------------------------ perfil on-screen de personagem

_CONEXOES = {"Allies": Predicado.ALIADO_DE, "Enemies": Predicado.INIMIGO_DE, "Relatives": Predicado.PARENTE_DE, "Groups": Predicado.MEMBRO_DE}


def ler_perfil_personagem(estado: dict, url: str, captura_id: str | None = None) -> PaginaLida:
    r = PaginaLida()
    tipo_chave = chave_por_link(url)
    if not tipo_chave or tipo_chave[0] != TipoEntidade.PERSONAGEM or "/on-screen" not in url:
        raise PaginaInvalida(f"não é um perfil on-screen de personagem: {url}")
    ch = tipo_chave[1]
    comps = estado.get("components", [])
    mast = next((c["masthead_array"][0] for c in comps if c.get("component_type") == "masthead" and c.get("masthead_array")), {})
    nome = (mast.get("headline") or estado.get("title") or "").strip()
    identidade = (mast.get("eyebrow") or "").strip() or None
    if not nome:
        raise PaginaInvalida(f"perfil sem nome: {url}")
    doc_id = f"marvel:{ch}:on-screen"
    linhas = [f"{nome}" + (f" ({identidade})" if identidade and identidade != nome else "") + " — perfil on-screen (MCU), marvel.com"]
    if mast.get("secondary_text"):
        linhas.append(mast["secondary_text"].strip())
    for c in comps:
        if c.get("component_type") == "featured" and c.get("body_text"):
            linhas.append(c["body_text"].strip())

    pessoa = Entidade(chave=ch, nome=nome, tipo=TipoEntidade.PERSONAGEM, apelidos=[identidade] if identidade and identidade != nome else [],
                      descricao=(mast.get("secondary_text") or None), atributos={"identidade": identidade, "url": url}, fontes=[doc_id])
    r.entidades.append(pessoa)

    for c in comps:
        titulo = (c.get("title") or "").strip()
        # momentos da trajetória, na ordem da página
        if c.get("component_type") == "sets" and titulo == "Story Moments":
            for i, aba in enumerate(c.get("tabs") or [], 1):
                item = (aba.get("data") or [{}])[0]
                t, desc = (item.get("title") or "").strip(), (item.get("description") or "").strip()
                if not t or not desc:
                    continue
                linhas.append(f"Momento {i} — {t}: {desc}")
                ev = Entidade(chave=f"event:{ch.split(':', 1)[1]}--{slug(t)}", nome=f"{nome}: {t}", tipo=TipoEntidade.ACONTECIMENTO,
                              descricao=desc, atributos={"ordem_na_trajetoria": i, "personagem": ch}, fontes=[doc_id])
                r.entidades.append(ev)
                r.fatos.append(Fato(sujeito=ch, predicado=Predicado.VIVENCIA, objeto=ev.chave, evidencia=desc, doc_id=doc_id, url=url,
                                    captura_id=captura_id, ordem=i))
        # capacidades e tecnologias
        elif c.get("component_type") == "sets" and titulo.startswith("Powers"):
            for aba in c.get("tabs") or []:
                item = (aba.get("data") or [{}])[0]
                t, desc = (item.get("title") or "").strip(), (item.get("description") or "").strip()
                if not t or not desc:
                    continue
                linhas.append(f"Capacidade — {t}: {desc}")
                cap = Entidade(chave=f"technology:{slug(t)}", nome=t, tipo=TipoEntidade.TECNOLOGIA, fontes=[doc_id])
                r.entidades.append(cap)
                r.fatos.append(Fato(sujeito=ch, predicado=Predicado.TEM_CAPACIDADE, objeto=cap.chave, evidencia=desc, doc_id=doc_id, url=url,
                                    captura_id=captura_id))
        # conexões: aliados, inimigos, parentes, grupos
        elif c.get("component_type") == "carousel" and any(a.get("label") in _CONEXOES for a in c.get("tabs") or []):
            for aba in c.get("tabs") or []:
                pred = _CONEXOES.get(aba.get("label"))
                if not pred:
                    continue
                for card in aba.get("data") or []:
                    if not _ao_vivo(card):
                        r.descartados_quadrinhos += 1
                        continue
                    alvo = chave_por_link((card.get("link") or {}).get("link") or "")
                    nome_alvo = (card.get("headline") or "").strip()
                    if not alvo or not nome_alvo or alvo[1] == ch:
                        continue
                    sec = (card.get("secondary_text") or "").strip() or None
                    r.entidades.append(Entidade(chave=alvo[1], nome=nome_alvo, tipo=alvo[0], apelidos=[sec] if sec and sec != nome_alvo else [],
                                                descricao=(card.get("description") or None), fontes=[doc_id]))
                    rotulo = f"{nome_alvo}" + (f" ({sec})" if sec and sec != nome_alvo else "")
                    r.fatos.append(Fato(sujeito=ch, predicado=pred, objeto=alvo[1], evidencia=f"Connections › {aba['label']}: {rotulo}",
                                        tipo_evidencia=TipoEvidencia.CAMPO, campo=f"components.carousel.tabs[{aba['label']}]", doc_id=doc_id,
                                        url=url, captura_id=captura_id))
                    if card.get("description"):
                        linhas.append(f"{aba['label']} — {rotulo}: {card['description'].strip()}")
                    seguir = url_perfil_on_screen(card["link"]["link"])
                    if seguir:
                        r.links.append(seguir)
        # obras relacionadas (com ano)
        elif c.get("component_type") == "sets" and c.get("card_set"):
            for card in c["card_set"]:
                if not _ao_vivo(card):
                    r.descartados_quadrinhos += 1
                    continue
                alvo = chave_por_link((card.get("link") or {}).get("link") or "")
                if not alvo or not alvo[0].obra:
                    continue
                ano = _ano(card.get("secondary_text"))
                titulo_obra = (card.get("headline") or "").strip()
                r.entidades.append(Entidade(chave=alvo[1], nome=titulo_obra, tipo=alvo[0], atributos={"ano": ano}, fontes=[doc_id]))
                r.fatos.append(Fato(sujeito=ch, predicado=Predicado.APARECE_EM, objeto=alvo[1],
                                    evidencia=f"Related: {titulo_obra}" + (f" ({ano})" if ano else ""), tipo_evidencia=TipoEvidencia.CAMPO,
                                    campo="components.sets.card_set", doc_id=doc_id, url=url, captura_id=captura_id, ano=ano))
                r.links.append(BASE + card["link"]["link"])

    r.documentos.append(Documento(doc_id=doc_id, titulo=f"{nome} (on-screen)", url=url, texto="\n".join(linhas), entidade=ch,
                                  captura_id=captura_id, secao="perfil on-screen"))
    return r


# ------------------------------------------------------------------ filmes e temporadas de séries

_CREDITOS = {"Directed By": Predicado.DIRIGIDO_POR, "Director": Predicado.DIRIGIDO_POR, "Directors": Predicado.DIRIGIDO_POR,
             "Written By": Predicado.ESCRITO_POR, "Writers": Predicado.ESCRITO_POR, "Screenplay Writers": Predicado.ESCRITO_POR,
             "Head Writer": Predicado.ESCRITO_POR, "Producer": Predicado.PRODUZIDO_POR, "Produced By": Predicado.PRODUZIDO_POR}


def _pessoas(copia: str) -> list[str]:
    return [p.strip() for p in re.split(r",| and |&", copia or "") if p.strip() and len(p.strip()) < 60]


def _titulo_da_obra(estado: dict) -> str:
    """O título vem como lista ([{"value": "Iron Man Movie Detail Page"}]) ou texto; tiramos o sufixo da página."""
    bruto = estado.get("title")
    if isinstance(bruto, list):
        bruto = (bruto[0] or {}).get("value") if bruto else ""
    bruto = re.sub(r"\s*\|.*$", "", bruto or "")
    return re.sub(r"\s+(Movie|TV Show|Disney\+ Series|Series|Season \d+)?\s*(Detail )?Page$", "", bruto, flags=re.I).strip()


def ler_obra(estado: dict, url: str, captura_id: str | None = None) -> PaginaLida:
    r = PaginaLida()
    tipo_chave = chave_por_link(url)
    if not tipo_chave or not tipo_chave[0].obra:
        raise PaginaInvalida(f"não é página de filme ou série: {url}")
    tipo, ch = tipo_chave
    comps = estado.get("components", [])
    titulo = _titulo_da_obra(estado)
    temporada = re.search(r"-(\d+)$", ch) if tipo == TipoEntidade.SERIE else None
    if temporada and not re.search(r"season", titulo, re.I):
        titulo = f"{titulo} | Season {temporada.group(1)}"
    doc_id = f"marvel:{ch}"
    linhas = [f"{titulo} — página oficial marvel.com"]
    atributos: dict = {"url": url}

    for c in comps:
        if c.get("component_type") == "featured" and (c.get("body_text") or c.get("data")):
            if c.get("body_text"):
                linhas.append(c["body_text"].strip())
            for item in c.get("data") or []:
                rot, copia = (item.get("label") or "").strip(), (item.get("copy") or "").strip()
                if not rot or not copia:
                    continue
                linhas.append(f"{rot}: {copia}")
                if rot in ("Release Date", "Premiere Date", "Release date"):
                    atributos["data_lancamento"] = copia
                    atributos["ano"] = _ano(copia)
                pred = _CREDITOS.get(rot)
                if pred:
                    for nome in _pessoas(copia):
                        pessoa = Entidade(chave=f"person:{slug(nome)}", nome=nome, tipo=TipoEntidade.PESSOA, fontes=[doc_id])
                        r.entidades.append(pessoa)
                        r.fatos.append(Fato(sujeito=ch, predicado=pred, objeto=pessoa.chave, evidencia=f"{rot}: {copia}", tipo_evidencia=TipoEvidencia.CAMPO,
                                            campo=f"components.featured.data[{rot}]", doc_id=doc_id, url=url, captura_id=captura_id))
        elif c.get("component_type") == "carousel":
            for aba in c.get("tabs") or []:
                rotulo = (aba.get("label") or "")
                for card in aba.get("data") or []:
                    if not _ao_vivo(card):
                        r.descartados_quadrinhos += 1
                        continue
                    alvo = chave_por_link((card.get("link") or {}).get("link") or "")
                    if not alvo:
                        continue
                    nome = (card.get("headline") or "").strip()
                    sec = (card.get("secondary_text") or "").strip() or None
                    if alvo[0] == TipoEntidade.PERSONAGEM and "Cast" in rotulo:
                        r.entidades.append(Entidade(chave=alvo[1], nome=nome, tipo=alvo[0], apelidos=[sec] if sec and sec != nome else [],
                                                    descricao=card.get("description") or None, fontes=[doc_id]))
                        rot_card = nome + (f" ({sec})" if sec and sec != nome else "")
                        r.fatos.append(Fato(sujeito=alvo[1], predicado=Predicado.APARECE_EM, objeto=ch, evidencia=f"Cast & Characters: {rot_card}",
                                            tipo_evidencia=TipoEvidencia.CAMPO, campo="components.carousel.tabs[Cast & Characters]", doc_id=doc_id,
                                            url=url, captura_id=captura_id))
                        linhas.append(f"Personagem: {rot_card}")
                        seguir = url_perfil_on_screen(card["link"]["link"])
                        if seguir:
                            r.links.append(seguir)
                    elif alvo[0].obra:
                        r.entidades.append(Entidade(chave=alvo[1], nome=nome, tipo=alvo[0], atributos={"ano": _ano(sec)}, fontes=[doc_id]))
                        r.links.append(BASE + card["link"]["link"])
        elif c.get("component_type") == "sets" and c.get("card_set"):
            # blocos de "legado" trazem quadrinhos; contam como descartados
            r.descartados_quadrinhos += sum(1 for card in c["card_set"] if not _ao_vivo(card))

    r.entidades.insert(0, Entidade(chave=ch, nome=titulo, tipo=tipo, atributos=atributos, fontes=[doc_id]))
    r.documentos.append(Documento(doc_id=doc_id, titulo=titulo, url=url, texto="\n".join(linhas), entidade=ch, captura_id=captura_id,
                                  ano=atributos.get("ano")))
    return r


def ler_pagina(html: str, url: str, captura_id: str | None = None) -> PaginaLida:
    estado = extrair_estado(html)
    tipo = chave_por_link(url)
    if tipo and tipo[0] == TipoEntidade.PERSONAGEM:
        return ler_perfil_personagem(estado, url, captura_id)
    if tipo and tipo[0].obra:
        return ler_obra(estado, url, captura_id)
    raise PaginaInvalida(f"tipo de página não suportado: {url}")
