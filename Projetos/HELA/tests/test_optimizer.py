"""Context Optimizer: cabe no orçamento, tira redundância e nunca corta código, comando, caminho ou erro."""

from __future__ import annotations

import random
import re
import subprocess
import sys
from pathlib import Path

import pytest

from hela.core.optimizer import ContextItem, estimate_tokens, jaccard, optimize_context, segments, shingles

BLOCO = "```python\nimport json\nfrom pathlib import Path\n\ndados = json.loads(Path('a.json').read_text())\nprint(dados['x'])\n```"
COMANDO = "ffmpeg -i entrada.mp4 -vf scale=320:-1 saida.gif"
CAMINHO = "O arquivo fica em ~/projetos/app/config/settings.toml para o deploy."
ERRO = "ModuleNotFoundError: No module named 'yaml'"


def _item(i: int, valor: float, texto: str, resumo: str | None = None) -> ContextItem:
    return ContextItem(id=f"m{i}", kind="procedural", title=f"memória {i}", content=texto, summary=resumo, value=valor)


def test_segmentos_protegidos() -> None:
    texto = f"Para converter, rode o comando.\n{COMANDO}\n{CAMINHO}\n{ERRO}\n{BLOCO}\nDepois confira o resultado."
    tipos = [(s.kind, s.text) for s in segments(texto)]
    assert ("command", COMANDO) in tipos
    assert ("path", CAMINHO) in tipos
    assert ("error", ERRO) in tipos
    assert ("code", BLOCO) in tipos
    assert ("prose", "Para converter, rode o comando.") in tipos


def test_shingles_e_jaccard() -> None:
    a = shingles("o gato subiu no telhado de casa", 3)
    assert jaccard(a, a) == 1.0
    assert jaccard(a, shingles("um texto que não tem nada a ver", 3)) == 0.0


def test_cabe_no_orcamento() -> None:
    itens = [_item(i, 1 - i / 20, f"Lição {i}: " + "texto de apoio sobre a tarefa número %d. " % i * 12)
             for i in range(12)]
    r = optimize_context(itens, budget_tokens=300)
    assert r.tokens_optimized <= 300
    assert estimate_tokens(r.text) == r.tokens_optimized
    assert r.tokens_raw > r.tokens_optimized
    assert any(d["reason"] == "budget" for d in r.dropped)


def test_quase_duplicatas_viram_uma() -> None:
    base = "Para gerar o gif leve use ffmpeg com scale 320 e paleta otimizada antes de converter o vídeo inteiro"
    itens = [_item(1, 0.9, base), _item(2, 0.5, base.replace("inteiro", "todo")), _item(3, 0.4, "Outra coisa.")]
    r = optimize_context(itens, budget_tokens=1000)
    assert [x["id"] for x in r.items] == ["m1", "m3"]
    assert {"id": "m2", "reason": "near_duplicate", "duplicate_of": "m1"} in r.dropped


def test_frase_repetida_sai_da_segunda() -> None:
    a = _item(1, 0.9, "O WAL deixa leitores sem esperar. Use busy_timeout de 3 s.")
    b = _item(2, 0.8, "O WAL deixa leitores sem esperar. O checkpoint TRUNCATE zera o arquivo.")
    r = optimize_context([a, b], budget_tokens=1000, primary_count=2)
    assert r.text.count("O WAL deixa leitores sem esperar.") == 1
    assert "O checkpoint TRUNCATE zera o arquivo." in r.text
    assert r.removed_sentences == 1


def test_protegidos_iguais_na_principal() -> None:
    texto = f"Contexto da correção.\n{COMANDO}\n{CAMINHO}\n{ERRO}\n{BLOCO}\nFim."
    r = optimize_context([_item(1, 1.0, texto)], budget_tokens=2000)
    for trecho in (COMANDO, CAMINHO, ERRO, BLOCO):
        assert trecho in r.text


