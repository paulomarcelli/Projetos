# Relatório das mudanças — Luna AI (outubro de 2026)

## 1. Diagnóstico: o que foi encontrado

| Problema | Impacto |
|---|---|
| O repositório só tinha o `LUNA.py` (bot de terminal por palavras-chave: música, jogos). A interface web chamava `127.0.0.1:5000/chat`, mas **esse servidor não existia** no repo. | A interface não funcionava fora da máquina original. |
| Cada mensagem ia sozinha para o servidor. | A Luna não tinha contexto: esquecia tudo a cada mensagem. |
| A resposta da IA entrava na página com `innerHTML` sem limpeza. | Risco de XSS: um texto malicioso poderia rodar código na página. |
| No celular (≤ 768px) a barra lateral sumia por inteiro. | O cartão com **CVV 188 / SAMU 192** e o botão "Nova conversa" ficavam inacessíveis no celular. |
| `height: 100vh` e nenhum ajuste para o teclado virtual. | No celular, o teclado podia cobrir a caixa de texto. |
| Rolagem: a página media "estou no fim?" depois de inserir a resposta. | Respostas longas (como a de crise) ficavam abaixo da tela, sem rolar. |
| Qualquer erro aparecia como "não consegui me conectar". | Mensagens de erro confusas, sem opção de tentar de novo. |
| Biblioteca `marked` sem versão fixa, vinda da CDN. | Uma atualização da CDN podia quebrar a página. |
| `logo.png` com 1,7 MB usada em cada avatar. | Carregamento lento no celular. |
| Sem voz, sem histórico, sem memória, sem configurações, sem camada de segurança. | Itens pedidos no projeto que ainda não existiam. |

## 2. Arquitetura escolhida

**Um agente** (uma chamada ao Gemini por mensagem) + **camada de segurança em código**.

```
navegador ──► app.py (valida) ──► luna.py ──► seguranca.avaliar() ──► risco imediato? ──► texto revisado (sem IA)
                                     │                                     │ não
                                     │                                     ▼
                                     │                      Gemini (instruções + histórico + memória autorizada)
                                     │                                     │
                                     └──────────── seguranca.verificar_resposta() ◄┘ ──► resposta + contatos de ajuda
```

- Por que não vários agentes: cada agente extra soma latência (ruim para a voz) e custo, sem ganho claro numa conversa de apoio. A parte que precisa ser confiável é a segurança, e ela fica no código, não no modelo.
- **Antes do modelo:** `seguranca.avaliar()` classifica a mensagem (e as 3 últimas da pessoa) em `nenhum / atencao / alto / imediato`, por categoria (autolesão, violência sofrida, violência contra outros, desorientação). Também marca sinais de contexto: pedido de segredo, parar tratamento, pedido de diagnóstico. Expressões do dia a dia ("morrendo de rir", "vou matar aula") são ignoradas.
- **Risco imediato:** na primeira vez, a resposta é um **texto revisado** que não depende da IA, nem da chave, nem da internet.
- **Depois do modelo:** `verificar_resposta()` bloqueia promessa de segredo, proteção ou exclusividade ("só eu te entendo") e incentivo a parar tratamento. Se a situação é de risco e a IA esqueceu os números, ela os acrescenta.
- Se o Gemini falhar ou bloquear em situação de risco, o texto revisado é usado.
- O modelo responde em JSON `{necessidade, resposta, lembrar}`. "necessidade" força o passo de entender o que a pessoa precisa antes de responder. O raciocínio interno do modelo nunca é exposto nem guardado.

## 3. O que foi implementado

**Motor conversacional (`luna.py`)**
- Instruções completas: os 7 passos de raciocínio (contexto, emoção, interpretação, evidências, alternativas, necessidade, próximo passo), os sinais como hipóteses e nunca como rótulos, a adaptação ao estado emocional, a TCC só como inspiração, no máximo uma pergunta por resposta, sem frases prontas, o encaminhamento profissional e o exemplo da amiga que demorou a responder.
- Contexto: as últimas 30 mensagens vão para o modelo.
- Modo voz: respostas mais curtas e sem Markdown.
- Modelo configurável (`LUNA_MODELO`, padrão `gemini-3.6-flash`, o mesmo do `chatbot-AI`), com pensamento "low" para responder mais rápido.

**Servidor (`app.py`)**
- Valida tudo o que chega (tamanhos, tipos, papéis).
- Não guarda nada. O log registra só o motivo da falha, nunca o texto.
- `Cache-Control: no-store` nas respostas do chat.
- CORS só para `localhost`/`127.0.0.1` (Live Server continua funcionando).
- Mensagens de erro claras (sem chave, chave recusada, limite de uso, falha).
- Lê a chave do `.env`.

**Interface (`web/`)** — identidade visual mantida (céu noturno, prata, lilás do cristal, Cormorant + Nunito)
- Logo com **brilho** que pulsa junto com a "respiração" do halo e uma **faísca** que cintila no cristal da coroa. Logos pequenas e o nome também brilham, e o avatar pulsa enquanto a Luna pensa.
- Animações novas, todas calmas:
  - entrada em sequência da tela inicial;
  - mensagens surgindo do lado de quem falou;
  - cartão de ajuda que acende duas vezes;
  - janela de configurações abrindo com zoom suave;
  - ondas no microfone enquanto escuta;
  - uma estrela cadente rara no céu.
