# ATLAS — Design System (MASTER)

> Fonte de verdade visual do ATLAS SaaS acadêmico. Páginas específicas podem ter regras em `pages/<pagina>.md`, que sobrepõem este arquivo.
> Gerado com a skill ui-ux-pro-max (busca `--design-system` + domínios typography, landing e color) e ajustado à identidade definida pelo Paulo (marinho, grafite, branco e azul-claro).

## Decisões e por quê
| Decisão | Motivo |
|---|---|
| **Tema claro por padrão**, escuro opcional (preferência do sistema + alternador) | Projetores de sala de aula apagam fundos escuros; a skill desaconselha "dark mode by default" para SaaS desse tipo. O app atual (escuro) vira o tema escuro. |
| **Marinho como cor de marca**, azul-claro como destaque | Identidade do projeto e padrão "Trust & Authority" (marinho/cinza; destaque só para ações). |
| **IBM Plex Serif** nos títulos da landing, **Plex Sans** no texto, **Plex Mono** nos dados | Tom acadêmico sem trocar de família (coerência com o app). Descartados: Calistoga (informal) e Crimson Pro/Atkinson (boa leitura, mas quebram a identidade). |
| **Vidro (backdrop-blur) só na barra de navegação fixa** | A skill sugeriu glassmorphism; em leitura densa ele prejudica o contraste. |
| Densidade 6/10 no app, 4/10 na landing | Dados densos no app; landing arejada. |

## Tokens de cor
| Papel | Claro | Escuro | Uso |
|---|---|---|---|
| `--fundo` | `#F6F8FB` | `#0B1424` | fundo da página |
| `--painel` | `#FFFFFF` | `#111C30` | cartões |
| `--painel-2` | `#EEF2F8` | `#18263E` | áreas secundárias |
| `--borda` | `#D5DDE8` | `#2C3A52` | grafite azulado |
| `--texto` | `#0F1B2D` | `#E8EEF7` | texto principal |
| `--suave` | `#4A5A72` | `#A0AFC7` | texto secundário (≥ 4.5:1 nos dois temas) |
| `--marca` | `#13294B` | `#0B1424` | hero, rodapé, cabeçalhos de seção |
| `--acento` | `#1F6FD1` | `#6AB6FF` | links, foco, botão primário (no claro, `#6AB6FF` não dá contraste com texto branco) |
| `--baixo` / `--moderado` / `--alto` | `#13865F` / `#A46A00` / `#C23B3B` | `#5CC79E` / `#ECB854` / `#F47878` | níveis de risco, sempre com rótulo em texto |

Regras: nunca usar hex direto nos componentes (só tokens); a cor nunca é a única pista (nível sempre escrito); foco sempre visível (anel `--acento`, 2px, offset 2px).

## Tipografia
- Títulos de landing: **IBM Plex Serif** 600, `text-wrap: balance`, escala 48/36/28/22.
- Interface e texto: **IBM Plex Sans** 400/500/600, base 16px, entrelinha 1.5, linhas de até ~70 caracteres.
- Dados, índices, códigos de turma: **IBM Plex Mono** 400/500, algarismos tabulares.
- Rótulos: 11–12px, maiúsculas, `letter-spacing: .08em`.
- Fontes locais via @fontsource (sem chamadas a terceiros, compatível com LGPD).

## Espaçamento e forma
- Escala: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Raio: 8px (controles), 12px (cartões), 999px (selos).
- Alvos de toque ≥ 44×44px; espaço ≥ 8px entre alvos.
- Breakpoints: 375, 768, 1024, 1440; sem rolagem horizontal.

## Padrão da landing (Trust & Authority)
1. **Hero (marinho):** missão em uma frase, subtítulo "análise condicional, não previsão", CTA "Criar turma" (professor) e "Entrar com código" (aluno), prévia real de um resultado.
2. **Credibilidade:** método transparente (fórmula visível), fontes rastreáveis, verificação em rodadas, origem acadêmica (FECAP), uso gratuito.
3. **Como funciona:** 3 agentes + motor determinístico, em 4 passos.
4. **Em sala de aula:** professor cria turma → alunos entram com código → comparam premissas → discussão.
5. **Exemplo de resultado:** separação fato/interpretação/premissa/hipótese.
6. **FAQ:** "é previsão?", "é grátis?", "quais dados guardam?", "funciona no projetor?".
7. **CTA final + rodapé:** termos, privacidade, código-fonte.

## Movimento (skill animate — filosofia de Emil Kowalski)
Curvas oficiais (não inventar outras): `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` · `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`. No Tailwind: `ease-out` e `ease-in-out` já apontam para elas.

| Elemento | Frequência → decisão | Propósito | Receita |
|---|---|---|---|
| Troca de tema | rara, mas mexe em centenas de elementos | — | **Sem animação** (troca instantânea; transicionar cores de tudo pesa) |
| Botões | dezenas/dia | feedback | `scale(.97)` no `:active`, 160ms ease-out; cores 150ms `ease` |
| Abas de cenário | dezenas/dia | — | **Sem animação** (conteúdo troca na hora) |
| Painel de agentes / eventos | ocasional | indicação de estado | eventos entram com `entrar` 240ms; barra do agente ativo pulsa (opacidade) |
| Barras de índice | ocasional | indicação de estado | `transform: scaleX()` 250ms ease-out — **nunca `width`** |
| Seções ao abrir uma página | ocasional | evitar troca brusca | `entrar`: opacidade + `translateY(6px)`, 240ms |
| Landing: hero | primeira visita | explicação | título → subtítulo → CTAs em stagger de 60ms, 240ms cada; nada bloqueia o clique |
| Landing: seções | primeira visita | explicação | revelação por rolagem **uma vez** (IntersectionObserver), `clip-path` 600ms ease-in-out; nunca no app logado |
| Landing: prévia de resultado | primeira visita | explicação | troca de cenário automática **pausável**, 250ms ease-in-out; para com foco, hover ou movimento reduzido |

Regras: só `transform`, `opacity` e `clip-path`; nada acima de 300ms na interface (landing pode mais); hover com movimento só em `@media (hover: hover) and (pointer: fine)`; movimento reduzido = fades curtos, sem deslocamento nem pulso (não é zero).

## Anti-padrões (evitar)
- Emojis como ícones (usar SVG, ex.: Lucide).
- Tema escuro forçado; texto cinza sobre cinza.
- Parallax e animações longas na landing.
- Probabilidades numéricas ou gráficos que sugiram previsão.
- Placeholder como único rótulo de campo.

## Checklist antes de entregar
- [ ] Contraste ≥ 4.5:1 nos dois temas
- [ ] Foco visível e navegação completa por teclado
- [ ] `prefers-reduced-motion` respeitado
- [ ] Responsivo em 375 / 768 / 1024 / 1440, sem rolagem horizontal
- [ ] Alvos ≥ 44px; `cursor-pointer` em clicáveis
- [ ] Nenhum dado de turma/aluno indexável (app fora do SEO)
