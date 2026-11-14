---
name: seo-google
description: "Especialista em SEO (otimização para mecanismos de busca) para estratégia de conteúdo, SEO técnico, pesquisa de palavras-chave e melhora das posições no Google. Use ao otimizar o conteúdo de um site, melhorar as posições na busca, fazer análise de palavras-chave ou aplicar as boas práticas de SEO. Domina SEO on-page, meta tags, marcação schema e Core Web Vitals."
---

# SEO Optimizer

Orientação completa de otimização para mecanismos de busca, do conteúdo à implementação técnica e ao planejamento estratégico, para aumentar a visibilidade e as posições na busca orgânica.

## Quando usar esta skill

Use esta skill quando for:
- Otimizar o conteúdo de um site para os mecanismos de busca
- Fazer pesquisa e análise de palavras-chave
- Aplicar melhorias de SEO técnico
- Criar meta tags e descriptions otimizadas para SEO
- Auditar sites em busca de problemas de SEO
- Melhorar os Core Web Vitals e a velocidade da página
- Implementar marcação schema (dados estruturados)
- Planejar a estratégia de conteúdo para tráfego orgânico

## Fundamentos de SEO

### 1. Pesquisa e estratégia de palavras-chave

**Escolha da palavra-chave principal:**
- Foque na intenção de busca (informacional, navegacional, transacional, comercial)
- Equilibre o volume de busca com a concorrência
- Considere a dificuldade da palavra-chave e o potencial de ranquear
- Mire em palavras-chave de cauda longa para ganhos rápidos

**Processo de pesquisa de palavras-chave:**
```
1. Identifique as palavras-chave semente a partir dos objetivos do negócio
2. Use ferramentas para ampliar a lista (Planejador de palavras-chave do Google, Ahrefs, SEMrush)
3. Analise o volume de busca e a dificuldade
4. Agrupe as palavras-chave em clusters de conteúdo
5. Associe as palavras-chave a tipos de conteúdo e páginas
6. Priorize pelo retorno potencial (ROI)
```

**Fórmula de otimização do conteúdo:**
- Palavra-chave principal: densidade de 1–2% (inserida com naturalidade)
- Inclua em: tag title, H1, primeiro parágrafo, URL, meta description
- Use variações semânticas e termos relacionados
- Mantenha a leitura natural (sem keyword stuffing, encher o texto da palavra-chave)

### 2. SEO on-page

**Otimização da tag title:**
```html
<!-- Bom: descritivo, com a palavra-chave, menos de 60 caracteres -->
<title>Guia completo de React Hooks - Aprenda useEffect e useState</title>

<!-- Ruim: longo demais, keyword stuffing, genérico -->
<title>Guia React Hooks Tutorial React Hooks Exemplos React Hooks Aprenda React</title>
```

**Boas práticas:**
- Mantenha abaixo de 60 caracteres (o que aparece na SERP, a página de resultados do Google)
- Coloque a palavra-chave principal perto do começo
- Inclua o nome da marca se couber
- Torne o título convincente e digno de clique
- Único para cada página

**Meta description:**
```html
<!-- Bom: convincente, com palavras-chave, chamada para ação, 150-160 caracteres -->
<meta name="description" content="Domine os React Hooks com nosso guia completo. Aprenda useState, useEffect e hooks próprios com exemplos práticos. Crie apps React melhores a partir de hoje.">

<!-- Ruim: curta demais, sem proposta de valor -->
<meta name="description" content="Guia e tutorial de React Hooks">
```

**Estrutura de cabeçalhos:**
```html
<!-- Hierarquia correta -->
<h1>Título principal da página (palavra-chave principal)</h1>
  <h2>Título da seção (palavras-chave relacionadas)</h2>
    <h3>Subseção</h3>
    <h3>Subseção</h3>
  <h2>Outra seção</h2>
    <h3>Subseção</h3>
```

**Estrutura de URL:**
```
✅ URLs boas:
- /blog/react-hooks-guide
- /products/running-shoes
- /learn/javascript-async-await

❌ URLs ruins:
- /blog?p=12345
- /products/cat-1/subcat-2/item-999
- /page.php?id=abc&ref=xyz
```

**Otimização de imagens:**
```html
<!-- Imagem otimizada -->
<img
  src="/images/react-hooks-diagram-800w.webp"
  alt="Diagrama do ciclo de vida dos React Hooks mostrando useState e useEffect"
  width="800"
  height="600"
  loading="lazy"
/>
```

**Boas práticas:**
- Use texto alternativo (alt) descritivo e com palavras-chave
- Comprima as imagens (de preferência no formato WebP)
- Defina as dimensões para evitar mudança de layout
- Use lazy loading (carregamento sob demanda) nas imagens abaixo da dobra
- Inclua legendas quando fizer sentido

