# PRD — KFKA · Plataforma de Acompanhamento Escolar

> Etapa 1 da skill *criar-sites-com-ia*. Preenchido a partir do documento oficial (PI_2ADS_202602_KFKA_FINAL) e da apresentação do Prof. José Carlos Buesso Jr (Design de Interface Digital). Itens não definidos nos documentos aparecem como `[a definir]`.

## 1. Visão geral
- **O que é:** aplicação web responsiva para registrar, revisar, publicar e acompanhar o desenvolvimento bimestral de alunos do Ensino Fundamental.
- **Para quem:** três perfis — Administrador da escola (coordenação), Professor e Pai/Responsável.
- **Objetivo principal:**
  - o professor registra e envia o acompanhamento;
  - a coordenação revisa e publica;
  - a família consulta, registra ciência e gera o PDF.
- **Tipo:** aplicação com login e dados. Nesta fase, o objetivo é **só o design**: protótipo navegável com dados fictícios e ações simuladas.

## 2. Diferencial
- Fluxo editorial visível para todos: Rascunho → Enviado → Em revisão → Publicado, com as saídas Devolvido e Cancelado.
- A família só vê o que foi revisado e publicado, e apenas dos alunos vinculados a ela.
- Linguagem pedagógica acolhedora. As tags descrevem o que foi observado em sala e não são diagnósticos.

## 3. Estrutura (telas e seções)
| Tela | Seções | Objetivo |
|---|---|---|
| Home | Hero com mock do app, como funciona (4 etapas), perfis, segurança/LGPD, CTA | Apresentar a plataforma e levar ao login |
| Entrar / Login / Recuperar senha | Escolha de perfil, credenciais, 3 passos de recuperação | RF01 |
| Coordenação | Painel, Alunos, Professores, Responsáveis, Turmas, Áreas e disciplinas, Tags, Vínculos, Períodos, Revisão, Relatórios, Auditoria | RF02–RF04, RF06, RF07, RF10, RF11 |
| Professor | Painel, Minhas turmas, Turma, Aluno, Novo acompanhamento, Prévia, Meus registros, Detalhe/ajuste | RF05, RF06, RF10 |
| Família | Seleção do aluno, Painel por bimestre, Relatórios, Detalhe com ciência e observação, Histórico, Impressão/PDF | RF08, RF09, RF12 |
| Documentação | Design System, Marca, Mapa de navegação, Pesquisa e matriz | Entregas de Design de Interface Digital |

## 4. Identidade visual
- **Estilo:** educacional, moderno e acolhedor. Usa superfícies claras, cantos arredondados e um acento de cor por vez.
- **Paleta:**
  - tinta #1B3A4B (marca);
  - teal #0B7285 (secundária);
  - céu #74C0FC (acento);
  - azul de ação #2A5CFF;
  - sol #FFC94A e menta #5FD4A8 (destaques);
  - fundo #F3F9FA;
  - texto #0B2E3C.
- **Fontes:** Bricolage Grotesque (títulos), Plus Jakarta Sans (texto), JetBrains Mono (médias e números).
- **Tom de voz:** claro, respeitoso e positivo. Escrito para famílias, sem jargão técnico.

## 5. Referências
| Referência | O que aproveitar |
|---|---|
| Seesaw (seesaw.com/pt-br) | Escolher o papel antes do login, portfólio da família como álbum, confirmação de leitura |
| ClipEscola (slide do professor) | Hero com o app no celular e balões de mensagem. CTA em amarelo de alto contraste |
| Lyceum (slide do professor) | Cartões de números sobrepostos ao print do sistema. Checklist de benefícios no hero |
| TutorMundi (slide do professor) | Tags em pílula, títulos fortes e arredondados |
| Moodboard "The Cutting Edge" (slide) | Paleta primária fria (azuis e teal) + secundária quente (amarelo e laranja). Iconografia em formas geométricas |

## 6. Conteúdo
- Os dados fictícios ficam em `js/data.js`:
  - a Escola Municipal Aurora;
  - 6 turmas, 8 disciplinas em 4 áreas;
  - 7 professores, 7 responsáveis e cerca de 15 alunos;
  - 45 relatórios em todos os estados.
- Textos de interface em pt-BR.

## 7. Requisitos técnicos
- **Stack desta fase:** HTML + CSS + JS puro (SPA por hash), sem backend.
- **Stack da fase funcional:** Node/Express + MySQL, trocando `KFKA.api` por `fetch()`.
- **Responsivo:** sim (desktop, tablet e celular).
- **SEO importante?** Só na home pública. As áreas logadas não devem ser indexadas.
- **Formulários / dados sensíveis?** Sim, dados de crianças e adolescentes (LGPD). No protótipo tudo é fictício.
- **Onde publicar:**
  - Nesta fase: Artifact do Claude ou GitHub Pages `[a definir pela equipe]`.
  - Sistema final: nuvem `[a definir]`.

## 8. Fora do escopo (nesta fase)
- Backend, banco, API e autenticação real.
- Persistência, exportação real (.xlsx/.csv) e geração real de PDF.
- Envio de e-mails e notificações reais.
