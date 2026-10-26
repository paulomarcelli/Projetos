"""Voz em tempo real da LUNA MIND (OpenAI Realtime API via WebRTC).

Como funciona:
  1. O navegador pede uma sessão ao servidor (POST /voz/sessao).
  2. O servidor usa a chave secreta da OpenAI para criar uma chave EFÊMERA
     (POST /v1/realtime/client_secrets), já com as instruções da Luna dentro.
     A chave secreta nunca sai do servidor; a efêmera expira em poucos minutos.
  3. O navegador conecta o microfone direto na OpenAI por WebRTC com a chave efêmera.
     Áudio vai e volta em tempo real; a pessoa pode interromper a Luna falando.
  4. A cada fala transcrita, o navegador consulta POST /voz/avaliar, que roda a mesma
     camada de segurança em código do chat (seguranca.py). Em risco, a página mostra
     os contatos de ajuda e manda a orientação de segurança para a sessão.

Configuração (.env):
  OPENAI_REALTIME_API_KEY   chave oficial da OpenAI com acesso ao Realtime.
                            Sem ela, usa OPENAI_API_KEY, mas só quando LUNA_OPENAI_URL
                            não aponta para outro serviço (chaves de revenda não têm Realtime).
  LUNA_REALTIME_MODELO      padrão gpt-realtime-2.1
  LUNA_REALTIME_VOZ         padrão marin
  LUNA_VOZ_TEMPO_REAL=0     desliga a voz em tempo real (volta a voz do navegador)
"""

import hashlib
import os
import secrets
import threading
import time

import luna
import personalidade
import seguranca

BASE_URL = "https://api.openai.com/v1"
MODELO_PADRAO = "gpt-realtime-2.1"
VOZ_PADRAO = "marin"
TRANSCRICAO = "gpt-4o-mini-transcribe"
VALIDADE_S = 120                 # a chave efêmera só precisa durar até a conexão começar
LIMITE_POR_HORA = 20             # sessões por endereço IP: protege a cota de quem hospeda
_SAL = secrets.token_hex(16)     # identificador de segurança sem guardar o IP real

INSTRUCOES_TEMPO_REAL = personalidade.VOZ_TEMPO_REAL   # definida junto com a personalidade


class ErroVoz(Exception):
    def __init__(self, mensagem, status):
        super().__init__(mensagem)
        self.status = status


def _chave():
    explicita = os.environ.get("OPENAI_REALTIME_API_KEY")
    if explicita:
        return explicita
    if not os.environ.get("LUNA_OPENAI_URL"):          # OPENAI_API_KEY só vale se for da própria OpenAI
        return os.environ.get("OPENAI_API_KEY")
    return None


def disponivel():
    return os.environ.get("LUNA_VOZ_TEMPO_REAL", "1") != "0" and bool(_chave())


_pedidos = {}
_trava = threading.Lock()


def _dentro_do_limite(ip):
    agora = time.time()
    with _trava:
        recentes = [t for t in _pedidos.get(ip, []) if agora - t < 3600]
        if len(recentes) >= LIMITE_POR_HORA:
            _pedidos[ip] = recentes
            return False
        recentes.append(agora)
        _pedidos[ip] = recentes
        return True


def instrucoes(memoria=(), memoria_ativa=False):
    """Mesmas instruções do chat em modo voz + a regra de fala ao vivo."""
    av = seguranca.avaliar("")
    base = luna.montar_instrucoes(av, list(memoria), memoria_ativa, modo_voz=True)
    return base + "\n\n" + INSTRUCOES_TEMPO_REAL


def criar_sessao(memoria=(), memoria_ativa=False, ip=""):
    """Cria a chave efêmera. Devolve só o que o navegador precisa para conectar."""
    chave = _chave()
    if not chave or os.environ.get("LUNA_VOZ_TEMPO_REAL", "1") == "0":
        raise ErroVoz("A voz em tempo real não está configurada neste servidor.", 503)
    if not _dentro_do_limite(ip):
        raise ErroVoz("Muitas conversas por voz em pouco tempo. Tente de novo mais tarde.", 429)

    import httpx                                            # vem com o google-genai
    base = (os.environ.get("LUNA_REALTIME_BASE") or BASE_URL).rstrip("/")
    modelo = os.environ.get("LUNA_REALTIME_MODELO") or MODELO_PADRAO
    corpo = {
        "expires_after": {"anchor": "created_at", "seconds": VALIDADE_S},
        "session": {
            "type": "realtime",
            "model": modelo,
            "instructions": instrucoes(memoria, memoria_ativa),
            "audio": {
                "input": {
                    "transcription": {"model": TRANSCRICAO, "language": "pt"},
                    "turn_detection": {"type": "semantic_vad", "create_response": True, "interrupt_response": True},
                    "noise_reduction": {"type": "near_field"},
                },
                "output": {"voice": os.environ.get("LUNA_REALTIME_VOZ") or VOZ_PADRAO},
            },
        },
    }
    identificador = hashlib.sha256((_SAL + ip).encode()).hexdigest()[:32]
    try:
        r = httpx.post(
            f"{base}/realtime/client_secrets",
            headers={"Authorization": f"Bearer {chave}", "OpenAI-Safety-Identifier": identificador},
            json=corpo,
            timeout=20,
        )
    except httpx.HTTPError as erro:
        raise ErroVoz("Não consegui falar com a OpenAI agora. Tente de novo em instantes.", 502) from erro
    if r.status_code in (401, 403):
        raise ErroVoz("A chave da OpenAI para voz foi recusada. Confira OPENAI_REALTIME_API_KEY.", 503)
    if r.status_code == 429:
        raise ErroVoz("O limite de uso da voz da OpenAI foi atingido. Tente mais tarde.", 429)
    if r.status_code != 200:
        raise ErroVoz("A OpenAI não abriu a sessão de voz agora. Tente de novo em instantes.", 502)
    dados = r.json()
    if not isinstance(dados.get("value"), str):
        raise ErroVoz("A OpenAI respondeu sem a chave da sessão.", 502)
    return {
        "chave": dados["value"],                             # efêmera: expira em VALIDADE_S segundos
        "expira_em": dados.get("expires_at"),
        "url_chamada": f"{base}/realtime/calls",
        "modelo": modelo,
    }


def avaliar(texto, anteriores=()):
    """Camada de segurança do chat aplicada à fala transcrita."""
    av = seguranca.avaliar(texto, list(anteriores))
    orientacoes = []
    if av.nivel in luna.ORIENTACOES_RISCO:
        orientacoes.append(luna.ORIENTACOES_RISCO[av.nivel])
    orientacoes.extend(luna.ORIENTACOES_SINAIS[s] for s in av.sinais if s in luna.ORIENTACOES_SINAIS)
    return {
        "nivel": av.nivel,
        "categorias": av.categorias,
        "contatos": seguranca.contatos(av),
        "orientacao": "\n".join(orientacoes),
        # Risco imediato: no chat a Luna usa um texto revisado, sem IA. Na voz, a sessão é instruída a dizê-lo.
        "texto_seguro": seguranca.resposta_padrao(av) if av.nivel == "imediato" else None,
    }
