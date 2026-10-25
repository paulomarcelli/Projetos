# PRD — ATLAS SaaS (rascunho v1)

> Rascunho da Etapa 1 (Briefing e PRD). Itens marcados `[a definir]` dependem de decisão do Paulo.
> Base: o ATLAS atual (demo acadêmica FECAP) — React + FastAPI + SQLite, agentes Researcher/Analyst/Verifier,
> motor determinístico, roteador de modelos (Gemini, Groq, Ollama, OmniRoute) e busca GDELT/Tavily.

## 1. Visão geral
- **O que é:** plataforma online de simulação geopolítica condicional — o usuário configura um cenário e agentes de IA geram cenários, impactos e riscos com fontes rastreáveis.
- **Para quem:** público acadêmico — professores e estudantes de Relações Internacionais, Economia, Comércio Exterior e áreas afins.
- **Objetivo principal:** o professor cria uma turma e convida os alunos; os alunos rodam simulações, comparam premissas e discutem os resultados em aula.
- **Tipo:** aplicação com login e dados (contas, turmas, histórico). **Gratuita** — sem cobrança.

## 2. Diferencial
- Separa sempre **fatos verificados / interpretações / premissas / hipóteses / incertezas**.
- **Motor determinístico** transparente (fórmula visível) + três agentes com ciclo de verificação.
- Fontes rastreáveis com link e data; nunca inventa citações; avisa quando não há fontes.
- Roteamento entre modelos gratuitos (custo de IA baixo ou zero).
- Comparação entre simulações e histórico.
- **Posicionamento:** ferramenta didática de análise condicional (não previsão): ensina a separar fato, interpretação, premissa e hipótese.
- **Turmas:** o professor acompanha as simulações dos alunos e propõe cenários para a turma.

## 3. Estrutura (telas e seções)
| Tela | Seções | Objetivo da tela |
|------|--------|------------------|
| Landing page (nova, pública) | Hero, como funciona (3 agentes + motor), exemplo de resultado, uso em sala de aula, casos, FAQ, rodapé | Explicar o produto e levar ao cadastro do professor/aluno |
| Cadastro / Login (nova) | E-mail e senha, recuperação de senha, entrada por convite de turma (link/código) | Criar conta ou entrar numa turma |
| Turmas (nova) | Professor: criar turma, código/link de convite, membros, simulações da turma, cenário proposto pelo professor. Aluno: suas turmas | Organizar o uso em aula |
| Painel (existe) | Resumo, casos, simulações recentes, turmas, uso do limite do mês (novo) | Ponto de partida |
| Nova simulação (existe) | Caso, variáveis, horizonte, premissas | Configurar |
| Execução (existe) | Agentes ao vivo, linha do tempo | Acompanhar |
| Resultado (existe) | Resumo, cenários, impactos, atores, matriz, fontes, verificação, motor | Entregar a análise |
| Comparar e Histórico (existem) | Filtro por turma e por aluno (professor) | Revisar e comparar, agora por usuário/turma |
| Conta (nova) | Dados pessoais, senha, uso do limite mensal, exclusão da conta (LGPD) | Gerenciar a conta |
| Admin (nova, interna) | Usuários, uso de IA, provedores, limites | Operar o serviço |
| Termos e Privacidade (nova) | Termos de uso, política de privacidade (LGPD) | Obrigatório para SaaS |

## 4. Identidade visual
- **Estilo:** profissional, denso em dados (dashboard), sóbrio — o atual. [a definir: manter ou renovar para a landing]
- **Paleta atual:** fundo #0B1424, painel #111C30, borda grafite #2C3A52, texto #E8EEF7, acento azul-claro #6AB6FF; níveis baixo #5CC79E / moderado #ECB854 / alto #F47878.
- **Fontes:** IBM Plex Sans / IBM Plex Mono.
- **Tom de voz:** analítico, claro, sem sensacionalismo; sempre "condicional, não previsão".
- **Nome / domínio:** [a definir — manter "ATLAS"? domínio?]

## 5. Referências
| Referência | O que aproveitar |
|-----------|------------------|
| [a definir — Etapa 2] | |

## 6. Conteúdo
- Já existe: 5 casos de estudo, textos de método (fórmula, limitações), README.
- [a definir] textos da landing, preços, termos/privacidade, logo.

## 7. Requisitos técnicos
- **Stack:** front React + TS + Vite + Tailwind (existe); back FastAPI (existe).
  Mudanças para SaaS: autenticação, papéis (professor/aluno/admin), turmas com convite, dados por usuário/turma, PostgreSQL no lugar de SQLite, limites por plano, fila de simulações.
- **IA:** roteador de modelos; OmniRoute como gateway opcional (instalação pendente de autorização nesta sessão).
- **Responsivo:** sim (já é).
- **SEO importante?** sim para a landing; o app (logado) fica fora da indexação.
- **Formulários / dados sensíveis?** sim — nome, e-mail, senha (só hash), vínculo aluno–turma, histórico de simulações. Possíveis menores de idade: [a definir — só ensino superior?]. LGPD: consentimento, exclusão de conta, mínimo de dados.
- **Onde publicar:** [a definir — ex.: front na Vercel/Netlify, API no Render/Fly.io/Railway, Postgres gerenciado]. Atenção: planos gratuitos de hospedagem têm limites; nada será contratado sem sua decisão.
- **Pagamento:** nenhum. Gratuito, com **limites de uso** por aluno e por turma para proteger as cotas gratuitas de IA (ex.: N simulações/dia por aluno [a definir]).

## 8. Fora do escopo (v1 sugerida)
- App mobile nativo.
- Previsões probabilísticas numéricas (contraria o método).
- Cobrança, planos pagos e integração com meios de pagamento.
- API pública, white-label, integração com AVA (Moodle/Canvas) [candidatos a v2].