### 3. Qualidade do conteúdo

**Princípios de E-E-A-T (Experiência, Especialidade, Autoridade, Confiança):**
- Mostre a especialidade do autor com as credenciais dele
- Cite fontes de autoridade
- Mantenha o conteúdo correto e atualizado
- Mostre experiência real e insights originais
- Inclua minibiografias e a assinatura do autor

**Estrutura de conteúdo para SEO:**
```markdown
# Título principal (H1) - palavra-chave principal

Introdução breve com a palavra-chave principal nas primeiras 100 palavras.

## O que é [Tema]? (H2) - responda à pergunta central

Explicação completa com exemplos.

## Por que [Tema] importa (H2) - proposta de valor

Benefícios e casos de uso.

## Como [Ação] (H2) - guia prático

Instruções passo a passo com elementos visuais.

## Boas práticas (H2) - dicas avançadas

Recomendações de especialista.

## Erros comuns a evitar (H2)

Solução de problemas e armadilhas.

## Conclusão

Resumo e chamada para ação.
```

**Tamanho recomendado do conteúdo:**
- Posts de blog: 1.500 a 2.500 palavras (temas amplos)
- Páginas de produto: no mínimo 300 a 500 palavras
- Páginas de categoria: 500 a 1.000 palavras
- Página inicial: 500 palavras ou mais

### 4. SEO técnico

