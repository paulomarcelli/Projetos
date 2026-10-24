# LUNA MIND — registro de progresso e continuidade

Arquivo curto para retomar o trabalho em outra sessão. Atualizado a cada etapa.

## Ponto de partida (verificado)
- App real veio do ZIP `Luna-AI-2.zip`: Flask (`app.py`) + Gemini (`luna.py`) + camada de segurança em código (`seguranca.py`) + front em `web/` + testes em `tests/`.
- Base de testes antes de qualquer mudança: 30 testes unitários e 15 testes de interface (Playwright) passando.
- O ZIP do RAG (`Luna_RAG_Research.zip`) **não contém código**: é uma biblioteca de pesquisa (capítulos 00–15 em Markdown, `manifesto_documentos.json` com SHA-256, `taxonomia_conhecimento.json`, `catalogo_fontes.csv`) e uma especificação técnica (`12_Especificacao_Tecnica_RAG.md`). A integração = implementar o pipeline descrito na especificação usando essa biblioteca.
- Personalidade: texto `INSTRUCOES` que estava em `luna.py` (escrito pelo autor).

## Plano
1. `personalidade.py`: mover `INSTRUCOES` sem alterar uma palavra (ponto único de edição manual).
2. Pacote `rag/` seguindo a especificação: ingestão com metadados e verificação de hash, particionamento por seção com vínculo ao documento-pai, BM25 (baseline obrigatório da §3.4) com recuperação densa opcional (híbrida por RRF), filtros antes da geração, suficiência/abstenção, orçamento de contexto, trechos marcados como dados não confiáveis, citações verificadas contra os trechos recuperados.
3. Integrar em `luna.responder()` entre a avaliação de risco e a montagem das instruções; RAG desligado em risco alto/imediato.
4. Identidade LUNA MIND: logo novo (SVG + favicons), nome, estrelas em camadas, refinamentos de UI, fontes exibidas sob a resposta.
5. Testes novos (rag, integração), rodar tudo, capturas, README/MUDANCAS.

## Decisões
- Mantida a paleta noturna; descartada a sugestão automática (verde/claro) da ui-ux-pro-max por contrariar a identidade.
- graphify rodado só sobre o código (AST), sem extração semântica, para economizar contexto.

## Feito (etapa backend)
- `personalidade.py` criado com o texto original (idêntico byte a byte, 5109 caracteres); `luna.INSTRUCOES` segue como apelido.
- Pacote `rag/` (texto, consulta, ingestao, indice, recuperador, prompt, __init__) integrado em `luna.responder()`; rota `/status`.
- Biblioteca: 13 capítulos, hashes conferem; 332 trechos, 250 usáveis na conversa (capítulos 02–11, sem seções editoriais).
- Testes: 62 passando (30 unitários originais + 15 de interface + 17 do RAG).

## Feito (etapa visual)
- Logo: o usuário pediu para usar o logo ORIGINAL (mulher com coroa de cristal). Uma lua desenhada por mim foi descartada. `web/marca/luna-mind.png` = original refinado (recorte, 2x, nitidez, mais luz no cristal); `web/logo.png` original preservado.
- Brilho animado (componente `.logo-luna` em `style.css`): varredura de luz nas linhas (máscara = PNG), 4 faíscas nos cristais, aura discreta. O usuário pediu cuidado com o brilho em volta: aura reduzida (opacidade 0.08–0.38, blur curto, quase colada ao desenho).
- Ícones (favicon, apple-touch, 192, 512): só a coroa, fundo noturno arredondado. Avatar das respostas usa `icone-192.png`.
- Céu: `web/estrelas.js` (canvas, 3 camadas, estrelas de cristal, parallax leve, respeita reduzir movimento).
- Fontes do RAG sob a resposta (`<details class="fontes">`).
- Testes: 65 passando (30 originais, 17 de RAG, 18 de interface, 3 deles novos).

## Pendências reais
- Sem GEMINI_API_KEY: não foi possível validar respostas reais do modelo nem embeddings reais (modo híbrido testado com embedder falso). Rodar `python tests/avaliar_respostas.py` com a chave.
- `video/` ainda usa o nome/logo antigos (material de apresentação em vídeo, mantido como histórico).
- Personalidade: nenhuma alteração; editar em `personalidade.py`.
