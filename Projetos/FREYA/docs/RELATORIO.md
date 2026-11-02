# Relatório final — F.R.E.Y.A. (backend)

Data: 2 nov. 2026.

## 1. O que foi feito

1. **Auditoria** da entrega da Manus (docs/AUDITORIA.md): código lido por inteiro, pilha executada de verdade
   (Qdrant, Elasticsearch, Neo4j), números do README reproduzidos, defeitos confirmados no banco.
2. **Arquitetura consolidada** (docs/ARQUITETURA.md): Hybrid RAG, GraphRAG e motor prospectivo como módulos
   independentes, ligados por um registro de evidências.
3. **Correções onde havia defeito**, mantendo o que funcionava (Qdrant, Elasticsearch, Neo4j, RRF, a regra
   "sem citação, sem relação", o modelo de embedding).
4. **Ampliação da base** com páginas oficiais de marvel.com (continuidade cinematográfica).
5. **Backend completo:** motor prospectivo, validador epistêmico, orquestração, persistência, API e o
   contrato de dados do grafo dinâmico.
6. **Testes:** 22 de unidade (sem serviços, sem custo) e 2 de integração com os serviços reais.

## 2. Base de conhecimento: antes e depois

| | Manus | F.R.E.Y.A. |
|---|---|---|
| Documentos | 37 resumos | 156 (119 páginas oficiais coletadas + os 37 resumos da Manus; 8 páginas de obras fora da cronologia saíram) |
| Entidades | 236 (com 11 colisões personagem/obra) | 807, com identidade tipada |
| Relações | 269 (81 de lista, ~100 de equipe, ~75 narrativas) | 2.118, das quais 1.217 narrativas (595 alianças, 327 inimizades, 198 momentos de trajetória, 30 parentescos, 26 filiações…), mais 180 capacidades |
| Personagens | menções em resumos | 151, com 50 perfis on-screen completos |
| Tempo | nenhum | ano de cada obra, posição na cronologia oficial, ordem dos momentos de cada personagem |
| Captura de fonte | nenhuma | 130 páginas com data e hash (data/raw/, local) |
| Continuidade | campo `MCU` | só blocos `live_action`; 479 blocos de quadrinhos descartados; obras fora da cronologia oficial (Logan, X-Men da Fox, Deadpool 1 e 2) excluídas |

A coleta respeitou o robots.txt (nenhuma página bloqueada), com 2 s entre requisições. 87 personagens não
têm perfil on-screen em marvel.com (404); eles continuam no grafo pelas aparições e conexões.

## 3. Defeitos da Manus corrigidos

| Defeito | Correção | Verificação |
|---|---|---|
| Personagem e obra com o mesmo nome viravam um nó (Thor, Iron Man, Black Widow…) | chave `tipo:slug`, rótulo Neo4j por tipo | teste `test_migracao_da_manus_separa_identidades…` |
| Predicados duplicados e com direção trocada | ontologia com direção fixa; produção orientada pelo tipo | migração sem nenhum problema de validação |
| "Nick Fury, Director of S.H.I.E.L.D." virou direção de filme | vira `LEADS` | teste |
| Diretor de *Thor: The Dark World* atribuído a *Thor* | créditos sempre da obra da página | teste |
| Atriz "membro" da Dora Milaje | regra de domínio entre tipos | 2 fatos recusados, com motivo |
| "T'Challa" ≠ "T’Challa" | normalização Unicode | investigação real resolvida |
| Relações soltas apresentadas como conexão (Thanos × Tony Stark) | caminhos reais; "sem caminho" explícito | investigação real devolve "Iron Man inimigo de Thanos" com evidência |
| `re.search` fixo para o caso Loki/Tesseract | removido | — |
| Senha no código | só `.env`; `NEO4J_PASSWORD` obrigatória | varredura de segredos limpa |
| RRF com 5 candidatos por lista | reserva `k × 6`, limite por documento | teste |
| BM25 sem análise de idioma | campos `english` e `portuguese` | integração |

## 4. Resultados de investigações reais

| Questão | Focais | O que a análise encontrou |
|---|---|---|
| Que conexão existe entre Thanos e Tony Stark? | Thanos, Iron Man | inimizade direta com fonte; trajetória de Thanos (aliança com Loki, Orbe, Vormir, Estalo); tensão Loki × Thanos |
| Qual o futuro de Wakanda depois de T'Challa? | Wakanda, Black Panther | "governa Wakanda"; trajetória de T'Challa (Bucky, Killmonger, Batalha de Wakanda); Shuri e Killmonger como variáveis |
| Como a relação entre Thor e Loki pode evoluir? | Thor, Loki | aliados e inimigos nas fontes → incerteza crítica aliança × confronto |
| O que pode acontecer com a Feiticeira Escarlate? | Wanda Maximoff (nome em português) | trajetória (Hydra, Pietro, Lagos, guerra civil); tensão Wanda × Ultron |

## 5. Pendências e limites

1. **Modelo de linguagem: resolvido.** A chave da Luna é de um revendedor compatível com a OpenAI; com o endereço
   dele em `OPENAI_BASE_URL`, o motor gera as análises completas (modelo `gpt-5.6-terra`, 45–70 s por análise).
   O revendedor não aceita saída estruturada; o cliente passa sozinho para o modo JSON e valida a resposta.
   Nas análises de teste: 0 citações inválidas e 0 entidades desconhecidas depois da validação; os cenários
   saem como inferência ou hipótese, nunca como fato.
