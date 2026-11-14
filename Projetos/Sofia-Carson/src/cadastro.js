// Cadastro de fã: confere os campos e responde na hora. Não envia nada para lugar nenhum e não guarda nada:
// é um fã-site, sem servidor e sem vínculo com a artista.
export function cadastro() {
  const form = document.querySelector('[data-cadastro]');
  if (!form) return;
  const retorno = form.querySelector('[data-retorno]');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    if (!nome) { retorno.textContent = 'Falta o seu nome.'; form.nome.focus(); return; }
    if (!form.email.checkValidity() || !form.email.value.trim()) { retorno.textContent = 'Confira o e-mail: algo como voce@exemplo.com.'; form.email.focus(); return; }
    const primeiro = nome.split(/\s+/)[0];
    retorno.textContent = `Pronto, ${primeiro}! Você entrou no fã-clube com ‘${form.cancao.value}’ na cabeça. Nada foi enviado.`;
    form.reset();
  });
}
