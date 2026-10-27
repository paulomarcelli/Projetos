# Projeto Iris: interface

Interface web do Projeto Iris: React 19, Vite, TypeScript e Tailwind CSS 4, com os tokens de design
centralizados em `src/styles/index.css`.

![Landing](docs/capturas/landing-desktop.png)

## Telas e endereços

| Endereço | Tela |
|---|---|
| `/` | Landing: missão, três dimensões, método (com o estado real de cada etapa), linguagem epistêmica, estado do projeto |
| `/entrar` | Login (veja a nota abaixo) |
| `/app` | Início: nova investigação, investigações recentes, base científica, cenários e sinais |
| `/app/investigacoes` | Trilha do método, nova investigação e rascunhos |
| `/app/investigacoes/:id` | Resultado de uma investigação prospectiva, em 6 abas que seguem o fluxo da análise: Sistema (mapa de atores), Fatores de mudança, Cenários, Linha do tempo, Evidências e Método e revisão. Sem API ainda: fora da prévia, mostra um estado vazio |
| `/app/base-cientifica` | Painel da base (indicadores, anos de publicação, completude dos metadados, idiomas) e pesquisa de fontes |
| `/app/base-cientifica/:id` | Leitor da fonte: texto por página, ficha bibliográfica com a origem de cada campo, integridade |
| `/app/mapas` | Mapas e relações: mapa-múndi, tipos de relação e camadas previstas |
| `/app/cenarios` | Quadro de comparação de trajetórias e como ler um cenário |
| `/app/sinais` | Tabela de sinais e critérios de um sinal |
| `/app/favoritos` | Fontes marcadas |
| `/app/configuracoes` | Estado do sistema e acesso à gestão do acervo |
| `/app/configuracoes/acervo` | **Gestão do acervo** (administração): envio de PDFs, lista com filtros e remoção |
| `/app/design-system` | Referência visual |

**Documentos não estão no menu principal.** Quem pesquisa consulta as fontes na Base científica (é
para lá que as citações vão apontar). Enviar e remover PDFs é tarefa de administração, em
Configurações → Gestão do acervo. Os endereços antigos `/documentos` são redirecionados.

**Login.** O servidor ainda não tem autenticação. A tela `/entrar` valida e-mail e senha, mas não
finge entrar: ela explica que nenhuma senha foi verificada e oferece o acesso aberto de
desenvolvimento. Contas, recuperação de senha e permissões chegam quando a autenticação existir na
API.

## Direção de design

**Conceito:** compreender as relações de poder do presente para investigar os futuros possíveis da
ordem internacional. A interface é um gabinete de análise noturno: fundo cartográfico, painéis
institucionais, linhas finas de coordenadas e tipografia editorial.

- **Cores com significado fixo.** O ciano marca interação, conexão e vínculo com uma fonte. O âmbar
  marca incerteza, hipótese e horizonte. Verde e vermelho aparecem só em estados reais do sistema
  (no ar, falha), nunca como decoração.
- **Tipografia.**
  - Source Serif 4 para títulos e texto analítico.
  - IBM Plex Sans para a interface.
  - IBM Plex Mono para dados, hashes e a origem dos números.
  - Números sempre tabulares. As fontes ficam no pacote, sem chamadas externas.
- **Linguagem epistêmica.** Sete marcadores, cada um com forma e rótulo próprios (não só cor):
  fato observado, evidência documental, inferência analítica, hipótese, cenário condicional,
  incerteza e limitação metodológica. Aparecem no início, na ficha de cada documento (a origem de
  cada metadado), nos estados vazios e nas limitações.
- **Símbolo.** Um globo visto como íris. Meridiano e equador formam o sistema de coordenadas (o
  presente mapeado); o arco ciano é a abertura do diafragma (o olhar adiante).
- **Navegação pela estrutura intelectual:** Início, depois *Presente* (Investigações, Base
  científica, Mapas e relações), *Futuros* (Cenários, Sinais) e *Acervo* (Documentos, Favoritos,
  Configurações).
- **Movimento.** Só anima o que tem função:
  - toque (140 ms, escala 0,97);
  - cor (180 ms);
  - cone de incerteza que acompanha o horizonte (240 ms);
  - gaveta e notificações, que entram e saem pelo mesmo caminho (400/200 ms);
  - uma única cena de entrada na landing, em que as trajetórias se abrem do presente para o
    horizonte.

  Busca pelo teclado, troca de página no leitor e gráficos não animam. Com "reduzir movimento",
  fica só a opacidade. Curvas e durações são tokens em `src/styles/index.css`.

A referência completa (cores, tipos, marcadores, componentes) fica na rota `/design-system`.

## Resultado de uma investigação prospectiva

A prospectiva estratégica organiza a tela. O formato está em `src/lib/investigacao.ts` e os
componentes ficam em `src/components/resultado/`.

- **Sistema** (`MapaDeAtores`): é a porta de entrada.
  - Atores com forma própria por tipo: Estado, organização, instituição e grupo.
  - Seis categorias de relação, cada uma com traço próprio.
  - Uma marca no meio de cada conexão diz se ela é documentada, inferida ou condicional ao cenário.
  - Interações: zoom e arraste com mouse, toque e botões; filtros por região, tipo de ator, categoria, tema e base; vista "Presente" ou cenário A/B/C, com halo no que muda.
  - Há uma lista em texto como alternativa ao mapa.
