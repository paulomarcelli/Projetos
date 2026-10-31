/* =========================================================
   KFKA — Configurações (os três perfis)
   /admin/configuracoes · /professor/configuracoes · /familia/configuracoes
   Aparência (tema) e Acessibilidade: tamanho do texto, espaçamento de leitura, links
   sublinhados e menos animação. As escolhas ficam em K.prefs (core.js) e valem para a aba.
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon;
  const VOLTA = { admin: ['Coordenação', '#/admin/painel'], professor: ['Professor', '#/professor/painel'], familia: ['Início', '#/familia/painel'] };
  const rotulo = (v) => (K.TAMANHOS.find(([x]) => x === v) || K.TAMANHOS[0])[1];
  const pct = (v) => `${String(v).replace('.', ',')}%`;

  // Miniatura de uma tela em cada tema. "Sistema" mostra as duas metades lado a lado.
  const mini = (modo) => `<span class="tema-mini tema-mini-${modo}" aria-hidden="true">
      <span class="tm-side"></span><span class="tm-main"><i></i><i class="tm-linha"></i><i class="tm-linha curta"></i><i class="tm-bt"></i></span></span>`;

  /* Tamanho do texto: rádios de verdade (setas do teclado trocam a opção, o leitor de tela
     anuncia "1 de 4"), com um "Aa" que cresce em cada opção e botões A−/A+ para quem prefere
     ajustar em passos. Usado aqui e no perfil da família. */
  K.controleTexto = (id = 'tt') => `
    <fieldset class="field tamanho-texto"><legend id="${id}-l">Tamanho do texto</legend>
      <div class="tt-linha">
        <button type="button" class="icon-btn" data-action="texto-passo" data-passo="-1" aria-label="Diminuir o texto" ${K.prefs.texto === K.TAMANHOS[0][0] ? 'disabled' : ''}><span aria-hidden="true" class="tt-a menor">A−</span></button>
        <div class="tt-opcoes" role="radiogroup" aria-labelledby="${id}-l">
          ${K.TAMANHOS.map(([v, l], i) => `<label class="tt-opcao"><input type="radio" name="${id}" value="${v}" data-texto ${K.prefs.texto === v ? 'checked' : ''}><span><b class="tt-aa" style="font-size:${1 + i * 0.18}rem" aria-hidden="true">Aa</b><small>${l}</small></span></label>`).join('')}
        </div>
        <button type="button" class="icon-btn" data-action="texto-passo" data-passo="1" aria-label="Aumentar o texto" ${K.prefs.texto === K.TAMANHOS.at(-1)[0] ? 'disabled' : ''}><span aria-hidden="true" class="tt-a">A+</span></button>
      </div>
      <span class="hint">Aumenta o texto do sistema inteiro: menus, tabelas e relatórios. O tamanho de letra do seu navegador ou celular também é respeitado.</span>
    </fieldset>`;

  const interruptor = (cfg, titulo, texto, ligado) => `
    <label class="switch switch-longo"><input type="checkbox" role="switch" data-cfg="${cfg}" ${ligado ? 'checked' : ''}><span class="track" aria-hidden="true"></span>
      <span class="switch-txt"><b>${titulo}</b><small>${texto}</small></span></label>`;

  const tela = (role) => ({
    title: 'Configurações',
    render: () => K.shell(role, 'configuracoes', `
      ${K.pageHead({ crumbs: [{ label: VOLTA[role][0], href: VOLTA[role][1] }, { label: 'Configurações' }], title: 'Configurações', lead: 'Aparência e acessibilidade. As escolhas valem enquanto esta aba estiver aberta.' })}
      <section class="card stack config-sec" aria-labelledby="ac-t">
        <h2 id="ac-t" class="config-h">${I('user')} Acessibilidade</h2>
        ${K.controleTexto('tt')}
        <div class="config-amostra" aria-hidden="true">
          <div class="pv-head"><b>Ciências · 3º bimestre</b>${K.status('publicado')}</div>
          <p>Participou com curiosidade do projeto sobre o ciclo da água e ajudou os colegas a registrar as medições.</p>
        </div>
        <div class="config-opcoes">
          ${interruptor('espaco', 'Espaçamento de leitura', 'Mais espaço entre linhas, letras e palavras.', K.prefs.espaco)}
          ${interruptor('links', 'Sublinhar links', 'Links no texto ficam sublinhados, não só coloridos.', K.prefs.links)}
          ${interruptor('movimento', 'Reduzir animações', 'Além do que o aparelho já pede. Nada se desloca na tela.', K.prefs.menosMovimento)}
        </div>
        <div class="row-between config-rodape"><p class="muted config-status" role="status" aria-live="polite"></p><button type="button" class="btn btn-secondary" data-action="prefs-restaurar">${I('refresh', 'icon-sm')} Restaurar o padrão</button></div>
      </section>
      <section class="card stack config-sec" aria-labelledby="ap-t">
        <h2 id="ap-t" class="config-h">${I('sun')} Aparência</h2>
        <div class="field"><span class="field-label" id="tema-cfg-l">Tema</span>
          <div class="tema-cards" role="radiogroup" aria-labelledby="tema-cfg-l">
            ${K.TEMAS.map(([v, l, ic]) => `<button type="button" role="radio" class="tema-card" data-action="tema" data-tema="${v}" aria-checked="${K.temaAtual() === v}" aria-pressed="${K.temaAtual() === v}">
              ${mini(v)}<span class="tema-card-rot">${I(ic, 'icon-sm')} ${l}${v === 'sistema' ? '<small>acompanha o aparelho</small>' : ''}</span><span class="tema-card-ok" aria-hidden="true">${I('check', 'icon-sm')}</span></button>`).join('')}
          </div>
          <span class="hint">O modo escuro reduz o brilho à noite; os status continuam com texto, ícone e cor.</span></div>
      </section>`),
    mount: (root) => {
      K.qsa('[data-cfg]', root).forEach((ck) => ck.addEventListener('change', () => {
        const chave = { espaco: 'espaco', links: 'links', movimento: 'menosMovimento' }[ck.dataset.cfg];
        K.salvarPrefs({ [chave]: ck.checked });
        avisar(`${ck.closest('label').querySelector('b').textContent}: ${ck.checked ? 'ligado' : 'desligado'}.`);
      }));
    }
  });

  // Aviso discreto (região "status"): sem toast a cada clique, mas o leitor de tela ouve.
  const avisar = (txt) => { const s = K.qs('.config-status'); if (s) s.textContent = txt; };
  const sincronizar = () => {
    K.qsa('input[data-texto]').forEach((r) => { r.checked = r.value === K.prefs.texto; });
    K.qsa('[data-action="texto-passo"]').forEach((b) => { b.disabled = b.dataset.passo === '-1' ? K.prefs.texto === K.TAMANHOS[0][0] : K.prefs.texto === K.TAMANHOS.at(-1)[0]; });
  };
  const mudarTexto = (v) => { K.salvarPrefs({ texto: v }); sincronizar(); avisar(`Texto ${rotulo(v).toLowerCase()} (${pct(v)}).`); };
  document.addEventListener('change', (e) => { if (e.target.matches('input[data-texto]')) mudarTexto(e.target.value); });
  K.actions['texto-passo'] = (el) => {
    const i = K.TAMANHOS.findIndex(([v]) => v === K.prefs.texto) + Number(el.dataset.passo);
    if (i >= 0 && i < K.TAMANHOS.length) mudarTexto(K.TAMANHOS[i][0]);
  };
  K.actions['prefs-restaurar'] = () => { K.restaurarPrefs(); K.refresh(); setTimeout(() => avisar('Preferências restauradas para o padrão.'), 0); };
  ['admin', 'professor', 'familia'].forEach((r) => K.route(`/${r}/configuracoes`, tela(r)));
})(window.KFKA);
