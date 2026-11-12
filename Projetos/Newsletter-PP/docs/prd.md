# PRD — Newsletter de PP [nome a definir]

> Etapa 1 do fluxo "Criar sites com IA". Itens marcados com `[a definir]` ainda precisam de resposta;
> itens marcados com `(proposta)` são sugestões a confirmar.

## 1. Visão geral
- **O que é:** uma newsletter com site próprio onde um estudante de Publicidade e Propaganda publica seus textos, e cada post novo chega por e-mail a quem assinou.
- **Para quem:** colegas de curso, professores, recrutadores de agências e quem acompanha publicidade e criatividade. `[a definir: público principal]`
- **Objetivo principal:** o visitante **assina a newsletter** (deixa o e-mail) e lê os posts.
- **Tipo:** aplicação com login e dados (painel do autor, assinantes e envio de e-mails).

## 2. Diferencial
- O site também funciona como **portfólio vivo**: a própria newsletter mostra o olhar criativo do estudante.
- Identidade visual de cores vivas e com personalidade, longe do visual padrão de Substack e Medium.
- O e-mail chega com a mesma cara do site, não com a marca de uma plataforma.
- `[a definir: assuntos e frequência — ex.: análise de campanhas, bastidores do curso, referências da semana]`

## 3. Estrutura (telas e seções)
| Tela | Seções | Objetivo da tela |
|------|--------|------------------|
| Home | Topo com nome e frase de apresentação; formulário de assinatura em destaque; último post em destaque; lista dos posts recentes (capa, título, data, tempo de leitura); rodapé com redes sociais | Fazer assinar e levar ao post mais recente |
| Post | Capa, título, data, tempo de leitura, texto com imagens; caixa de assinatura no fim; "leia também" | Leitura confortável e nova chance de assinar |
| Arquivo | Todos os posts, com filtro por categoria/tag | Explorar o que já saiu |
| Sobre | Foto, quem é o estudante, curso/faculdade, contato e links (LinkedIn, Behance, Instagram) | Apresentar o autor (portfólio) |
| Confirmação de assinatura | "Confira seu e-mail" e "Assinatura confirmada!" | Concluir a assinatura em duas etapas (exigência de boa prática e LGPD) |
| Descadastro | Confirmação de saída com um clique, sem login | Permitir sair a qualquer momento |
| Painel — login | E-mail e senha do autor | Só o autor entra |
| Painel — posts | Lista de rascunhos e publicados; botão "Novo post" | Gerenciar o conteúdo |
| Painel — editor | Título, capa, texto com formatação, tags; "Salvar rascunho", "Pré-visualizar e-mail", "Publicar e enviar" | Escrever e publicar; ao publicar, envia o e-mail aos assinantes |
| Painel — assinantes | Total de assinantes confirmados, lista, exportar CSV | Acompanhar a audiência |

**E-mail do post novo:** título, capa, resumo (ou texto completo `[a definir]`), botão "Ler no site" e link de descadastro em todo envio.

## 4. Identidade visual
- **Estilo:** vibrante e editorial, com tipografia grande, blocos de cor chapada e um clima de "cartaz de campanha". `(proposta)`
- **Paleta (proposta):** magenta `#FF2E88`, amarelo `#FFD400`, azul elétrico `#2D5BFF`, laranja `#FF6B2C`, fundo creme `#FFF8EC`, texto quase preto `#14121F`. As combinações serão conferidas para contraste (WCAG AA) na etapa de design.
- **Fontes (proposta):** títulos em Bricolage Grotesque; texto em Instrument Sans (Google Fonts).
- **Tom de voz:** descontraído, criativo e próximo, sem perder a credibilidade. `[a confirmar]`
- **Nome da newsletter (sugestões):** *Caixa Alta*, *Briefing Aberto*, *Pauta Livre*, *Call to Read*. `[a definir]`

## 5. Referências
| Referência | O que aproveitar |
|-----------|------------------|
| `[a definir — Etapa 2]` | |

## 6. Conteúdo
- Nome e foto do estudante, faculdade/semestre, links de redes: `[a definir]`
- Primeiros posts (pelo menos 2 ou 3 para o lançamento): `[a definir]`
- Logo: `[a definir — pode ser só tipográfico]`

## 7. Requisitos técnicos
- **Stack (proposta):** Python + Flask, o mesmo padrão da Luna (fácil de manter no mesmo repositório), com HTML/CSS/JS sem framework pesado no site público.
- **Banco de dados (proposta):** Postgres gratuito (Neon ou Supabase), para posts e assinantes. O Postgres gratuito do Render apaga o banco após 30 dias, então não serve.
- **Envio de e-mails (proposta):** Resend (plano gratuito com limite diário). Para enviar a qualquer assinante, ele exige **um domínio próprio verificado**. `[a definir: o estudante tem ou vai comprar um domínio? ~R$ 40/ano para .com.br]`. Sem domínio, a alternativa é o Brevo com remetente verificado, mas com mais risco de cair no spam.
- **Assinatura:** confirmação em duas etapas (double opt-in), link de descadastro em todo e-mail e consentimento registrado (LGPD).
- **Login do painel:** só o autor; senha guardada com hash e proteção contra tentativas repetidas.
- **Responsivo:** sim, pensado primeiro para o celular.
- **SEO importante?** sim: títulos e descrições por post, Open Graph para compartilhar nas redes, sitemap e RSS.
- **Formulários / dados sensíveis?** sim: e-mails dos assinantes e a senha do autor.
- **Onde publicar (proposta):** Render (servidor) + domínio próprio `[a definir]`.

## 8. Fora do escopo (versão 1)
- Assinatura paga e conteúdo exclusivo para assinantes.
- Comentários nos posts.
- Mais de um autor.
- Agendamento de envio (pode entrar na versão 2).
