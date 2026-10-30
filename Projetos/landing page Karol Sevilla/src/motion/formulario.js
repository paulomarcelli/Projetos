// Formulário: valida ao sair de cada campo e no envio, com a mensagem junto do campo.
// É um projeto acadêmico: nada sai do navegador; o envio só mostra a confirmação.
const REGRAS = {
  nome: (v) => (v.trim().split(/\s+/).length >= 2 ? '' : 'Escreva nome e sobrenome.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Confira o e-mail: falta o @ ou o domínio.'),
  tel: (v) => (v.replace(/\D/g, '').length >= 10 ? '' : 'Coloque o DDD e o número (10 ou 11 dígitos).'),
  cidade: (v) => (v.trim().length >= 2 ? '' : 'Diga em que cidade você está.'),
};

function mascaraTelefone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formulario(form) {
  const sucesso = form.querySelector('.sucesso');
  const checar = (input) => {
    const msg = REGRAS[input.name]?.(input.value) ?? '';
    const erro = form.querySelector(`#${input.id}-erro`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) input.setAttribute('aria-describedby', erro.id); else input.removeAttribute('aria-describedby');
    erro.textContent = msg;
    return !msg;
  };
  const campos = Object.keys(REGRAS).map((n) => form.elements[n]);
  campos.forEach((input) => {
    input.addEventListener('blur', () => input.value && checar(input));
    input.addEventListener('input', () => input.getAttribute('aria-invalid') === 'true' && checar(input));
  });
  form.elements.tel.addEventListener('input', (e) => (e.target.value = mascaraTelefone(e.target.value)));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalidos = campos.filter((c) => !checar(c));
    if (invalidos.length) { invalidos[0].focus(); return; }
    form.querySelector('.sucesso__nome').textContent = form.elements.nome.value.trim().split(/\s+/)[0];
    sucesso.hidden = false;
    sucesso.querySelector('.refazer').focus();
  });
  form.querySelector('.refazer').addEventListener('click', () => {
    form.reset();
    campos.forEach((c) => { c.removeAttribute('aria-invalid'); form.querySelector(`#${c.id}-erro`).textContent = ''; });
    sucesso.hidden = true;
    form.elements.nome.focus();
  });
}