- Tudo respeita "Reduzir animações" e a preferência do sistema.
- No celular: gaveta com menu, botão **Ajuda** sempre visível e `188` clicável no rodapé. O teclado virtual não cobre a caixa de texto.
- **Cartão de contatos** em situações de risco, com números clicáveis (`tel:`).
- **Histórico** opcional, guardado só no navegador: retomar conversas, apagar uma ou todas, apagar sozinho após 7, 30 ou 90 dias.
- **Memória** opcional com consentimento: a Luna sugere e a pessoa confirma cada item. Nas Configurações dá para ver, corrigir e apagar. Nada é sugerido em conversa de risco.
- **Configurações:** voz (escolha, velocidade, teste, leitura automática, conversa contínua), privacidade e acessibilidade (texto maior, menos animação).
- Erro com botão **Tentar de novo**. HTML da IA limpo com **DOMPurify**. Bibliotecas com versão fixa e verificação de integridade (SRI).
- Logo otimizada (1,7 MB → 180 KB).

**Voz (`web/voz.js`)**
- Estados: ouvindo → pensando → falando → ouvindo de novo. Controles: Pausar/Retomar, Interromper (ou `Esc`) e Encerrar.
- Evita fala por cima e respostas duplicadas: o microfone desliga enquanto ela fala, e cada fala tem um número que invalida callbacks antigos.
- Trata silêncio (tenta 3 vezes e pausa), ruídos curtos, microfone negado, sem microfone, sem internet e navegador sem suporte (o botão explica o motivo).
- Escolhe a voz em português mais natural disponível e fala em frases curtas, o que evita o corte de ~15 s do Chrome.

## 4. Voz: opções comparadas

| Opção | Qualidade pt-BR | Latência | Custo | Privacidade | Integração |
|---|---|---|---|---|---|
| **Web Speech API (escolhida)** | Depende do aparelho; boa no Edge ("Natural") e no Chrome (Google) | Baixa | Grátis | No Chrome/Edge o áudio vai para o serviço do navegador; no Safari pode ser no aparelho | Só JavaScript, sem servidor |
| Google Cloud TTS (Neural2 / Chirp 3 HD) | Alta e igual em todo aparelho | Média (ida ao servidor) | 1 milhão de caracteres grátis por mês; depois US$ 16 (Neural2) ou US$ 30 (Chirp 3 HD) por milhão | Texto vai ao Google Cloud | Rota nova no Flask + conta Google Cloud |
| Gemini TTS | Alta e expressiva | Média | US$ 0,50 por milhão de tokens de texto + US$ 9 por milhão de tokens de áudio; sem cota grátis | Texto vai ao Google | Rota nova no Flask |
| Gemini Live API (tempo real) | Alta, com interrupção natural | Muito baixa | Por tokens de áudio | Áudio vai ao Google | WebSocket + servidor intermediário; bem mais complexo |

A Web Speech foi escolhida porque funciona hoje, de graça e sem infraestrutura nova. O `voz.js` concentra o falar/ouvir em funções isoladas (`falar`, `ouvir`), então trocar por um TTS na nuvem ou pela Live API mexe só nelas.

## 5. Testes executados (resultados reais)

Comando: `python -m unittest discover tests` → **45 testes, todos passando** (rodado várias vezes).

- **Segurança (14 testes):** níveis de risco, frases do dia a dia que não disparam alarme, escalada por plano/horário e pelo contexto das mensagens anteriores, contatos por situação, bloqueio de promessas e de incentivo a parar tratamento.
- **Servidor e motor (16 testes, com IA falsa):** contexto chega ao modelo, validação, histórico cortado em 30, risco imediato sem chamar a IA, contatos acrescentados quando a IA esquece, IA bloqueada ou sem chave em risco → texto revisado, erros claros, **log sem o texto da pessoa**, CORS só local, memória só com permissão e nunca em conversa de risco.
- **Interface (15 testes, Chromium real em 390×844, 820×1180 e 1366×850):**
  - conversa, contexto e cartão de ajuda visível;
  - sem rolagem lateral;
  - gaveta do celular com foco e `Esc`;
  - **XSS bloqueado**;
  - erro e "Tentar de novo";
  - histórico só com permissão e retomada;
  - memória com consentimento, edição e exclusão;
  - **voz com APIs simuladas:** ouvir → falar → ouvir, silêncio, interromper, pausar/retomar, microfone negado, navegador sem suporte;
  - acessibilidade: nomes acessíveis, `alt`, rótulos, alvos de toque ≥ 24px, foco na janela e `Esc`;
  - texto maior.
- **Contraste de cores:** todas as combinações de texto ficam ≥ 4,6:1 (WCAG AA).
- **Cenários do projeto:** o roteamento de segurança acertou os 12 cenários (ex.: risco de suicídio → imediato; pedido de segredo com autolesão → alto).

