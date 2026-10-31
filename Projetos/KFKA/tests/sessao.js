// Os testes visitam as áreas logadas direto pela URL. Como elas exigem login, este script abre a
// sessão da pessoa fictícia de cada área antes de a página carregar e a cada troca de rota
// (a sessão fica no sessionStorage, como no login de verdade).
module.exports = (page) => page.addInitScript(() => {
  const pior = /[?&]dados=pior\b/.test(location.search);
  const P = {
    admin: ['administrador', 'Marina Rocha', 'marina.rocha@aurora.edu.br', 'Coordenação pedagógica', '#FFC94A'],
    professor: ['professor', 'Carlos Lima', 'carlos.lima@aurora.edu.br', 'Matemática · Geografia', '#74C0FC'],
    familia: ['responsavel', pior ? 'Ana Beatriz Wiśniewska-Kowalczyk de Souza' : 'Ana Souza', 'ana.souza@email.com', 'Responsável', '#5FD4A8'],
  };
  const abrir = () => {
    const m = location.hash.match(/^#\/(admin|professor|familia)\b/);
    if (!m) return;
    const [perfil, nome, email, sub, cor] = P[m[1]];
    try { sessionStorage.setItem('kfka-sessao', JSON.stringify({ perfil, nome, email, sub, cor })); } catch (e) { /* sem armazenamento */ }
  };
  abrir();
  addEventListener('hashchange', abrir, true); // antes do roteador
});
