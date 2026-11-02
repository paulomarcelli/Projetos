# Corpora publicados

| Pasta | Origem | Licença |
|---|---|---|
| `manus_corpus.jsonl` | resumos da entrega da Manus | os da entrega original |
| `wiki/` | wiki do MCU (marvelcinematicuniverse.fandom.com): perfis dos personagens, relações, biografias, enredos e aparições das obras | CC BY-SA 3.0, com atribuição |
| `extraido/` | relações extraídas pelo modelo dos enredos da wiki; cada uma traz a citação literal | CC BY-SA 3.0, por derivar da wiki |

Cada documento e cada fato guardam a URL de origem, e os da wiki guardam também a licença.

**Fora do repositório:**
- `coletado/` e `unificado/`: trazem texto de marvel.com.
- `data/raw/`: cópias das páginas de marvel.com.

Os Termos de Uso da Marvel não permitem redistribuir esse conteúdo. Para gerar esses dados de novo, rode
`freya coletar`, `freya aprofundar` e `freya ingerir`.
