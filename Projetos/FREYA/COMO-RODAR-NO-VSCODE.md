# Rodar a F.R.E.Y.A. no VS Code (sem Docker)

Precisa de: **Python 3.11+**, **Node.js 20+** e internet na primeira vez (baixa o modelo de embedding, ~470 MB).
Os dados de marvel.com não vêm no repositório (Termos de Uso da Marvel): na primeira vez, rode `freya coletar` (uns 45 minutos; retoma de onde parou) antes de `freya servir`.

Abra a pasta `FREYA` no VS Code e use dois terminais (Terminal › Novo terminal).

## Terminal 1 — a API (backend)

```bash
python -m venv .venv
.venv\Scripts\activate              # Windows  (Mac/Linux: source .venv/bin/activate)
pip install torch --index-url https://download.pytorch.org/whl/cu128   # GPU NVIDIA (RTX 50xx); sem GPU: .../whl/cpu
pip install -e ".[dev]"
python -c "import torch; print(torch.cuda.is_available())"         # True = vai usar a placa de vídeo
copy .env.example .env              # Windows  (Mac/Linux: cp .env.example .env)
```

Abra o `.env` e preencha `OPENAI_API_KEY` (a sua chave), `OPENAI_BASE_URL` (se usar um revendedor compatível, terminando em `/v1`) e `OPENAI_MODEL`. Sem chave, o motor roda no modo determinístico.

No modo memória não precisa de senha do Neo4j. Depois:

```bash
freya servir --modo memoria
```

Na primeira vez monta a base (com GPU, menos de 1 minuto; só CPU, alguns minutos) e guarda os embeddings em `data/cache/embeddings.db`; nas próximas, sobe em segundos. Está pronta quando aparecer `Uvicorn running on http://127.0.0.1:8000`.

## Terminal 2 — a interface (frontend)

```bash
cd frontend
npm install
npm run dev
```

Abra **http://localhost:5173** no navegador.

## Dicas

- Cada análise nova chama o modelo e leva de 40 a 70 segundos.
- Desligar: `Ctrl+C` nos dois terminais. Ao ligar de novo, a API reaproveita o cache de embeddings.
- As análises ficam salvas em `data/freya.db`.
- Detalhes da arquitetura: `README.md` e `docs/FRONTEND.md`.