**Marcação schema (dados estruturados):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Guia completo de React Hooks",
  "image": "https://example.com/images/react-hooks.jpg",
  "datePublished": "2024-01-15",
  "dateModified": "2024-02-01",
  "author": {
    "@type": "Person",
    "name": "Ana Souza"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Tech Academy",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}
```

**Tipos de schema comuns:**
- Article (posts de blog)
- Product (e-commerce)
- FAQ (páginas de perguntas e respostas)
- HowTo (tutoriais e guias)
- Organization (dados da empresa)
- LocalBusiness (negócios com endereço físico)
- BreadcrumbList (caminhos de navegação)
- Review/AggregateRating (notas e avaliações)

**Configuração do robots.txt:**
```
User-agent: *
Disallow: /admin/
Disallow: /private/
Disallow: /api/
Allow: /api/public/

Sitemap: https://example.com/sitemap.xml
```

**Estrutura do sitemap XML:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/blog/react-hooks-guide</loc>
    <lastmod>2024-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**Tags canonical:**
```html
<!-- Evite problemas de conteúdo duplicado -->
<link rel="canonical" href="https://example.com/original-page">

<!-- Trate os parâmetros de URL -->
<link rel="canonical" href="https://example.com/products/shoes">
<!-- Mesmo quando acessada por: /products/shoes?color=red&size=10 -->
```

### 5. Core Web Vitals

**Largest Contentful Paint (LCP) — meta: < 2,5 s**
- Otimize imagens e vídeos
- Use CDN para os arquivos estáticos
- Reduza os recursos que bloqueiam a renderização
- Use lazy loading

**Interaction to Next Paint (INP) — meta: ≤ 200 ms**
(Em março de 2024 o INP substituiu o First Input Delay, FID, como Core Web Vital. O INP mede a demora de todas as
interações da visita, não só a primeira.)
- Reduza o tempo de execução do JavaScript
- Quebre as tarefas longas (ceda a vez ao navegador entre um trecho e outro)
- Use web workers para cálculos pesados
- Adie o JavaScript que não é essencial
- Dê retorno visual imediato ao clique e deixe o trabalho pesado para depois

**Cumulative Layout Shift (CLS) — meta: < 0,1**
- Defina os atributos de tamanho em imagens e vídeos
- Evite inserir conteúdo acima do conteúdo que já existe
- Use animações de transform em vez de propriedades que mexem no layout
- Reserve espaço para anúncios e conteúdos incorporados

**Otimização da velocidade da página:**
```html
<!-- Pré-carregue os recursos críticos -->
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>

<!-- Adie o CSS não crítico -->
<link rel="preload" href="/styles/non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

<!-- JavaScript com async/defer -->
<script src="/js/analytics.js" async></script>
<script src="/js/main.js" defer></script>
```

### 6. SEO mobile

**Otimização mobile-first:**
- Design responsivo (aprovado no teste de compatibilidade com dispositivos móveis)
- Botões fáceis de tocar (no mínimo 48 × 48 px)
- Fontes de tamanho legível (no mínimo 16 px)
- Viewport configurada corretamente
- Página rápida no celular

**Configuração da viewport:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### 7. Estratégia de links internos

**Boas práticas:**
- Use texto âncora descritivo (evite "clique aqui")
- Aponte para páginas relevantes e ligadas ao contexto
- Mantenha uma hierarquia e um fluxo lógicos
- Inclua de 3 a 5 links internos a cada 1.000 palavras
- Atualize o conteúdo antigo com links para o conteúdo novo

**Exemplo:**
```markdown
Saiba mais sobre [padrões avançados de React](/guides/react-patterns)
ou veja nosso [tutorial do hook useState](/tutorials/usestate-guide).
```

## Checklist de conteúdo para SEO

**Antes de publicar:**
- [ ] Palavra-chave principal na tag title (menos de 60 caracteres)
- [ ] Meta description (150 a 160 caracteres, convincente)
- [ ] Tag H1 com a palavra-chave principal
- [ ] Slug da URL otimizado e legível
- [ ] Imagens comprimidas e com texto alternativo descritivo
- [ ] De 3 a 5 links internos para conteúdo relevante
- [ ] Links externos para fontes de autoridade
- [ ] Tamanho do conteúdo adequado à profundidade do tema
- [ ] Marcação schema implementada
- [ ] Compatível com celular e responsivo
- [ ] Velocidade da página otimizada (carregamento < 3 s)
- [ ] Nenhum link quebrado
- [ ] Tag canonical definida corretamente
- [ ] Meta tags de compartilhamento em redes sociais (Open Graph, Twitter Card)

## Estratégias avançadas de SEO

### Clusters de conteúdo e páginas pilar

**Estrutura:**
```
Página pilar: "Guia completo de React"
  ├── Cluster: "Tutorial de React Hooks"
  ├── Cluster: "Guia da Context API do React"
  ├── Cluster: "Otimização de desempenho no React"
  └── Cluster: "Boas práticas de testes no React"
```

**Como aplicar:**
- Crie um conteúdo pilar completo (3.000 palavras ou mais)
- Desenvolva de 8 a 12 artigos de cluster que sustentem o pilar
- Faça todos os clusters apontarem de volta para a página pilar
- Faça a página pilar apontar para todos os clusters
- Mantenha temas de palavras-chave consistentes

### Otimização para featured snippet

**Conteúdo em formato de pergunta:**
```markdown
## O que é React?

React é uma biblioteca JavaScript para criar interfaces de usuário,
desenvolvida pelo Facebook. Ela permite que os desenvolvedores criem
componentes de interface reutilizáveis e atualizem o DOM com eficiência
por meio de uma implementação de DOM virtual.
```

**Conteúdo em formato de lista:**
```markdown
## As 5 principais boas práticas de React

1. Use componentes funcionais com hooks
2. Faça um gerenciamento de estado adequado
3. Otimize o desempenho com React.memo
4. Siga padrões de composição de componentes
5. Escreva testes completos
```

**Conteúdo em formato de tabela:**
| Framework | Desempenho | Curva de aprendizado | Ecossistema    |
|-----------|------------|----------------------|----------------|
| React     | Excelente  | Moderada             | Amplo          |
| Vue       | Excelente  | Fácil                | Em crescimento |
| Angular   | Bom        | Íngreme              | Maduro         |

## SEO local (para negócios com endereço físico)

**Otimização do Perfil da Empresa no Google:**
- Preencha todas as informações do negócio
- Publique posts e atualizações com frequência
- Responda às avaliações
- Adicione fotos de alta qualidade
- Confira o horário comercial

**Marcação schema local:**
```json
{
  "@type": "LocalBusiness",
  "name": "Tech Soluções Ltda.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua das Flores, 123",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "postalCode": "01001-000"
  },
  "telephone": "+55-11-5555-0123"
}
```

## Monitoramento e analytics

**Principais métricas para acompanhar:**
- Tendência do tráfego orgânico
- Posições das palavras-chave no Google
- Taxas de cliques (CTR)
- Taxa de rejeição e tempo de permanência
- Notas dos Core Web Vitals
- Crescimento do perfil de backlinks
- Taxas de conversão do tráfego orgânico

**Ferramentas:**
- Google Search Console (desempenho, problemas de indexação)
- Google Analytics 4 (tráfego, comportamento, conversões)
- PageSpeed Insights (Core Web Vitals)
- Ahrefs/SEMrush (palavras-chave, backlinks, concorrência)
- Screaming Frog (auditorias técnicas)

Ao otimizar para SEO, priorize a experiência do usuário e a entrega de valor. Os mecanismos de busca recompensam cada vez mais o conteúdo que ajuda o usuário de verdade e traz informação confiável e de autoridade.
