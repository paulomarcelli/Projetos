# Projeto Iris: interface

Interface web do Projeto Iris: React 19, Vite, TypeScript e Tailwind CSS 4, com os tokens de design
centralizados em `src/styles/index.css`.

![Landing](docs/capturas/landing-desktop.png)

## Telas e endereços

| Endereço | Tela |
|---|---|
| `/` | Landing: missão, três dimensões, método (com o estado real de cada etapa), linguagem epistêmica, estado do projeto |
| `/entrar` | Login (veja a nota abaixo) |
| `/app` | Início: nova investigação, investigações recentes e base científica |
| `/app/investigacoes` | Nova investigação e rascunhos |
| `/app/investigacoes/:id` | Resultado de uma investigação: Visão geral (mapa), Cenários, Linha do tempo e Fontes. Sem API ainda: fora da prévia, mostra um estado vazio |
| `/app/base-cientifica` | Painel da base (indicadores, anos de publicação, completude dos metadados, idiomas) e pesquisa de fontes |
| `/app/base-cientifica/:id` | Leitor da fonte: texto por página, ficha bibliográfica com a origem de cada campo, integridade |
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
- **Navegação enxuta, pelas tarefas de quem pesquisa:** Início, Investigações e Base científica;
  depois Favoritos e Configurações. Mapa, cenários, linha do tempo e sinais ficam dentro de cada
  investigação. Os endereços antigos `/app/mapas`, `/app/cenarios` e `/app/sinais` levam a
  Investigações.
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

Organizado pelas tarefas de quem pesquisa, em quatro áreas (`src/components/resultado/`):

| Área | O que mostra |
|---|---|
| **Visão geral** | Mapa de relações entre países (principal ferramenta), síntese, principal incerteza e a faixa de vistas Hoje → A → B → C |
| **Cenários** | Os dois fatores que separam os futuros (barras com a posição de cada cenário); um cartão por cenário com nome, ideia central, horizonte, impacto principal e sinais; detalhes e comparação sob demanda |
| **Linha do tempo** | Vertical, com divisor "Hoje": passado em traço contínuo, futuro hipotético em traço âmbar. Um único filtro: o cenário |
| **Fontes** | Fontes principais (critério: quantos elementos sustentam), afirmações com as fontes e a lista completa sob demanda |

- **Método, premissas, limitações e revisões** não ocupam uma aba: abrem no painel lateral pelo botão "Como esta análise foi feita".
- **Painel contextual:** selecionar país, conexão, evento ou citação abre o painel com o essencial e a cadeia de rastreabilidade.
- **Mapa:**
  - Só países no mapa. Blocos aparecem como regiões, cada uma com contorno próprio.
  - A legenda fica sobre o mapa e também filtra as categorias.
  - Uma dica aparece ao passar o cursor ou focar com o teclado.
  - Pulsos em movimento mostram o sentido só em influência e dependência.
  - Linhas sem marca são documentadas; ◌ indica inferência e ◇, hipótese do cenário.
  - A troca de cenário move os países e transforma as linhas. Com "reduzir movimento", a troca é instantânea e não há pulsos.
- Nada mostra probabilidade, peso ou índice numérico.

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
