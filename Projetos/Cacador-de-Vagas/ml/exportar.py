#!/usr/bin/env python3
"""Baixa as vagas do banco "Vagas" do Notion para ml/dados/vagas.csv.

Uso:
    NOTION_TOKEN=secret_xxx python ml/exportar.py
    (o ID do banco vem de NOTION_DATABASE_ID ou do padrão abaixo)
"""
import csv
import json
import os
import sys
import urllib.request
from pathlib import Path

DATABASE_ID = os.environ.get("NOTION_DATABASE_ID", "e4d8a79cb87948ceadad7ec8504a6977")
SAIDA = Path(__file__).resolve().parent / "dados" / "vagas.csv"
COLUNAS = ["id_vaga", "vaga", "empresa", "local", "area", "nivel", "modalidade",
           "nota_ia", "status", "gostei", "fonte", "recebida_em", "descricao", "link"]


def texto(prop):
    if not prop:
        return ""
    tipo = prop["type"]
    if tipo in ("title", "rich_text"):
        return "".join(p.get("plain_text", "") for p in prop[tipo])
    if tipo == "select":
        return (prop["select"] or {}).get("name", "")
    if tipo == "number":
        return "" if prop["number"] is None else prop["number"]
    if tipo == "url":
        return prop["url"] or ""
    if tipo == "date":
        return (prop["date"] or {}).get("start", "")
    return ""


def consultar(token, cursor=None):
    corpo = {"page_size": 100}
    if cursor:
        corpo["start_cursor"] = cursor
    req = urllib.request.Request(
        f"https://api.notion.com/v1/databases/{DATABASE_ID}/query",
        data=json.dumps(corpo).encode(),
        headers={"Authorization": f"Bearer {token}", "Notion-Version": "2022-06-28",
                 "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    token = os.environ.get("NOTION_TOKEN")
    if not token:
        sys.exit("Defina NOTION_TOKEN com o token da integração do Notion (o mesmo do n8n).")
    linhas, cursor = [], None
    while True:
        dados = consultar(token, cursor)
        for pagina in dados["results"]:
            p = pagina["properties"]
            linhas.append({
                "id_vaga": texto(p.get("ID vaga")), "vaga": texto(p.get("Vaga")),
                "empresa": texto(p.get("Empresa")), "local": texto(p.get("Local")),
                "area": texto(p.get("Área")), "nivel": texto(p.get("Nível")),
                "modalidade": texto(p.get("Modalidade")), "nota_ia": texto(p.get("Nota IA")),
                "status": texto(p.get("Status")), "gostei": texto(p.get("Gostei?")),
                "fonte": texto(p.get("Fonte")), "recebida_em": texto(p.get("Recebida em")),
                "descricao": texto(p.get("Descrição")), "link": texto(p.get("Link")),
            })
        if not dados.get("has_more"):
            break
        cursor = dados["next_cursor"]
    SAIDA.parent.mkdir(exist_ok=True)
    with SAIDA.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUNAS)
        w.writeheader()
        w.writerows(linhas)
    rotuladas = sum(1 for l in linhas if l["gostei"])
    print(f"{len(linhas)} vagas salvas em {SAIDA} · {rotuladas} com 'Gostei?' marcado")


if __name__ == "__main__":
    main()
