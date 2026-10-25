# Auditoria: o que os PDFs pedem × o que o design entrega

**Fontes conferidas:**
- `PI_2ADS_202602_KFKA_FINAL.pdf` (requisitos, regras de negócio, RNF e entregas por disciplina);
- `Apresentação PI - 2026.2` (Prof. José Carlos Buesso Jr). Os slides indicam referências (Sponte, TOTVS, Kaits, ClipEscola, TutorMundi, Lyceum) e o processo de criação: associações, brainstorm, caixa morfológica e moodboard.

Escopo: **somente design**. Backend, banco, API, Postman, deploy e as entregas de Estrutura de Dados, Banco de Dados e POO ficam de fora.

Legenda:
- ✅ já estava atendido;
- 🆕 lacuna encontrada e corrigida nesta revisão;
- 📌 atendido no design, mas depende da fase funcional para funcionar de verdade.

## Entregas de Design de Interface Digital
| Entrega | Pedido | Situação | Onde |
|---|---|---|---|
| E1 | Layout e prototipação da Home no Figma | ✅ | Figma + `#/` |
| E1 | Paleta de cores coerente, **acessível e justificada** | 🆕 justificativa (60-30-10) e tabela de contraste WCAG; `text-muted` escurecido para passar AA (era 4,28:1 e passou a 4,94:1) | `#/design` |
| E1 | Guia de estilo: tipografia, **espaçamentos, alinhamentos, ícones e interações** | 🆕 escala de espaço, raios, sombras, grid/breakpoints, catálogo de ícones e estados (hover, foco, desabilitado) | `#/design` |
| E2 | Mapa de navegação | ✅ no Figma · 🆕 também no site, clicável | `#/mapa` |
| E2 | Prototipação navegável de todas as páginas | ✅ (43 telas no Figma + protótipo em código) | `#/entrar` |
| E2 | Design System | ✅ | `#/design` |
| Aulas | Associações, brainstorm, caixa morfológica, moodboard, logotipo | 🆕 novo símbolo com conceito e todo o processo documentado | `#/marca` |

## Requisitos funcionais (visão de interface)
| ID | Requisito | Situação |
|---|---|---|
| RF01 | Login, **logout**, recuperação de senha, perfis | ✅ · 🆕 "Sair" com confirmação e tela de sessão expirada |
| RF02 | Cadastros, incluindo **áreas de disciplina** | ✅ · 🆕 modal "Nova área" (faltava) |
| RF03 | Vínculos, impedindo **incompatíveis** ou duplicados | ✅ duplicado · 🆕 incompatível (professor não habilitado na disciplina) |
| RF04 | Data e hora de abertura e encerramento dos 4 bimestres | ✅ · 🆕 validação (formato e encerramento depois da abertura) |
| RF05 | Descrição, média validada e múltiplas tags | ✅ |
| RF06 | Rascunho → envio → revisão → alteração → devolução → publicação | ✅ |
| RF07 | Autor, revisor, datas e **versões** | ✅ · 🆕 "Comparar versões" (antes × depois) quando a coordenação ajusta o texto |
| RF08 | Família só vê alunos vinculados e relatórios publicados | ✅ (testado) |
| RF09 | **Gerar ou baixar** o PDF | ✅ impressão A4 · 🆕 botão "Baixar PDF" com geração simulada 📌 |
| RF10 | Indicadores (admin) e **retornos das famílias** (professor) | ✅ · 🆕 o professor passa a ver as observações das famílias |
| RF11 | Exportação .xlsx/.csv | ✅ simulada 📌 |
| RF12 | Ciência + observação **visível ao professor e ao administrador** | 🆕 bloco "Retorno da família" no registro do professor e na revisão da coordenação (antes só a família via) |

## Requisitos não funcionais (parte de interface)
| RNF | Situação |
|---|---|
| Responsividade (desktop, tablet, celular) | ✅ testado em 1366, 820 e 390px, sem rolagem horizontal |
| Usabilidade e acessibilidade (feedback, contraste, teclado, rótulos) | ✅ · 🆕 contraste AA corrigido e documentado |
| Segurança: sessões com expiração | 🆕 tela de sessão expirada 📌 |
| LGPD (consentimento, restrição de acesso) | ✅ |
| Desempenho: paginação | ✅ |

## Etapas da skill *criar-sites-com-ia* aplicadas
1. **Briefing/PRD:** `docs/PRD.md`
2. **Referências:** seção 5 do PRD + `#/documentacao`
3. **Prompt para protótipo (Stitch):** `docs/prompt-stitch.md`, opcional, porque o Figma já existe
4. **Geração:** `CLAUDE.md` + código atualizado
5. **SEO:** `agents/seo.md`; Open Graph e favicon no `index.html`; um `<h1>` por tela (testado)
6. **Segurança:** `agents/seguranca.md`. A revisão do código não encontrou problemas: textos do usuário passam por `KFKA.esc()` e não há segredos no código. **A publicação no GitHub/hosting ainda não foi feita (aguarda a equipe).**

## Ainda pendente (fora do código)
- Replicar no **Figma** o novo símbolo, a página de marca e os blocos "Retorno da família", "Nova área" e "Sessão expirada", para que o arquivo oficial da Entrega 2 fique igual ao protótipo.
- O moodboard e o brainstorm foram montados pela IA como proposta. Se a equipe fizer a sessão de verdade (com post-its), vale trocar pelos resultados reais.