- **Painel contextual** (`PainelContextual`):
  - Para atores e conexões, mostra identificação, papel, interesses e capacidades, relações, evidências, incertezas e implicações por cenário.
  - Para evidências, mostra a cadeia Afirmação → Evidência → Fonte (com trecho literal) → Interpretação → Implicação, e onde ela é usada.
  - Tem histórico para voltar ao item anterior. No celular vira folha inferior e mantém o mapa visível.
- **Fatores de mudança**: as incertezas críticas (com a posição de cada cenário), as variáveis-chave (estado atual com evidência e direção por cenário) e as tendências.
- **Cenários**:
  - Saem de uma matriz de duas incertezas críticas, não de três textos soltos.
  - Cada um segue a mesma estrutura: síntese, premissas, mecanismos causais, tendências, variáveis, atores decisivos, gatilhos, condições, consequências no mapa-múndi, indicadores, evidências a favor e contra, limitações e condições de revisão.
  - Há uma tabela que compara A, B e C pelos mesmos critérios.
- **Linha do tempo**:
  - Quatro categorias com formas distintas: observado (sólido), inferido (tracejado), condicional (losango âmbar) e projetado (tracejado âmbar, em itálico).
  - Filtros por cenário, horizonte, ator e categoria.
  - No celular, um horizonte por vez.
- **Evidências**:
  - As 4 fontes principais são escolhidas por um critério explícito: quantos elementos da análise elas sustentam.
  - "Ver todas as fontes" mostra natureza, gênero, trecho, limitação e o que cada fonte sustenta.
- **Método e revisão**: métodos marcados como aplicado, parcial ou não aplicado; premissas, limitações e registro de revisões.

Nada mostra probabilidade, peso ou índice de influência. O mapa de atores e os mecanismos causais
respondem a perguntas diferentes: os mecanismos aparecem nos cenários, como cadeias condição →
mecanismo → consequência, e não como um segundo diagrama.

## O que é real e o que ainda não existe

| Área | Situação |
|---|---|
| Gestão do acervo (envio, lista, filtros, remoção) e leitor de fontes | **Real**: usa a API (`/documents`) |
| Base científica (indicadores, anos, completude, idiomas, busca de fontes) | **Real**: cada número mostra a sua origem (`fonte GET /documents → total`); distribuições usam os 100 documentos mais recentes e dizem isso |
| Estado do sistema | **Real**: `/health/ready` |
| Nova investigação | Formulário completo, com mapa de escopo, horizonte, dimensões e profundidade. **O motor ainda não existe**: a pergunta é salva como *rascunho neste navegador*, e a tela diz isso |
| Favoritos | Reais, mas guardados só neste navegador |
| Investigações processadas, cenários, sinais, mapas de relações | **Sem API ainda.** Mostram a estrutura do painel (quadro de cenários, tabela de sinais, mapa e tipos de relação) vazia e marcada como vazia; nenhum dado é simulado |
| Login | Só interface; a API não tem autenticação |
| Busca global | Procura em documentos (os 100 mais recentes) e rascunhos. Avisa que países, atores e eventos ainda não estão indexados |

## Executar

Pré-requisito: a API rodando em `http://127.0.0.1:8000` (veja o README da raiz).

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 (proxy para a API: /documents e /health)
```

Para outra porta ou máquina da API: `API_URL=http://host:porta npm run dev`.

Build de produção (`dist/`):

```bash
npm run build
npm run preview        # serve o build em http://localhost:4173, com o mesmo proxy
```

Prévia estática (sem servidor, para mostrar a interface):

```bash
npm run build:previa   # gera dist-previa/ com caminhos relativos e MemoryRouter
```

A prévia usa `src/previa/snapshot.json`, uma cópia dos documentos de exemplo exportada da API.
Ela também traz um **exemplo de resultado de investigação** (`src/previa/investigacao-exemplo.ts`):
um contrafactual sobre a eleição de 2026, elaborado por um assistente de IA com fontes reais lidas na íntegra (os trechos são literais), e não produzido pelo motor. Ele
aparece marcado como "simulação ilustrativa" e mostra o formato que o motor deverá devolver
(`src/lib/investigacao.ts`). Na prévia publicada, o endereço com `#investigacao` abre direto nele.
Ela mostra um selo de "prévia", e o envio e a remoção ficam desativados. O build normal não inclui
nada disso.

Em produção, sirva `dist/` e a API **na mesma origem** (por exemplo, atrás de um proxy reverso),
ou defina `VITE_API_BASE` no build e habilite CORS na API.

## Testes e verificações

```bash
npm test               # vitest: formatação, cliente da API, formulário, rascunhos, base científica, login, landing, rotas
npm run typecheck
```

### Dados de pior caso (só em desenvolvimento)

Com `npm run dev`, um alternador no rodapé troca a fonte dos documentos entre:

- **API real**;
- **Pior caso**: 1.284 documentos, títulos de 180 caracteres, nomes compostos, árabe, chinês e
  vietnamita, arquivos sem título, falhas e um documento de 1.284 páginas;
- **Vazio**;
- **Um item**.

Também funciona pela URL: `?dados=pior`, `?dados=vazio` ou `?dados=um`. Esses dados não entram no
build de produção.