**Não foi possível testar aqui:** a qualidade real das respostas do Gemini (o ambiente não tem acesso à API) e o som real das vozes (não há alto-falante). Para o primeiro, rode `python tests/avaliar_respostas.py` com a sua chave: ele conversa nos 12 cenários, faz verificações automáticas e gera `tests/saida/avaliacao.md` para você dar notas.

## 6. Limitações conhecidas

- A detecção de risco é por padrões de texto: pode deixar passar frases muito indiretas ou com erros de digitação. Por isso o modelo também recebe instruções de segurança. A camada em código é uma rede de proteção, não um diagnóstico.
- Reconhecimento de fala: o navegador encerra a vez após uma pausa curta (~1–2 s), então pausas longas podem cortar a frase. No Firefox não existe. Pausar a fala no Android pode falhar (limitação do Chrome).
- A voz depende das vozes instaladas no aparelho.
- O teclado virtual foi tratado para Android (`interactive-widget`) e iOS (`visualViewport`), mas não foi testado em aparelho físico.
- Usar no celular pela rede de casa exige HTTPS para o microfone funcionar. Por enquanto, use no computador.
- Histórico e memória ficam no navegador: não sincronizam entre aparelhos e somem se os dados do site forem limpos.
- Sem limite de requisições por pessoa: para publicar na internet, adicionar limite e HTTPS.
- Termos do Gemini: maiores de 18 anos, e o plano gratuito pode usar as mensagens (veja o README).

## 7. Custos estimados

- **Gemini 3.6 Flash:** US$ 0,75 por milhão de tokens de entrada e US$ 3,75 por milhão de saída até 31/12/2026; o dobro a partir de 2027. Cada mensagem usa ~3.200 tokens de entrada (instruções + histórico) e ~550 de saída (resposta + pensamento). Isso dá **≈ US$ 0,0045 por mensagem**, ou **≈ US$ 4,50 por 1.000 mensagens** (≈ US$ 9 em 2027). Há cota grátis para testes.
- **Voz:** grátis (navegador).
- **Avaliação dos 12 cenários:** menos de US$ 0,10 por rodada.

## 8. Próximos passos recomendados

1. Rodar `python tests/avaliar_respostas.py`, ler as respostas e ajustar as instruções em `luna.py` onde a nota for baixa.
2. Ativar o faturamento do Gemini antes de qualquer uso com outras pessoas.
3. Se a voz do navegador não agradar, trocar `falar()` por Google Cloud TTS (Chirp 3 HD tem 1 milhão de caracteres grátis por mês).
4. Para publicar online: hospedagem com HTTPS, limite de requisições e uma revisão da camada de segurança por profissional de saúde mental.
5. Evoluir para conversa em tempo real com a Gemini Live API.


---

# LUNA MIND (outubro de 2026): identidade, RAG e personalidade separada

## O que mudou
| Área | Mudança |
|---|---|
| Nome | LUNA AI → **LUNA MIND** (título, favicon, barra lateral, topo do celular, boas-vindas, textos de acessibilidade). |
| Logo | Mantida a **logo original** (mulher com coroa de cristal). Refinada em `web/marca/luna-mind.png`: recorte do espaço vazio, ampliação 2x com nitidez, limpeza de ruído e mais luz nos cristais. O `logo.png` original foi preservado. |
| Brilho animado | Componente `.logo-luna`: varredura de luz só nas linhas (máscara do próprio PNG), 4 faíscas nos cristais e aura discreta. Só `opacity` e `transform` animam. Desliga com "reduzir movimento" (sistema ou opção da Luna). |
| Ícones | `favicon-32.png`, `apple-touch-icon.png`, `icone-192.png`, `icone-512.png`: só a coroa (a figura inteira vira borrão em 16 px). O avatar das respostas usa o ícone. |
| Estrelas | `web/estrelas.js`: céu em canvas com 3 camadas (longe, meio, perto), estrelas de cristal de 4 pontas, parallax leve com o mouse, pausa em aba oculta. Sem JS, as estrelas de CSS continuam. |
| RAG | Pacote `rag/` + `conhecimento/` integrados em `luna.responder()`; fontes mostradas sob a resposta; rota `/status`. |
| Personalidade | Texto movido sem alteração para `personalidade.py`. |

## Decisões importantes
- O ZIP do RAG não tinha código: era a biblioteca e a especificação. Foi implementado o pipeline que ela descreve, com BM25 como baseline e híbrido opcional.
- RAG desligado em risco alto/imediato (a camada de segurança em código conduz).
- Citação verificada: o servidor descarta ids de fonte que não estavam entre os trechos enviados.
- O RAG nunca derruba o chat: qualquer falha vira "seguir sem a biblioteca".

## Limites
- Sem `GEMINI_API_KEY` não foi possível validar respostas reais do modelo nem a busca híbrida com embeddings reais (testada com embeddings falsos).
- A biblioteca é material de pesquisa e educativo, não clínico; a qualidade das respostas com os trechos deve ser avaliada com `tests/avaliar_respostas.py` quando houver chave.
