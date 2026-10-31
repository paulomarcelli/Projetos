# Disney — Where Magic Becomes Reality · Design System (Figma)

Plugin de desenvolvimento que **constrói o Design System inteiro dentro de um arquivo do Figma**:
9 páginas, variáveis (cores claro/escuro, espaçamento, raio, motion), text styles, effect styles,
30 ícones como componentes, componentes com variantes e propriedades, protótipos de movimento e a
aplicação prática (home desktop e mobile).

> Projeto acadêmico conceitual, sem afiliação com The Walt Disney Company. A assinatura oficial
> (logotipo) e os personagens não são reproduzidos: o wordmark e as artes são conceituais.

## Como rodar (5 minutos)

1. Abra o **Figma para desktop** (importar plugin local não funciona no navegador).
2. Abra o arquivo criado para o projeto: https://www.figma.com/design/CAnZe6b1glepPTKRnhPk3Q
   (ou qualquer arquivo de design novo).
3. Menu **Plugins → Development → Import plugin from manifest…** e escolha o `manifest.json` desta pasta.
4. Rode **Plugins → Development → Disney DS Builder (acadêmico)**. Leva de 30 s a 2 min.
5. Ao terminar, aparece "Design System construído". Se alguma etapa falhar, o resto é construído e um
   **relatório de construção** aparece na página Cover, com o nome da etapa e o erro.

Pode rodar de novo: ele recria as páginas que ele mesmo criou e atualiza variáveis e estilos pelo nome.
O plugin não acessa a internet.

## O que é criado

| Página | Conteúdo |
|---|---|
| Cover | Capa 1920×1080, conceito, índice e aviso legal |
| Brand Strategy | Empresa, fundação e evolução (10 marcos), segmentos, produtos e serviços, diferenciais, personalidade, posicionamento completo e fontes |
| Persona | Mariana Albuquerque, 36: perfil, interesses, hábitos, relação com a marca, necessidades, dores, motivações, canais e jornada pelo ecossistema |
| Voice & Tone | Traços da voz, princípios, vocabulário, tom por contexto, exemplos adequados/inadequados e microcopy de interface |
| Foundations | Paleta (HEX e RGB) ligada às variáveis, tokens semânticos claro/escuro, estados de interação, comparação Light × Dark, tipografia (Fraunces + Manrope), espaçamento 8 px, grids (desktop 12, tablet 8, mobile 4), formas e profundidade |
| Iconography | Construção (grade 24, área 20, traço 1,5), regras e biblioteca de 30 ícones |
| Components | Button (4 estilos × 5 estados), Icon Button, Chip, Badge, Input, Nav Link, Header (desktop/mobile), Media Card, Experience Card, Franchise Tile, Section Header, Footer, Toast, Sparkle Loader, Doc/Chapter Header e 13 artes |
| Motion | Princípios, durações, curvas (Pixie, Curtain, Glow, Spring), comportamentos, menos movimento e protótipos (Playground e transição A→B) |
| Application | Home desktop 1440 e mobile 390 (modo escuro), só com instâncias do sistema |

Variáveis: `DS · Primitives`, `DS · Color` (Light/Dark), `DS · Spacing`, `DS · Radius`, `DS · Motion`,
com escopos e sintaxe de código `var(--…)`.

## Desenvolvimento

```bash
npm install
npm run build        # gera dist/code.js (TypeScript com os tipos oficiais do Figma)
node test/mock-figma.js   # roda o plugin num simulador da API e lista erros
```

O simulador imita as regras que mais derrubam plugins (fonte carregada antes de texto, FILL/HUG só em
auto layout, chaves de propriedades de componente, filhos de instância imutáveis, destinos de reação).
Ele não desenha nada: a verificação visual é no Figma.

## Fontes do conteúdo

- The Walt Disney Company — About / Our Businesses (thewaltdisneycompany.com/about)
- D23, The Official Disney Fan Club — Disney History (d23.com/disney-history)
- The Walt Disney Company — Form 10-K, ano fiscal de 2024 (sec.gov)
- Walt Disney Archives
- Frank Thomas e Ollie Johnston, *The Illusion of Life: Disney Animation* (1981), para os princípios de movimento
