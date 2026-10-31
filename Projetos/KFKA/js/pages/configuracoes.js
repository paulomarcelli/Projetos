/* =========================================================
   KFKA — Configurações (os três perfis)
   /admin/configuracoes · /professor/configuracoes · /familia/configuracoes
   Aparência: tema (Sistema / Claro / Escuro, com prévia de cada um), tamanho do texto
   e movimento. Tudo vale só para a sessão (K.state, em memória): o protótipo não grava
   nada no navegador, por regra do projeto.
   ========================================================= */
(function (K) {
  'use strict';
  const I = K.icon;
  const VOLTA = { admin: ['Coordenação', '#/admin/painel'], professor: ['Professor', '#/professor/painel'], familia: ['Início', '#/familia/painel'] };

  // Miniatura de uma tela em cada tema. "Sistema" mostra as duas metades lado a lado.
  const mini = (modo) => `<span class="tema-mini tema-mini-${modo}" aria-hidden="true">
      <span class="tm-side"></span><span class="tm-main"><i></i><i class="tm-linha"></i><i class="tm-linha curta"></i><i class="tm-bt"></i></span></span>`;

  const aplicarMovimento = () => document.documentElement.classList.toggle('menos-movimento', !!K.state.menosMovimento);

  const tela = (role) => ({
    title: 'Configurações',
    render: () => K.shell(role, 'configuracoes', `
      ${K.pageHead({ crumbs: [{ label: VOLTA[role][0], href: VOLTA[role][1] }, { label: 'Configurações' }], title: 'Configurações', lead: 'Aparência e leitura. As escolhas valem até você fechar ou recarregar a página.' })}
      <section class="card stack config-sec" aria-labelledby="ap-t">
        <h2 id="ap-t" class="config-h">${I('sun')} Aparência</h2>
        <div class="field"><span class="field-label" id="tema-cfg-l">Tema</span>
          <div class="tema-cards" role="radiogroup" aria-labelledby="tema-cfg-l">
            ${K.TEMAS.map(([v, l, ic]) => `<button type="button" role="radio" class="tema-card" data-action="tema" data-tema="${v}" aria-checked="${K.temaAtual() === v}" aria-pressed="${K.temaAtual() === v}">
              ${mini(v)}<span class="tema-card-rot">${I(ic, 'icon-sm')} ${l}${v === 'sistema' ? '<small>acompanha o aparelho</small>' : ''}</span><span class="tema-card-ok" aria-hidden="true">${I('check', 'icon-sm')}</span></button>`).join('')}
          </div>
          <span class="hint">O modo escuro reduz o brilho à noite; os status continuam com texto, ícone e cor.</span></div>
      </section>
      <section class="card stack config-sec" aria-labelledby="le-t">
        <h2 id="le-t" class="config-h">${I('book')} Leitura</h2>
        <div class="field"><span class="field-label" id="fs-cfg-l">Tamanho do texto</span><div class="segmented" role="group" aria-labelledby="fs-cfg-l">${[['1', 'Padrão'], ['1.12', 'Maior'], ['1.25', 'Grande']].map(([v, l]) => `<button type="button" data-action="cfg-fs" data-fs="${v}" aria-pressed="${(K.state.zoom || '1') === v}">${l}</button>`).join('')}</div>
          <p class="config-amostra" style="font-size:calc(15px * ${K.state.zoom || 1})">Participou com curiosidade do projeto sobre o ciclo da água.</p></div>
        <label class="switch"><input type="checkbox" data-cfg="movimento" ${K.state.menosMovimento ? 'checked' : ''}><span class="track"></span>Reduzir animações <small class="muted">· além do que o aparelho já pede</small></label>
      </section>`),
    mount: (root) => {
      const ck = K.qs('[data-cfg="movimento"]', root);
      ck && ck.addEventListener('change', () => { K.state.menosMovimento = ck.checked; aplicarMovimento(); K.toast(ck.checked ? 'Animações reduzidas' : 'Animações normais', 'SIMULAÇÃO LOCAL · vale apenas para esta sessão.', 'info'); });
    }
  });

  K.actions['cfg-fs'] = (el) => {
    K.state.zoom = el.dataset.fs;
    document.documentElement.style.setProperty('--zoom', el.dataset.fs);
    K.qsa('[data-action="cfg-fs"]').forEach((x) => x.setAttribute('aria-pressed', String(x === el)));
    const a = K.qs('.config-amostra'); a && (a.style.fontSize = `calc(15px * ${el.dataset.fs})`);
    K.toast('Tamanho do texto ajustado', 'SIMULAÇÃO LOCAL · vale apenas para esta sessão.');
  };
  ['admin', 'professor', 'familia'].forEach((r) => K.route(`/${r}/configuracoes`, tela(r)));
})(window.KFKA);
