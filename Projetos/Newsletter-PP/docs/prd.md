# PRD — Newsletter do Eduardo Pereira [nome a definir — sugestão: *Intervalo Comercial*]

> Etapa 1 do fluxo "Criar sites com IA". Itens marcados com `[a definir]` ainda precisam de resposta;
> itens marcados com `(proposta)` são sugestões a confirmar.

## 1. Visão geral
- **O que é:** uma newsletter com site próprio onde Eduardo Pereira, estudante de Publicidade e Propaganda, escreve sobre **séries e cultura pop com olhar de publicitário**: o marketing por trás dos lançamentos, as aberturas, os pôsteres, os personagens como marca, o merchandising dentro dos episódios. Cada post novo chega por e-mail a quem assinou.
- **Para quem:** fãs de séries curiosos sobre os bastidores, colegas de curso e professores de PP, e recrutadores de agências (o site também é portfólio).
- **Objetivo principal:** o visitante **assina a newsletter** (deixa o e-mail) e lê os posts.
- **Tipo:** aplicação com login e dados (painel do autor, assinantes e envio de e-mails).

## 2. Diferencial
- O site também funciona como **portfólio vivo**: a própria newsletter mostra o olhar criativo do estudante.
- Identidade visual de cores vivas e com personalidade, longe do visual padrão de Substack e Medium.
- O e-mail chega com a mesma cara do site, não com a marca de uma plataforma.
- Assunto: séries e cultura pop, sempre lidas pelo ângulo da publicidade. `[a definir: frequência — ex.: semanal]`
- Ideias de seções fixas (proposta): **Análise do episódio** (a campanha de lançamento de uma série), **Pôster da semana** (direção de arte de um cartaz), **Product placement** (marcas que aparecem em cena), **Maratona** (lista de indicações).

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
- **Conceito:** *o intervalo comercial vira o site.* Cada seção é um "bloco" de cor chapada, de ponta a ponta, como as barras coloridas da TV e os cartazes de campanha em sequência. É onde séries (TV) e publicidade (o comercial) se encontram.
- **Direção de arte:** "Capítulos de cor", sorteada e escolhida com a skill de design (taste-skill). Seções de tela cheia, cada uma de uma cor, encostadas sem divisória; um só grid e uma só fonte segurando tudo.
- **Paleta:** azul elétrico `#2436FF`, vermelho-laranja `#FF3B1F`, preto `#0A0A0A`, azul-noite `#050A5C`, amarelo `#FFD400` (acrescentado para reforçar as "cores vivas"), fundo branco `#FFFFFF`. Cada cor tem seu texto fixo (branco ou preto) para garantir contraste; nada de degradês nem tons intermediários.
- **Fonte:** Albert Sans (Google Fonts), uma família só: 600 nos títulos enormes e apertados, 400/500 no texto, com corpo de 18–20px.
- **Abertura da Home:** "linha d'água". A tela é dividida ao meio em branco e cor, e o título gigante em caixa alta é cortado pela linha: em cima de uma cor, embaixo de outra.
- **Animação assinatura:** cada linha do título sobe de trás da própria linha de base ao carregar. O resto do site só tem entradas discretas e respostas aos cliques.
- **Tom de voz:** descontraído e opinativo, com vocabulário de quem é fã e de quem é publicitário.
- **Nome da newsletter (sugestões):** **Intervalo Comercial** (recomendado: junta TV e publicidade num nome só), *Pós-Créditos*, *Próximo Episódio*, *Plot & Pitch*. `[a definir]`

## 5. Referências
Estudadas pela skill de design (Awwwards). Aproveitamos só o princípio, nunca nomes, textos ou imagens.
| Referência | O que aproveitar |
|-----------|------------------|
| Site de estúdio com seções em cor chapada (azul, preto, amarelo) | Trocar de cor a cada seção, com texto só preto ou branco |
| Relatório anual em blocos de cor | Começar títulos e textos numa linha fixa a ~42% da largura; à esquerda, só números de capítulo e créditos |
| Site de comediante com recortes em "adesivo" | Fotos recortadas com borda branca grossa, como figurinha — bom para personagens e pôsteres nos posts |
| Barras de cor da TV e a vinheta "Voltamos já" | Ritmo de blocos de cor; textos de transição como "intervalo", "voltamos já", "próximo episódio" |

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