2. **Nome ambíguo "Captain America"** (Steve Rogers e Sam Wilson): não é fundido; fica no relatório.
3. **Obras recentes fora da lista oficial** (ex.: *Spider-Man: Brand New Day*) ficam de fora até entrarem
   na cronologia publicada pela Marvel.
4. **Fatos da Manus sem captura:** as 250 relações migradas mantêm citação e URL, mas não têm cópia da página.
   Duas citações conferidas não aparecem no HTML atual de marvel.com.
5. **Personagens sem perfil on-screen** (87) têm só conexões e aparições, sem momentos de trajetória.

## 6. Como reproduzir

```bash
cp .env.example .env   # NEO4J_PASSWORD, OPENAI_API_KEY e, se for revendedor, OPENAI_BASE_URL
docker compose up -d
pip install -e '.[dev]'
freya coletar && freya ingerir
freya investigar "Qual o futuro dos Vingadores depois de Thanos?"
pytest && pytest -m integracao
```

## 7. Exemplos com o modelo (resumo)

- **Thor × Loki:** três cenários — aliança circunstancial renovada, rivalidade persistente e trajetórias sem
  ligação demonstrada —, cada um como hipótese ou inferência, com as evidências de aliança e de inimizade.
- **Wakanda depois de T'Challa:** incertezas sobre liderança (trono e Pantera Negra juntos ou separados),
  intensidade da interferência externa e peso da tecnologia; cenários de defesa coletiva, centralidade
  tecnológica e teste de soberania. A análise registra que a base não diz quem assume o trono.
- **Thanos × Tony Stark:** inimizade recíproca e confronto em Titã confirmados; o efeito desse confronto
  sobre a busca pelas Joias fica como hipótese, porque a base não traz o resultado.


## 8. Aprofundamento da história e dos personagens (segunda rodada)

Pedido: aprofundar a história e os personagens, buscando outras fontes quando marvel.com não tivesse.

**Fontes acrescentadas**
- **marvel.com**: perfis on-screen que só estão no mapa do site (135 páginas no total; a fonte oficial se esgotou).
- **Wiki do MCU** (marvelcinematicuniverse.fandom.com, CC BY-SA 3.0, confiabilidade `wiki_fas`):
  150 de 154 personagens oficiais com a página conferida pela identidade; filiações atuais e
  antigas, parentes, aliados e inimigos com a nuance da relação, estado (vivo/morto) e a biografia em capítulos
  datados pelas obras que cita. 54 de 59 obras com enredo e aparições (5 temporadas da Netflix ficaram sem página confiável) (artefatos, locais, acontecimentos).
- **Extração dos enredos** pelo modelo: relações entre entidades já existentes, com citação literal que
  nomeia as duas pontas; cada uma com obra e ano.
- **Wikipedia**: módulo pronto, mas a Wikimedia bloqueia o acesso automatizado deste ambiente (403/429); não
  contornei o bloqueio.

**Resultado**

| | Antes | Depois |
|---|---|---|
| Documentos (trechos de busca) | 156 (427) | 5047 (12874) |
| Entidades | 807 | 5711 |
| Relações | 2.118 | 14566 |
| Parentescos | 30 | 485 |
| Filiações | 26 | 453 |
| Capítulos/momentos de trajetória datados | 198 | 1175 |
| Artefatos / locais | 5 / 10 | 490 / 461 |

**Controles de qualidade aplicados**
- identidade conferida antes de aceitar qualquer página da wiki; páginas de obra só com marcas de obra, nome
  completo igual e temporada igual (quatro escolhas erradas da busca foram detectadas e corrigidas);
- trechos que a wiki marca como de canonicidade incerta são descartados; menções, fotos e arquivos não contam
  como aparição;
- extração: 1.272 propostas do modelo (1.069 + 203); aceitas só as com citação literal que nomeia as duas entidades
  (o filtro de suporte cortou, por exemplo, "Spider-Man usa o traje" apoiado em "Parker vai à festa de Liz");
- uma entidade, um tipo: 99 entidades com dois tipos ("New Avengers" como personagem e como organização)
  foram consolidadas; regras de tipo por predicado (um artefato não é "membro" de nada);
- toda relação leva a confiabilidade da fonte; o motor pesa oficial > Wikipedia > wiki de fãs e usa o ano e a
  nuance para separar relações antigas de atuais.

## 9. Implantação (servidor com a base pronta)

- `docker compose up -d --build` sobe a API e os três bancos; a API só abre depois de `freya preparar`.
- `freya preparar`:
  - coleta marvel.com no próprio servidor, porque o conteúdo não vai para o repositório (Termos de Uso);
  - junta essa coleta com os corpora da wiki que vêm no repositório e indexa tudo;
  - grava uma assinatura dos corpora. Reiniciar não reindexa; um corpus novo no repositório reindexa.
  - Se marvel.com não devolver nenhuma página (bloqueio, rede), nada é gravado nem indexado, e a próxima subida tenta de novo.
- `GET /saude` informa o tamanho da base. Só a porta 8000 fica exposta; os bancos escutam em 127.0.0.1.
- `FREYA_CORS_ORIGENS` libera o futuro frontend.
- Teste deste ambiente: as imagens subiram com os healthchecks, e a API indexou a base e respondeu investigações.
  O CDN de marvel.com passou a recusar este ambiente (403) depois das rodadas de coleta. Para o teste, o volume
  recebeu a coleta feita antes, e a recusa não foi contornada.
