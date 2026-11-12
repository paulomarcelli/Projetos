#!/usr/bin/env python3
"""Teste ponta a ponta do treino com vagas FICTÍCIAS (geradas aqui, não são reais).

Uso: python testes/teste_ml.py
"""
import random
import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[1]
random.seed(7)
boas = ["Estágio em Dados", "Desenvolvedor Python Júnior", "Estágio em Inteligência Artificial",
        "Analista de Dados Júnior", "Engenheiro de Machine Learning Júnior", "Estágio Desenvolvimento Web React"]
ruins = ["Vendedor Externo", "Desenvolvedor Java Sênior", "Analista de Infraestrutura Pleno",
         "Operador de Telemarketing", "Gerente de Projetos Sênior", "Técnico de Suporte N2"]
linhas = []
for i in range(60):
    gosta = i % 2 == 0
    titulo = random.choice(boas if gosta else ruins)
    linhas.append({
        "id_vaga": str(4000000000 + i), "vaga": titulo, "empresa": f"Empresa Fictícia {i % 7}",
        "local": random.choice(["São Paulo, SP (Híbrido)", "Brasil (Remoto)", "Campinas, SP"]),
        "area": "", "nivel": "", "modalidade": "",
        # a "IA" fictícia acerta na maioria das vezes, mas erra algumas
        "nota_ia": str(random.choice([7, 8, 9] if gosta else [3, 4, 5]) if random.random() > 0.2 else random.randint(0, 10)),
        "status": "Vi", "gostei": "👍 Sim" if gosta else "👎 Não", "fonte": "Alerta LinkedIn",
        "recebida_em": "2026-11-12", "descricao": "", "link": "",
    })
for i in range(5):  # vagas sem marcação, para o prever.py
    linhas.append({**linhas[i], "id_vaga": str(4100000000 + i), "gostei": ""})

with tempfile.TemporaryDirectory() as tmp:
    csv = Path(tmp) / "vagas.csv"
    pd.DataFrame(linhas).to_csv(csv, index=False)
    saida = Path(tmp) / "resultados"
    subprocess.run([sys.executable, str(RAIZ / "ml" / "treinar.py"), "--csv", str(csv), "--saida", str(saida)], check=True)
    for arq in ["relatorio.md", "matriz_confusao.png", "modelo.joblib", "metricas.json"]:
        assert (saida / arq).exists(), arq
    r = subprocess.run([sys.executable, str(RAIZ / "ml" / "prever.py"), "--csv", str(csv),
                        "--modelo", str(saida / "modelo.joblib"), "--top", "3"],
                       check=True, capture_output=True, text=True, cwd=RAIZ / "ml")
    assert len(r.stdout.strip().splitlines()) == 3, r.stdout
    # poucas vagas marcadas: precisa avisar, não quebrar
    pd.DataFrame(linhas[:6]).to_csv(csv, index=False)
    r = subprocess.run([sys.executable, str(RAIZ / "ml" / "treinar.py"), "--csv", str(csv), "--saida", str(saida)],
                       capture_output=True, text=True)
    assert r.returncode != 0 and "poucas vagas" in r.stderr, r.stderr
print("ok: treino, relatório, previsão e aviso de poucos dados funcionaram")