def test_principal_inteira_secundaria_resumida() -> None:
    longo = "Detalhe longo da secundária que não precisa ir inteiro. " * 10
    a = _item(1, 1.0, "Texto completo da principal. " * 5)
    b = _item(2, 0.5, longo + f"\n{COMANDO}", resumo="Resumo curto da secundária.")
    r = optimize_context([a, b], budget_tokens=2000, primary_count=1)
    modos = {x["id"]: x["mode"] for x in r.items}
    assert modos == {"m1": "full", "m2": "summary"}
    assert "Resumo curto da secundária." in r.text and longo not in r.text
    assert COMANDO in r.text  # comando é detalhe essencial: vai até no resumo


def test_principal_que_nao_cabe_desce_para_resumo() -> None:
    a = _item(1, 1.0, "Frase de abertura. " + "palavra " * 800, resumo="Resumo da principal.")
    r = optimize_context([a], budget_tokens=120)
    assert r.items and r.items[0]["mode"] == "summary" and r.tokens_optimized <= 120


def test_codigo_da_secundaria_inteiro_ou_omitido() -> None:
    linhas = "\n".join(f"    passo_{i}()" for i in range(30))
    bloco = f"```python\ndef roda():\n{linhas}\n```"
    a = _item(1, 1.0, "Principal curta.")
    b = _item(2, 0.5, f"Secundária com código.\n{bloco}")
    r = optimize_context([a, b], budget_tokens=2000, primary_count=1)
    assert bloco not in r.text
    assert "[código omitido: 33 linhas; íntegra na memória m2]" in r.text
    assert "passo_0()" not in r.text  # nada do bloco pela metade


def test_sem_itens_sem_contexto() -> None:
    r = optimize_context([], budget_tokens=500)
    assert r.text == "" and r.tokens_optimized == 0 and r.items == []


def test_aleatorio_nunca_corta_protegidos() -> None:
    rng = random.Random(42)
    pecas = [COMANDO, CAMINHO, ERRO, BLOCO, "Uma frase comum de explicação.", "Outra frase para encher.",
             "git commit -m 'corrige o parser'", "Traceback (most recent call last):", "Mais uma frase solta."]
    for rodada in range(60):
        itens = []
        for i in range(rng.randint(1, 8)):
            texto = "\n".join(rng.choice(pecas) for _ in range(rng.randint(1, 6)))
            itens.append(_item(i, rng.random(), texto, resumo=rng.choice([None, "Resumo dado."])))
        orcamento = rng.randint(60, 900)
        r = optimize_context(itens, budget_tokens=orcamento, primary_count=rng.randint(0, 3))
        assert r.tokens_optimized <= orcamento
        for linha in BLOCO.splitlines()[1:-1]:
            if linha.strip() and linha in r.text:  # se uma linha do bloco aparece, o bloco inteiro aparece
                assert BLOCO in r.text, rodada
        for protegido in (COMANDO, CAMINHO, ERRO):
            for m in re.finditer(re.escape(protegido[:12]), r.text):
                assert r.text[m.start():m.start() + len(protegido)] == protegido, rodada


def test_otimizador_e_modulo_leve() -> None:
    codigo = ("import sys; import hela.core.optimizer, hela.memory.activation; "
              "print(sorted(m for m in ('numpy','networkx','pydantic') if m in sys.modules))")
    r = subprocess.run([sys.executable, "-c", codigo], capture_output=True, text=True, timeout=60,
                       cwd=Path(__file__).resolve().parents[1])
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip() == "[]"


@pytest.mark.parametrize("orcamento", [0, -5])
def test_orcamento_invalido(orcamento: int) -> None:
    with pytest.raises(ValueError):
        optimize_context([_item(1, 1, "x")], budget_tokens=orcamento)


def test_palavra_com_e_inicial_nao_vira_linha_de_erro() -> None:
    # Regressão: o padrão de errno (ENOENT, EACCES) estava sem distinção de maiúsculas e pegava "esperar".
    assert [s.kind for s in segments("Precisa esperar o servidor subir.")] == ["prose"]
    assert [s.kind for s in segments("open falhou com ENOENT")] == ["error"]
