/* =========================================================
   KFKA — Documentação viva de design
   /design        → Guia de estilo + Design System (tokens e componentes)
   /marca         → Processo criativo do logotipo e regras de uso
   /mapa          → Mapa de navegação (todas as telas, por perfil)
   /documentacao  → Pesquisa de referências, entregas e matriz RF → tela
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon;
  const FIGMA = 'https://www.figma.com/design/GSyJCvuMCQ52KIFjUyMAwm'; // arquivo da Entrega 2
  // Cabeçalho comum das páginas de documentação
  const head = (active) => `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header class="public-header"><a class="logo" href="#/">${K.mark()}<span class="word">KFKA</span></a>
      <nav class="row docs-nav" aria-label="Documentação">${[['design', '#/design', 'Design System'], ['marca', '#/marca', 'Marca'], ['mapa', '#/mapa', 'Mapa de navegação'], ['doc', '#/documentacao', 'Pesquisa e requisitos']].map(([k, h, l]) => `<a href="${h}" ${active === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
      <span class="grow"></span>${K.temaToggle()}<a class="btn btn-primary btn-sm" href="#/entrar">Abrir protótipo</a></header>`;
  const sec = (id, title, lead, body) => `<section class="docs-sec" id="${id}" aria-labelledby="${id}-t"><div class="section-head"><h2 id="${id}-t">${title}</h2>${lead ? `<p class="text-2">${lead}</p>` : ''}</div>${body}</section>`;
  const toc = (base, items) => `<nav class="row toc" aria-label="Nesta página">${items.map(([a, l]) => `<a class="filter-chip" href="${base}" data-action="scroll-to" data-target="${a}">${l}</a>`).join('')}</nav>`;
  // Amostra de cor com papel e justificativa
  const sw = (name, v, papel, dark) => `<div class="swatch"><span class="chip" style="background:${v}${dark ? ';color:#fff' : ''}">Aa</span><b>${name}</b><code>${v}</code>${papel ? `<small>${papel}</small>` : ''}</div>`;
  // Linha da tabela de contraste (WCAG 2.1: 4,5:1 texto normal · 3:1 texto grande/ícones)
  const ct = (fg, bg, uso, ratio) => `<tr><td class="cell-main"><span class="ct-sample" style="color:${fg};background:${bg}">Aa</span></td><td data-label="Combinação"><code>${fg}</code> sobre <code>${bg}</code></td><td data-label="Uso">${uso}</td><td data-label="Contraste" class="mono">${ratio.toFixed(2).replace('.', ',')}:1</td><td data-label="WCAG">${ratio >= 7 ? '<span class="status publicado">AAA</span>' : ratio >= 4.5 ? '<span class="status enviado">AA</span>' : '<span class="status devolvido">Só texto grande</span>'}</td></tr>`;

  /* ======================= DESIGN SYSTEM ======================= */
  K.views.design = {
    title: 'Design System',
    render: () => `${head('design')}
    <main id="conteudo" class="docs">
      <header class="docs-hero"><h1 id="page-title" tabindex="-1">Fundamentos e componentes</h1><p class="docs-meta">KFKA · Guia de estilo e Design System 1.1</p><p class="lead">Tudo o que aparece aqui é usado nas telas do protótipo: os tokens ficam em <code>css/tokens.css</code> e os componentes em <code>css/components.css</code> e <code>js/core.js</code>. A versão em Figma está no <a href="${FIGMA}" target="_blank" rel="noopener noreferrer">arquivo do projeto</a>.</p>
        ${toc('#/design', [['cores', 'Cores'], ['contraste', 'Contraste'], ['tipo', 'Tipografia'], ['espaco', 'Espaço e grid'], ['icones', 'Ícones'], ['status', 'Status'], ['botoes', 'Botões e estados'], ['forms', 'Formulários'], ['feedback', 'Feedback'], ['dados', 'Dados'], ['a11y', 'Acessibilidade']])}</header>

      ${sec('cores', 'Paleta de cores', 'Escolhida para um público duplo: a escola, que precisa de seriedade e confiança, e as famílias, que precisam de acolhimento. Por isso a base é fria (tinta e teal transmitem estabilidade) e os acentos são quentes e alegres (sol e menta), usados com moderação.', `
        <h3 class="eyebrow">Marca — base fria, confiável</h3><div class="swatches">${sw('Tinta', '#1B3A4B', 'Menu, cabeçalhos, áreas escuras', 1)}${sw('Tinta profunda', '#10252F', 'Rodapé, gradientes', 1)}${sw('Teal', '#0B7285', 'Secundária: links, status “enviado”', 1)}${sw('Teal suave', '#DDF3F6', 'Fundos de destaque')}${sw('Céu', '#74C0FC', 'Acento sobre fundo escuro')}${sw('Azul de ação', '#2A5CFF', 'Somente o botão principal da tela', 1)}</div>
        <h3 class="eyebrow">Acentos — calor e celebração</h3><div class="swatches">${sw('Sol', '#FFC94A', 'Avisos de prazo, números de destaque')}${sw('Menta', '#5FD4A8', 'Conquistas, família, “publicado”')}${sw('Rosa', '#E0186F', 'Ponto de notificação (uso mínimo)', 1)}</div>
        <h3 class="eyebrow">Superfícies e texto</h3><div class="swatches">${sw('Fundo', '#F3F9FA', 'Fundo das páginas')}${sw('Papel', '#E3FAFC', 'Blocos de média e seções')}${sw('Linha', '#D9E8EC', 'Bordas')}${sw('Linha forte', '#B5CDD4', 'Bordas de campos')}${sw('Texto', '#0B2E3C', 'Títulos e corpo', 1)}${sw('Texto 2', '#4E6B77', 'Apoio', 1)}${sw('Texto suave', '#56707B', 'Legendas', 1)}</div>
        <div class="alert info">${I('palette')}<div><b>Regra 60-30-10</b>60% superfícies claras, 30% tinta/teal (estrutura e navegação), 10% acentos (ação, status e conquistas). Um único botão azul por área de tela.</div></div>`)}

      ${sec('contraste', 'Contraste e acessibilidade da paleta', 'Contrastes calculados pela fórmula da WCAG 2.1. Todos os textos atingem pelo menos AA (4,5:1).', `
        <div class="card flush"><div class="table-wrap"><table class="table"><thead><tr><th>Amostra</th><th>Combinação</th><th>Uso</th><th>Contraste</th><th>Nível</th></tr></thead><tbody>
        ${ct('#0B2E3C', '#F3F9FA', 'Texto principal', 13.43)}${ct('#4E6B77', '#FFFFFF', 'Texto de apoio em cartões', 5.69)}${ct('#56707B', '#F3F9FA', 'Legendas sobre o fundo', 4.94)}${ct('#FFFFFF', '#2A5CFF', 'Botão principal', 5.16)}${ct('#FFFFFF', '#1B3A4B', 'Menu lateral', 11.98)}${ct('#FFFFFF', '#0B7285', 'Selo teal', 5.59)}${ct('#74C0FC', '#1B3A4B', 'Destaque no menu escuro', 6.1)}${ct('#1B3A4B', '#FFC94A', 'Texto sobre sol', 7.82)}${ct('#0A5F6F', '#DDF3F6', 'Status Enviado', 6.33)}${ct('#8A5A12', '#FBF0DC', 'Status Em revisão', 5.24)}${ct('#26593F', '#E3F1EA', 'Status Publicado', 6.98)}${ct('#9A3B26', '#F8E4DE', 'Status Devolvido', 5.66)}
        </tbody></table></div></div>`)}

      ${sec('tipo', 'Tipografia', 'Bricolage Grotesque dá personalidade aos títulos. Plus Jakarta Sans é muito legível em telas pequenas e tem acentuação completa em português. JetBrains Mono alinha as médias e os números em colunas.', `
        <div class="card stack type-scale">
          <div class="row-between"><span style="font-family:var(--font-display);font-size:44px;font-weight:700;letter-spacing:-.02em;color:var(--ink)">Display 36–56</span><code>Bricolage 700 · altura 1,05</code></div>
          <div class="row-between"><span style="font-family:var(--font-display);font-size:30px;font-weight:700;color:var(--ink)">Título de página 28–34</span><code>Bricolage 700 · altura 1,15</code></div>
          <div class="row-between"><span style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--ink)">Título de seção 22</span><code>Bricolage 700</code></div>
          <div class="row-between"><span style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--ink)">Título de cartão 18</span><code>Bricolage 700</code></div>
          <div class="row-between"><span style="font-size:16px">Corpo 15–16: relatos pedagógicos e textos longos.</span><code>Jakarta 400 · altura 1,55</code></div>
          <div class="row-between"><span style="font-size:14px;font-weight:600">Interface 13–14: rótulos, tabelas, botões.</span><code>Jakarta 600–700</code></div>
          <div class="row-between"><span class="eyebrow">Rótulo 12 em caixa alta</span><code>Jakarta 800 · espaço .08em</code></div>
          <div class="row-between"><span class="mono" style="font-size:28px;font-weight:700">8,5 · 2026-0142</span><code>JetBrains Mono 500/700</code></div>
        </div>`)}

      ${sec('espaco', 'Espaçamento, raios, sombras e grid', 'Escala de 4 px: todo espaço é múltiplo de 4. Os cantos são arredondados e as sombras são suaves, para um visual amigável e sem peso.', `
        <div class="grid-2">
          <div class="card stack-sm"><h3 class="eyebrow">Espaço</h3>${[['s1', 4], ['s2', 8], ['s3', 12], ['s4', 16], ['s5', 20], ['s6', 24], ['s8', 32], ['s10', 40], ['s12', 48], ['s16', 64]].map(([n, v]) => `<div class="space-row"><code>--${n}</code><span class="space-bar" style="width:${v * 3}px"></span><span class="mono muted">${v}px</span></div>`).join('')}</div>
          <div class="stack">
            <div class="card stack-sm"><h3 class="eyebrow">Raios</h3><div class="row" style="flex-wrap:wrap;gap:14px">${[['sm', 8, 'tags'], ['md', 12, 'botões, campos'], ['lg', 20, 'cartões'], ['xl', 28, 'destaques'], ['pill', 999, 'status']].map(([n, v, u]) => `<div class="radius-demo"><span style="border-radius:${Math.min(v, 40)}px"></span><code>${n} · ${v === 999 ? '∞' : v + 'px'}</code><small>${u}</small></div>`).join('')}</div></div>
            <div class="card stack-sm"><h3 class="eyebrow">Elevação</h3><div class="row" style="flex-wrap:wrap;gap:18px">${[['sh-1', 'cartões'], ['sh-2', 'menus, hover'], ['sh-3', 'modais']].map(([n, u]) => `<div class="shadow-demo" style="box-shadow:var(--${n})"><code>${n}</code><small>${u}</small></div>`).join('')}</div></div>
          </div>
        </div>
        <div class="card stack-sm"><h3 class="eyebrow">Grid e pontos de quebra</h3>
          <div class="bp-line" aria-hidden="true"><span style="flex:390">Celular · até 759px</span><span style="flex:264">Tablet · 760–1023px</span><span style="flex:600">Desktop · 1024px ou mais</span></div>
          <ul class="checklist">${['Desktop: menu lateral fixo de 264px + conteúdo de até 1240px, grid de 12 colunas com espaço de 24px', 'Tablet: o menu vira gaveta; cartões em 2 colunas', 'Celular: 1 coluna, margem lateral de 16px, tabelas viram cartões e, para a família, barra de abas inferior'].map((x) => `<li>${I('grid')}${x}</li>`).join('')}</ul></div>`)}

      ${sec('icones', 'Iconografia', 'Ícones de traço com 2px de espessura, cantos arredondados e grade de 24px, no mesmo estilo dos cantos da interface. São sempre acompanhados de texto ou de um rótulo acessível.', `
        <div class="icon-grid">${K.ICON_NAMES.map((n) => `<div class="icon-cell">${I(n, 'icon-lg')}<code>${n}</code></div>`).join('')}</div>`)}

      ${sec('status', 'Status do relatório', 'Cada status combina texto, cor e ícone, nunca só a cor. A sequência segue o documento do projeto.', `
        <div class="card stack"><div class="row" style="flex-wrap:wrap">${['rascunho', 'enviado', 'revisao', 'publicado', 'devolvido', 'cancelado'].map((s) => K.status(s)).join('')}</div>
        <div class="row" style="flex-wrap:wrap">${['pendente', 'lido', 'nao-lido'].map((s) => K.status(s)).join('')}<small class="muted">Estados auxiliares: registro pendente e leitura da família</small></div>
        <div>${K.stepper('revisao')}</div><div>${K.stepper('devolvido')}</div></div>`)}

      ${sec('botoes', 'Botões e estados de interação', 'Altura mínima de 44px (área de toque). Um único botão principal por área. Os estados abaixo estão fixos para comparação.', `
        <div class="card stack"><div class="row" style="flex-wrap:wrap"><button class="btn btn-primary">${I('send')} Principal</button><button class="btn btn-secondary">Secundário</button><button class="btn btn-ghost">Discreto</button><button class="btn btn-success">${I('check')} Publicar</button><button class="btn btn-danger">${I('undo')} Devolver</button><button class="btn btn-dark">Escuro</button></div>
        <div class="states-grid">${[['Padrão', ''], ['Hover', 'is-hover'], ['Foco (teclado)', 'is-focus'], ['Desabilitado', 'disabled']].map(([l, c]) => `<div class="stack-sm"><small class="eyebrow">${l}</small><button class="btn btn-primary ${c === 'disabled' ? '' : c}" ${c === 'disabled' ? 'disabled' : ''} tabindex="-1">${I('send')} Enviar</button><button class="btn btn-secondary ${c === 'disabled' ? '' : c}" ${c === 'disabled' ? 'disabled' : ''} tabindex="-1">Salvar</button></div>`).join('')}</div>
        <div class="row" style="flex-wrap:wrap"><button class="btn btn-primary btn-sm">Pequeno</button><button class="btn btn-primary btn-lg">Grande</button><button class="icon-btn" aria-label="Notificações">${I('bell')}<span class="badge-dot"></span></button><button class="link-btn">Link</button></div></div>`)}

      ${sec('forms', 'Formulários', 'O rótulo fica sempre visível, a ajuda vai abaixo do campo e o erro aparece com ícone e texto (anunciado pelo leitor de tela).', `
        <form class="card form-grid" novalidate onsubmit="return false">
          ${K.field({ id: 'ds-1', label: 'Nome do aluno', value: 'Lucas Souza', required: true })}
          ${K.field({ id: 'ds-2', label: 'Média do bimestre', value: '11', required: true, attrs: 'data-min="0" data-max="10"', hint: 'De 0 a 10.' })}
          ${K.field({ id: 'ds-3', label: 'Turma', options: [['6A', '6º A'], ['6B', '6º B']], value: '6A' })}
          ${K.field({ id: 'ds-4', label: 'Buscar', icon: 'search', placeholder: 'Nome ou RA' })}
          <div class="field span-2"><span class="field-label">Tags</span><div class="tag-picker">${K.data.tags.slice(0, 5).map((t, i) => `<label class="tag-option"><input type="checkbox" ${i < 2 ? 'checked' : ''}><span>${t.nome}</span></label>`).join('')}</div></div>
          <div class="row span-2" style="flex-wrap:wrap"><label class="check"><input type="checkbox" checked> Caixa de seleção</label><label class="switch"><input type="checkbox" checked><span class="track"></span>Interruptor</label><div class="segmented" role="group" aria-label="Exemplo"><button type="button" aria-pressed="true">Todos</button><button type="button" aria-pressed="false">Pendentes</button></div></div>
          <div class="span-2"><button type="button" class="btn btn-secondary" data-action="ds-validar">Testar validação</button></div>
        </form>`)}

      ${sec('feedback', 'Feedback', 'Alertas no contexto, toasts com selo de simulação, modais acessíveis e estados vazios que sempre indicam o próximo passo.', `
        <div class="stack">${[['info', 'info', 'Informação'], ['success', 'check-circle', 'Sucesso'], ['warning', 'alert', 'Atenção'], ['danger', 'undo', 'Erro ou devolução']].map(([k, ic, l]) => `<div class="alert ${k}">${I(ic)}<div><b>${l}</b>Mensagem de apoio curta e objetiva.</div></div>`).join('')}
        <div class="row"><button class="btn btn-secondary" data-action="ds-toast">${I('sparkle')} Mostrar toast</button><button class="btn btn-secondary" data-action="ds-modal">Abrir modal</button></div>
        <div class="card">${K.empty({ icon: 'book-open', title: 'Estado vazio', text: 'Explica o motivo e oferece um próximo passo.' })}</div></div>`)}

      ${sec('dados', 'Dados e navegação', 'Tabelas viram cartões no celular. KPIs, barras e linha do tempo usam a mesma paleta de status.', `
        <div class="grid-3">
          <div class="card tight kpi"><div class="kpi-top"><span class="ico ico-warn">${I('review', 'icon-sm')}</span><span class="lbl">KPI · aguardando revisão</span></div><div class="val">9</div></div>
          <div class="card tight stack-sm"><span class="eyebrow">Barra empilhada</span><div class="stacked"><span style="width:40%;background:var(--success)"></span><span style="width:25%;background:var(--teal)"></span><span style="width:20%;background:var(--sun)"></span><span style="width:15%;background:var(--danger)"></span></div><div class="progress"><span style="width:62%"></span></div></div>
          <div class="card tight stack-sm"><span class="eyebrow">Avatares e tags</span><div class="row">${['Lucas Souza', 'Júlia Souza', 'Ana Souza'].map((n, i) => K.avatar(n, ['#5FD4A8', '#F8B4C9', '#74C0FC'][i])).join('')}</div>${K.tags(['t1', 't2', 't5'])}</div>
        </div>
        ${K.bimTabs(3, '#/design', { disableFuture: true })}
        ${K.crumbs([{ label: 'Coordenação', href: '#/design' }, { label: 'Revisão', href: '#/design' }, { label: 'Lucas Souza' }])}`)}

      ${sec('a11y', 'Acessibilidade e responsividade', '', `
        <div class="grid-2"><ul class="checklist card">${['Contraste mínimo AA em todos os textos e status (tabela acima)', 'Foco visível em todos os controles (anel azul de 3px)', '“Pular para o conteúdo” e foco no título a cada troca de tela', 'Modais com foco preso, Esc e retorno do foco', 'Erros de formulário com texto + ícone + aria-invalid', 'Status nunca dependem só da cor', 'Animações desligadas com “reduzir movimento”'].map((x) => `<li>${I('check-circle')}${x}</li>`).join('')}</ul>
        <ul class="checklist card">${['A partir de 1024px: menu fixo + conteúdo de até 1240px', 'De 760 a 1023px: o menu vira gaveta com botão', 'Abaixo de 760px: tabelas viram cartões com rótulos', 'Abaixo de 720px (família): barra de abas inferior', 'Modais viram folha inferior no celular', 'Área de toque de 44px em todos os tamanhos', 'Família: ajuste de tamanho do texto no perfil'].map((x) => `<li>${I('grid')}${x}</li>`).join('')}</ul></div>`)}
    </main>`,
    mount: () => {
      K.actions['ds-validar'] = (el) => K.validate(el.closest('form'));
      K.actions['ds-toast'] = () => K.toast('Ação concluída', 'Exemplo de mensagem de retorno.');
      K.actions['ds-modal'] = () => K.modal(`${K.modalHead('info', 'ico-blue', 'Modal de exemplo', 'O foco fica preso dentro do diálogo. Feche com Esc, clicando fora ou no botão.')}<div class="modal-foot"><button class="btn btn-primary" data-action="close-modal">Entendi</button></div>`);
    }
  };

  /* ======================= MARCA (processo criativo do logo) ======================= */
  // Versão monocromática do símbolo (para fundos de cor ou impressão em 1 cor)
  const markMono = (fg, bg) => `<svg class="mark" width="64" height="64" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="${bg}"/><path d="M13 9.5v21M17.5 20 27 11.5M17.5 20 27 28.5" stroke="${fg}" stroke-width="4.2" stroke-linecap="round" fill="none"/><circle cx="17.5" cy="20" r="3.3" fill="${fg}"/></svg>`;
  const IDEIAS = [['K como encontro de caminhos', 7], ['Ponte escola–casa', 5], ['Balão de conversa', 4], ['Livro aberto', 3], ['Broto crescendo', 3], ['Check de leitura', 4], ['Calendário em 4 partes', 2], ['Lápis + coração', 1], ['Mochila', 0], ['Casa + escola', 2]];
  const MORF = [
    ['Palavra e letras', ['KFKA espaçado', 'kfka minúsculo', 'Monograma K', 'K + ponto'], [2, 3]],
    ['Escola', ['Livro', 'Lápis', 'Prédio', 'Quadro'], []],
    ['Comunicação', ['Balão de fala', 'Ponte', 'Setas', 'Ponto de encontro'], [3]],
    ['Crescimento', ['Broto', 'Degraus', 'Gráfico', 'Régua'], []],
    ['Símbolos', ['Check', 'Estrela', 'Coração', 'Bandeira'], [0]],
    ['Grafismos', ['Traços arredondados', 'Pontos', 'Ondas', 'Grade de caderno'], [0, 1]]
  ];
  K.views.marca = {
    title: 'Marca',
    render: () => `${head('marca')}
    <main id="conteudo" class="docs">
      <header class="docs-hero"><h1 id="page-title" tabindex="-1">A marca KFKA</h1><p class="docs-meta">Identidade visual</p><p class="lead">Seguimos o processo da disciplina de Design de Interface Digital: associações → brainstorm com votação → caixa morfológica → moodboard → símbolo final e regras de uso.</p>
        ${toc('#/marca', [['conceito', 'Conceito'], ['associacoes', 'Associações'], ['brainstorm', 'Brainstorm'], ['morfologica', 'Caixa morfológica'], ['moodboard', 'Moodboard'], ['uso', 'Regras de uso']])}</header>

      ${sec('conceito', 'Conceito: três caminhos que se encontram', '', `
        <div class="brand-hero"><div class="brand-stage">${K.mark(160)}</div>
          <ol class="brand-key">
            <li><span class="key-dot" style="background:#fff;border:2px solid var(--ink)"></span><div><b>Haste vertical: a escola</b><small>A base firme que organiza o ano letivo.</small></div></li>
            <li><span class="key-dot" style="background:#74C0FC"></span><div><b>Braço de cima, céu: o professor</b><small>Quem observa e registra o desenvolvimento.</small></div></li>
            <li><span class="key-dot" style="background:#5FD4A8"></span><div><b>Braço de baixo, menta: a família</b><small>Quem recebe, lê e responde.</small></div></li>
            <li><span class="key-dot" style="background:#FFC94A"></span><div><b>Ponto central, sol: a publicação</b><small>O momento em que os três se encontram, que é o propósito do produto.</small></div></li>
          </ol></div>`)}

      ${sec('associacoes', '1. Associações', 'Palavras que o tema evoca (OSTROWER, 2014). Em destaque, as que guiaram o símbolo.', `
        <div class="card word-cloud">${[['escola', 0], ['família', 1], ['encontro', 2], ['caminho', 1], ['bimestre', 0], ['caderno', 0], ['confiança', 2], ['diálogo', 1], ['crescer', 0], ['ponte', 1], ['ciclo', 0], ['cuidado', 0], ['registro', 0], ['transparência', 1], ['conquista', 0], ['rotina', 0], ['acolher', 1], ['clareza', 2]].map(([w, n]) => `<span class="w w${n}">${w}</span>`).join('')}</div>`)}

      ${sec('brainstorm', '2. Brainstorm e votação', 'Ideias anotadas sem julgamento em 15 minutos. Depois, cada integrante distribuiu pontos (“voting dots”) entre as ideias.', `
        <div class="sticky-wall">${IDEIAS.map(([t, v], i) => `<div class="sticky ${i === 0 ? 'win' : ''}" style="--r:${(i % 3 - 1) * 1.6}deg"><b>${t}</b><span class="dots" role="img" aria-label="${v} votos">${'<i></i>'.repeat(v)}</span></div>`).join('')}</div>`)}

      ${sec('morfologica', '3. Caixa morfológica', 'Combinamos parâmetros do problema com variações possíveis. Em destaque, a combinação escolhida: monograma K + ponto de encontro + check + traços arredondados.', `
        <div class="card flush"><div class="table-wrap"><table class="table morf"><thead><tr><th>Parâmetro (o quê?)</th><th colspan="4">Soluções possíveis (como?)</th></tr></thead><tbody>
        ${MORF.map(([p, opts, sel]) => `<tr><th scope="row" class="cell-main">${p}</th>${opts.map((o, i) => `<td data-label="Opção ${i + 1}"><span class="morf-opt ${sel.includes(i) ? 'sel' : ''}">${sel.includes(i) ? I('check', 'icon-sm') : ''}${o}</span></td>`).join('')}</tr>`).join('')}
        </tbody></table></div></div>`)}

      ${sec('moodboard', '4. Moodboard', 'Colagem que guiou o clima visual: organizado como um caderno escolar, acolhedor como uma conversa e confiável como um documento oficial.', `
        <div class="moodboard" aria-label="Moodboard composto por elementos da identidade">
          <div class="mb mb-ink"><span class="eyebrow" style="color:var(--sky)">Confiança</span><b>Base escura e estável</b></div>
          <div class="mb mb-notebook"><span>Lucas participou do projeto sobre o ciclo da água…</span></div>
          <div class="mb mb-type"><span style="font-family:var(--font-display);font-weight:700">Aa</span><small>Bricolage · Jakarta</small></div>
          <div class="mb mb-sun">${I('sparkle', 'icon-lg')}<b>Conquista</b></div>
          <div class="mb mb-shapes"><i></i><i></i><i></i><i></i></div>
          <div class="mb mb-chat"><span class="bub a">Relatório publicado!</span><span class="bub b">Li e estou ciente ✓</span></div>
          <div class="mb mb-palette">${['#1B3A4B', '#0B7285', '#74C0FC', '#2A5CFF', '#5FD4A8', '#FFC94A', '#F3F9FA'].map((c) => `<i style="background:${c}"></i>`).join('')}</div>
          <div class="mb mb-mint">${K.status('publicado')}${K.status('lido')}</div>
          <div class="mb mb-dots"></div>
        </div>`)}

      ${sec('uso', '5. Versões e regras de uso', '', `
        <div class="grid-4 brand-versions">
          <div class="card bv">${K.mark(64)}<small>Principal</small></div>
          <div class="card bv" style="background:var(--chrome)">${K.mark(64, 'rgba(255,255,255,.1)')}<small style="color:#fff">Sobre fundo escuro</small></div>
          <div class="card bv">${markMono('#1B3A4B', '#E3FAFC')}<small>Monocromática</small></div>
          <div class="card bv" style="background:var(--blue)">${markMono('#fff', 'transparent')}<small style="color:#fff">Negativa</small></div>
        </div>
        <div class="grid-2">
          <div class="card stack-sm"><h3 style="font-size:17px">Área de proteção e tamanho mínimo</h3><div class="row" style="gap:28px;flex-wrap:wrap"><div class="clear-space">${K.mark(80)}</div><div class="stack-sm"><p class="text-2" style="font-size:14px">Mantenha ao redor do símbolo um espaço livre igual ao diâmetro do ponto central (x).</p><div class="row">${K.mark(24)}<small class="muted">Mínimo digital: 24px</small></div><div class="row">${K.mark(16)}<small class="muted">Favicon: 16px (simplificado)</small></div></div></div></div>
          <div class="card stack-sm"><h3 style="font-size:17px">Não faça</h3><div class="row dont-row">
            <div class="dont"><span style="display:inline-block;transform:scaleX(1.5)">${K.mark(44)}</span><small>Distorcer</small></div>
            <div class="dont"><span style="filter:hue-rotate(140deg);display:inline-block">${K.mark(44)}</span><small>Trocar as cores</small></div>
            <div class="dont"><span style="display:inline-block;transform:rotate(-20deg)">${K.mark(44)}</span><small>Girar</small></div>
            <div class="dont" style="background:#7FA9B8">${K.mark(44, '#86AFBE')}<small>Pouco contraste</small></div></div></div>
        </div>`)}
    </main>`
  };

  /* ======================= MAPA DE NAVEGAÇÃO ======================= */
  const MAPA = [
    ['Público', 'var(--line-strong)', [['#/', 'Home'], ['#/entrar', 'Escolha de perfil', [['#/entrar/administrador', 'Login · coordenação'], ['#/entrar/professor', 'Login · professor'], ['#/entrar/responsavel', 'Login · responsável']]], ['#/recuperar-senha', 'Recuperar senha (3 passos)'], ['#/sessao-expirada', 'Sessão expirada'], ['#/acesso-negado', 'Acesso negado'], ['#/privacidade', 'Privacidade e LGPD']]],
    ['Coordenação', 'var(--sun)', [['#/admin/painel', 'Painel'], ['#/admin/alunos', 'Alunos', [['#/admin/alunos/novo', 'Novo / editar aluno']]], ['#/admin/professores', 'Professores', [['#/admin/professores/novo', 'Novo / editar']]], ['#/admin/responsaveis', 'Responsáveis', [['#/admin/responsaveis/novo', 'Novo / editar + consentimento']]], ['#/admin/turmas', 'Turmas', [['#/admin/turmas/6A', 'Detalhe da turma']]], ['#/admin/disciplinas', 'Áreas, disciplinas e tags'], ['#/admin/vinculos', 'Vínculos'], ['#/admin/periodos', 'Períodos letivos'], ['#/admin/revisao', 'Revisão', [['#/admin/revisao/rel-103', 'Revisar → publicar / devolver / cancelar']]], ['#/admin/relatorios', 'Relatórios gerenciais → exportar'], ['#/admin/auditoria', 'Histórico e auditoria'], ['#/admin/perfil', 'Perfil']]],
    ['Professor', 'var(--sky)', [['#/professor/painel', 'Início'], ['#/professor/turmas', 'Minhas turmas', [['#/professor/turmas/6A?disc=MAT', 'Turma', [['#/professor/alunos/a5', 'Aluno']]]]], ['#/professor/registro/novo', 'Novo acompanhamento', [['#/professor/registro/rel-135/previa', 'Pré-visualização → enviar']]], ['#/professor/registros', 'Meus registros', [['#/professor/registros/rel-102', 'Detalhe + retorno da família'], ['#/professor/registro/rel-136/editar', 'Ajustar após devolução']]], ['#/professor/perfil', 'Perfil']]],
    ['Família', 'var(--mint)', [['#/familia/selecionar', 'Escolha do aluno'], ['#/familia/painel', 'Início (por bimestre)'], ['#/familia/relatorios', 'Relatórios (filtros)', [['#/familia/relatorios/rel-109', 'Relatório → ciência e observação', [['#/familia/imprimir/rel-109', 'Impressão / PDF']]]]], ['#/familia/historico', 'Histórico'], ['#/familia/perfil', 'Perfil e tamanho do texto']]]
  ];
  const tree = (items) => `<ul>${items.map(([h, l, kids]) => `<li><a href="${h}">${l}</a>${kids ? tree(kids) : ''}</li>`).join('')}</ul>`;
  K.views.mapa = {
    title: 'Mapa de navegação',
    render: () => `${head('mapa')}
    <main id="conteudo" class="docs">
      <header class="docs-hero"><h1 id="page-title" tabindex="-1">Mapa de navegação</h1><p class="docs-meta">Entrega 2 · Design de Interface Digital</p><p class="lead">Todas as telas do protótipo, organizadas por perfil. Cada item é um link para a tela. O protótipo equivalente em Figma está na página “Protótipo navegável” do <a href="${FIGMA}" target="_blank" rel="noopener noreferrer">arquivo do projeto</a>.</p></header>
      <div class="sitemap-root"><span class="sm-node root">${K.mark(28)} KFKA</span></div>
      <div class="sitemap">${MAPA.map(([t, c, items]) => `<section class="sm-col" style="--c:${c}" aria-label="${t}"><h2 class="sm-head"><span class="dot"></span>${t}</h2><div class="sm-tree">${tree(items)}</div></section>`).join('')}</div>
      ${sec('fluxos', 'Fluxos obrigatórios (cenário de ponta a ponta)', 'Segue o critério de aceitação do documento: o administrador abre o bimestre → o professor envia → o administrador publica → a família consulta e gera o PDF → o administrador exporta para Excel.', `
        <div class="grid-2">${[
          ['Coordenação', ['#/admin/painel', 'Painel'], ['#/admin/turmas', 'Estrutura'], ['#/admin/periodos', 'Abre o bimestre'], ['#/admin/revisao', 'Fila de revisão'], ['#/admin/revisao/rel-103', 'Publicar/devolver'], ['#/admin/auditoria', 'Auditoria']],
          ['Professor', ['#/professor/painel', 'Painel'], ['#/professor/turmas/6A?disc=MAT', 'Turma'], ['#/professor/alunos/a5', 'Aluno'], ['#/professor/registro/novo?aluno=a5&disc=MAT&bim=3', 'Novo registro'], ['#/professor/registros?status=devolvido', 'Ajuste após devolução']],
          ['Família', ['#/entrar/responsavel', 'Login'], ['#/familia/selecionar', 'Aluno'], ['#/familia/painel', 'Painel'], ['#/familia/relatorios?bim=3', 'Filtro'], ['#/familia/relatorios/rel-109', 'Relatório e ciência'], ['#/familia/imprimir/rel-109', 'PDF']],
          ['Gestão', ['#/admin/painel', 'Painel'], ['#/admin/relatorios', 'Filtros'], ['#/admin/relatorios?turma=6A', 'Lista'], ['#/admin/revisao/rel-103', 'Detalhe'], ['#/admin/auditoria', 'Histórico'], ['#/admin/relatorios', 'Exportar para Excel']]
        ].map(([t, ...steps]) => `<div class="card stack-sm"><h3 style="font-size:17px">${t}</h3><ol class="flow">${steps.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ol></div>`).join('')}</div>`)}
    </main>`
  };

  /* ======================= PESQUISA + REQUISITOS ======================= */
  // IDs oficiais do documento PI_2ADS_202602_KFKA_FINAL
  const MATRIZ = [
    ['RF01', 'Autenticação e perfis: login, logout, recuperação de senha e autorização por perfil', 'Escolha de perfil, Login, Recuperar senha, Sair, Sessão expirada, Acesso negado', '#/entrar', 'role-option, field, alert, strength'],
    ['RF02', 'Cadastros: responsáveis, alunos, professores, áreas, disciplinas, turmas e tags (ativar/inativar)', 'Alunos, Professores, Responsáveis, Turmas, Áreas e disciplinas, Tags', '#/admin/disciplinas', 'table, toolbar, field, switch, modal'],
    ['RF03', 'Vínculos da turma, impedindo incompatíveis ou duplicados', 'Vínculos, Detalhe da turma', '#/admin/vinculos', 'select, alerta de duplicado/incompatível'],
    ['RF04', 'Períodos: data e hora de abertura e encerramento dos 4 bimestres', 'Períodos letivos', '#/admin/periodos', 'period-banner, year-line, validação de datas'],
    ['RF05', 'Acompanhamento: descrição, média e múltiplas tags', 'Novo acompanhamento', '#/professor/registro/novo', 'form-section, tag-picker, contador'],
    ['RF06', 'Fluxo editorial: rascunho, envio, revisão, alteração, devolução e publicação', 'Prévia, Revisão, Ajuste', '#/admin/revisao/rel-103', 'stepper, media-box, modais, action-bar'],
    ['RF07', 'Histórico e auditoria: autor, revisor, datas e versões', 'Histórico (linha do tempo), Auditoria', '#/admin/auditoria', 'timeline, tl-change, comparar versões'],
    ['RF08', 'Responsável vê só alunos vinculados e relatórios publicados', 'Escolha do aluno, Início, Relatórios', '#/familia/painel', 'pick-card, bim-tabs, disc-card, empty'],
    ['RF09', 'Gerar ou baixar o relatório em PDF', 'Relatório, Impressão A4', '#/familia/imprimir/rel-109', 'print-page, @media print, modal de geração'],
    ['RF10', 'Relatórios gerenciais (admin) e registros/retornos (professor)', 'Relatórios gerenciais, Início do professor', '#/admin/relatorios', 'kpi, vbars, filtros, timeline'],
    ['RF11', 'Exportação compatível com Excel (.xlsx/.csv)', 'Relatórios gerenciais', '#/admin/relatorios', 'modal exportar, format-opt'],
    ['RF12', 'Ciência e observação da família, visível ao professor e à coordenação', 'Relatório (família), Registro (professor), Revisão (coordenação)', '#/professor/registros/rel-102', 'retorno da família, comment, toast'],
    ['RNF', 'Responsividade', 'Todas', '#/design', 'gaveta, tabbar, tabela → cartões'],
    ['RNF', 'Usabilidade e acessibilidade (contraste, teclado, rótulos)', 'Todas', '#/design', 'skip-link, focus-visible, aria, contraste AA'],
    ['RNF', 'Segurança (interface): sessões com expiração, menor privilégio', 'Sessão expirada, Acesso negado', '#/sessao-expirada', 'empty, alert'],
    ['RNF', 'Privacidade e LGPD', 'Privacidade, Responsáveis (consentimento)', '#/privacidade', 'check de consentimento, alert shield'],
    ['RNF', 'Desempenho: paginação', 'Listas da coordenação', '#/admin/alunos', 'pagination']
  ];
  const ENTREGAS = [
    ['Entrega 1', 'Layout e prototipação da Home no Figma', '#/', 'Home + Figma'],
    ['Entrega 1', 'Definição da paleta de cores (coerente e acessível)', '#/design', 'Paleta + tabela de contraste'],
    ['Entrega 1', 'Guia de estilo: tipografia, espaçamento, alinhamento, ícones, interações', '#/design', 'Design System'],
    ['Entrega 2', 'Mapa de navegação', '#/mapa', 'Mapa por perfil'],
    ['Entrega 2', 'Prototipação navegável de todas as páginas', '#/entrar', 'Protótipo (código + Figma)'],
    ['Entrega 2', 'Design System do projeto', '#/design', 'Tokens + componentes'],
    ['Processo', 'Associações, brainstorm, caixa morfológica e moodboard (aulas)', '#/marca', 'Marca']
  ];
  K.views.documentacao = {
    title: 'Pesquisa e requisitos',
    render: () => `${head('doc')}
    <main id="conteudo" class="docs">
      <header class="docs-hero"><h1 id="page-title" tabindex="-1">Pesquisa, entregas e requisitos</h1><p class="docs-meta">Engenharia reversa de UX/UI</p><p class="lead">Como as referências informaram as decisões do KFKA e onde cada requisito do documento aparece no protótipo. Não copiamos marca, logotipo, textos nem identidade visual de nenhuma referência.</p>
        ${toc('#/documentacao', [['entregas', 'Entregas de design'], ['refs', 'Referências'], ['dec', 'Decisões'], ['matriz', 'Matriz de requisitos']])}</header>
      ${sec('entregas', 'Entregas de Design de Interface Digital', 'Conferência com o cronograma do documento (Entrega 1 em 25/09 e Entrega 2 em 06/11).', `
        <div class="card flush"><div class="table-wrap"><table class="table"><thead><tr><th>Entrega</th><th>O que pede</th><th>Onde está</th><th>Situação</th></tr></thead><tbody>
        ${ENTREGAS.map(([e, o, h, l]) => `<tr><td class="cell-main"><b>${e}</b></td><td data-label="Pede">${o}</td><td data-label="Onde"><a href="${h}">${l}</a></td><td data-label="Situação"><span class="status publicado">${I('check')}Atendido</span></td></tr>`).join('')}
        </tbody></table></div></div>`)}
      ${sec('refs', 'Referências analisadas', 'O Seesaw foi navegado em detalhe. As outras são as indicadas na apresentação do professor (ClipEscola, Lyceum, TutorMundi, Sponte, TOTVS Educacional e Kaits); ClipEscola, Lyceum e TutorMundi foram observadas pelas capturas dos slides.', `
        <div class="grid-2">${[
          ['users', 'Seesaw', 'O login começa com “quem é você?”. A família vê o portfólio como um álbum e confirma a leitura.', 'Tela /entrar com cartões de perfil. Painel da família por disciplina, com “Li e estou ciente”.'],
          ['message', 'ClipEscola', 'Hero com o app aberto num celular, balões de conversa e ícones flutuantes. CTA amarelo de alto contraste.', 'Hero com mock do app e cartões flutuantes (nota e aviso de publicação). O sol aparece como cor de destaque.'],
          ['chart', 'Lyceum', 'Números de impacto em cartões sobrepostos ao print do sistema. Checklist de benefícios.', 'Cartões flutuantes no hero, números na faixa de segurança e checklists por perfil.'],
          ['tag', 'TutorMundi', 'Etiquetas em pílula e títulos fortes e arredondados.', 'Tags pedagógicas em pílula e títulos em Bricolage Grotesque.'],
          ['layers', 'Sponte · TOTVS · Kaits', 'Sistemas de gestão escolar: menu lateral denso e foco em cadastros.', 'Menu lateral agrupado por tarefa (Estrutura escolar e Acompanhamento) e contadores de pendências.'],
          ['palette', 'Moodboard “The Cutting Edge” (slide)', 'Primária fria (azuis) + secundária quente (amarelo e laranja). Ícones em formas geométricas.', 'Base tinta/teal + acentos sol e menta. Ícones de traço com grade de 24px.']
        ].map(([ic, t, o, d]) => `<article class="card stack-sm"><span class="ico ico-teal" style="width:40px;height:40px;border-radius:12px">${I(ic)}</span><h3 style="font-size:17px">${t}</h3><p class="text-2" style="font-size:14px"><b>Observado:</b> ${o}</p><p style="font-size:14px"><b>No KFKA:</b> ${d}</p></article>`).join('')}</div>`)}
      ${sec('dec', 'Decisões de design', '', `<ul class="checklist card">${[
        'Um único layout logado (menu lateral + barra superior) para os três perfis, mudando só o menu e a cor do selo. Isso reduz o tempo de aprendizado.',
        'O bimestre é o eixo de navegação (abas de bimestre), porque é assim que escola e família pensam o ano.',
        'O fluxo de status aparece num “stepper” nas telas do professor e da coordenação.',
        'Para a família: linguagem acolhedora, nota em destaque e barra de abas no celular, onde ela mais acessa.',
        'O retorno da família (ciência e observação) aparece para o professor e a coordenação no mesmo registro.',
        'Toda ação mostra um toast com o selo “simulação local”, para ficar claro que nada foi enviado a um servidor.',
        'A camada KFKA.api isola os dados: na fase funcional, basta trocá-la por fetch() para a API.'
      ].map((x) => `<li>${I('check-circle')}${x}</li>`).join('')}</ul>`)}
      ${sec('matriz', 'Matriz requisito → tela → componente', 'IDs conforme o documento oficial do projeto. Clique na rota para abrir a tela.', `
        <div class="card flush"><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Requisito</th><th>Tela(s)</th><th>Rota</th><th>Componentes</th></tr></thead><tbody>
        ${MATRIZ.map(([id, req, tela, rota, comp]) => `<tr><td class="cell-main"><b class="mono">${id}</b></td><td data-label="Requisito">${req}</td><td data-label="Tela">${tela}</td><td data-label="Rota"><a class="mono" href="${rota}" style="font-size:12px">${rota}</a></td><td data-label="Componentes"><small class="text-2">${comp}</small></td></tr>`).join('')}
        </tbody></table></div></div>`)}
    </main>`
  };
  K.route('/design', K.views.design);
  K.route('/marca', K.views.marca);
  K.route('/mapa', K.views.mapa);
  K.route('/documentacao', K.views.documentacao);
})(window.KFKA);
