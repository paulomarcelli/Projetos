// ===== 1. CONFIGURAÇÃO DO FIREBASE =====
// Cole aqui o objeto firebaseConfig que o Firebase te mostra (Configurações do projeto > Seus apps > Web)
const firebaseConfig = {
  apiKey: "AIzaSyDWCrtCm2ErW46TzMTaRprEq54iQEWuZxk",            // chave pública do app web
  authDomain: "role-5146c.firebaseapp.com",                       // domínio do projeto
  projectId: "role-5146c",                                        // id do projeto
  storageBucket: "role-5146c.firebasestorage.app",                // armazenamento
  messagingSenderId: "828180606862",                              // número do projeto
  appId: "1:828180606862:web:eeac6cbcb72b6fd2c8fedf"              // id do app web
};

// ===== 2. CONSTANTES =====
const PEOES = 6; // quantas pessoas dividem a conta
// Formata número como dinheiro brasileiro (R$ 1.234,56)
const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
// Parâmetros da busca no Airbnb (datas e 6 adultos) que vão no link de cada apê
const Q = '?adults=6&check_in=2026-10-24&check_out=2026-10-25';
// Começo de toda URL de foto do Airbnb
const AIR = 'https://a0.muscache.com/im/pictures/';

// ===== 3. DADOS DOS APARTAMENTOS (Airbnb, busca de 08/10/2026) =====
// room = id do anúncio, total = preço da noite com taxas, antes = preço riscado (se tinha desconto)
const APES = [
  { id: 'a1', room: '872225569274792608', nome: 'Apartamento 2 quartos · Metrô São Bento', bairro: 'Centro / São Bento', quartos: 2, camas: 3, banh: 1, nota: '4,65 (217)', total: 411, antes: 488,
    foto: AIR + 'd397b98a-55f5-42d2-b61d-6cbef7036766.jpg?im_w=720' },
  { id: 'a2', room: '1493855557885912050', nome: 'Apê Hollywood com cabine de cinema · até 8 hósp.', bairro: 'Centro · perto do metrô', quartos: 2, camas: 5, banh: 1, nota: '4,64 (84)', total: 682, antes: 788,
    foto: AIR + 'hosting/Hosting-1493855557885912050/original/fc82ef11-0f61-42e7-94bd-9a8f8a97c3a1.jpeg?im_w=720' },
  { id: 'a3', room: '1682958132202952675', nome: 'Família 87 · Augusta', bairro: 'Rua Augusta', quartos: 2, camas: 3, banh: 2, nota: '4,82 (17) · Superhost', total: 427, antes: 585,
    foto: AIR + 'hosting/Hosting-1682958132202952675/original/48b01f2c-fb88-4521-ac2d-ce31cfca3a26.jpeg?im_w=720' },
  { id: 'a4', room: '1457483934655180836', nome: 'Conforto no Centro de São Paulo', bairro: 'Centro', quartos: 2, camas: 4, banh: 1, nota: '4,91 (56) · Preferido', total: 667, antes: 772,
    foto: AIR + 'miso/Hosting-1457483934655180836/original/28b957f9-17aa-4a54-b72d-c5648b028e1f.jpeg?im_w=720' },
  { id: 'a5', room: '51584299', nome: 'Apto 6 hósp. · 25 de Março · Metrô São Bento', bairro: 'Centro / 25 de Março', quartos: 1, camas: 4, banh: 1, nota: '4,71 (230)', total: 507, antes: 655,
    foto: AIR + '13e8d714-e79e-4ec0-9902-5e429db12b27.jpg?im_w=720' },
  { id: 'a6', room: '1582155146030075463', nome: 'Apartamento aconchego no centro de SP', bairro: 'Centro', quartos: 1, camas: 6, banh: 1, nota: '5,0 (20) · Preferido', total: 305,
    foto: AIR + 'hosting/Hosting-1582155146030075463/original/c8ce29e5-dd15-48a5-a10a-7c4df90f84c8.jpeg?im_w=720' },
  { id: 'a7', room: '1734405827860812696', nome: '2 quartos no Centro · novo e decorado', bairro: 'Centro', quartos: 2, camas: 4, banh: 1, nota: '5,0 (5) · Preferido', total: 684, antes: 782,
    foto: AIR + 'hosting/Hosting-1734405827860812696/original/937d19e9-2060-4dd0-82c5-9142dab59341.jpeg?im_w=720' },
  { id: 'a8', room: '14107059', nome: 'Experiência única no centro · Executivo', bairro: 'Centro', quartos: 2, camas: 5, banh: 1, nota: '4,65 (112)', total: 640,
    foto: AIR + '56e4edb6-4ba2-46d2-b829-d12866a62cfd.jpg?im_w=720' },
  { id: 'a9', room: '1499068986743973353', nome: 'Oásis Urbano two · Brás', bairro: 'Brás (colado no Centro)', quartos: 2, camas: 4, banh: 1, nota: '4,93 (81) · Preferido', total: 480,
    foto: AIR + 'hosting/Hosting-1499068986743973353/original/383112d2-391d-4200-bd53-0edb4e02e0af.jpeg?im_w=720' },
  { id: 'a10', room: '1330451177290193462', nome: 'Apartamento com conforto', bairro: 'Região central', quartos: 2, camas: 6, banh: 1, nota: '4,91 (46) · Preferido', total: 281,
    foto: AIR + 'hosting/Hosting-1330451177290193462/original/a193808a-d514-4407-bbee-cc0364395da8.jpeg?im_w=720' },
];

// ===== 4. DADOS DAS BALADAS DE HALLOWEEN =====
// porPeao = entrada mais barata que cada um paga
const FESTAS = [
  { id: 'f1', nome: 'Halloween da Miau!', local: 'Kat Klub · Rua Augusta, 609 (Consolação)', quando: 'Sáb 31/10 · 22h às 6h', porPeao: 20,
    foto: 'https://katklub.com.br/imagens/eventos/31-10-2026_6abadeb7cfb3e.jpg',
    precos: ['VIP antecipado até 0h: R$ 20 (não vira consumo)', 'Ingresso + camiseta: R$ 70', 'Porta com lista: R$ 30 seca / R$ 60 consumível', 'Porta sem lista: R$ 40 seca / R$ 80 consumível'],
    bebidas: 'Sem open bar. Bar pago; o ingresso consumível vira drinks. Concurso de fantasia com prêmio de R$ 200.',
    link: 'https://katklub.com.br/evento?id=722' },
  { id: 'f2', nome: 'Halloween à Fantasia', local: 'Blitz Haus · Rua Augusta, 657 (Consolação)', quando: 'Sáb 31/10 · 20h às 6h', porPeao: 20,
    foto: 'https://images.sympla.com.br/6abc0cea3572f-lg.jpg',
    precos: ['Antecipado: R$ 20 (promo) / R$ 30 (último lote)', 'Antecipado consumível: R$ 80 / R$ 100', 'Lista até 22h: R$ 40 seca / R$ 100 consumível', 'Porta sem lista: R$ 60 seca / R$ 140 consumível'],
    bebidas: 'Sem open bar. Promo de drinks e combos de comida; o consumível vira bebida.',
    link: 'https://www.sympla.com.br/evento/halloween-festa-de-halloween-a-fantasia-da-blitz-haus/3596633' },
  { id: 'f3', nome: 'Halloween da Alpha', local: 'Audio · Av. Francisco Matarazzo, 694 (Barra Funda)', quando: 'Sáb 31/10 · a partir das 20h', porPeao: 54,
    foto: 'https://images.ticket360.com.br/images.ticket360/eventos/principal/34195-20260916151722.webp',
    precos: ['Ingressos de R$ 54 a R$ 420 (pista, meia e camarote)', 'Pista: bar pago', 'Camarote: open bar'],
    bebidas: 'Open bar só no camarote: água, refrigerante, cerveja, vodka, whisky, gin e energético. Som flashback dos anos 70 aos 2000.',
    link: 'https://www.ticket360.com.br/evento/34195/ingressos-para-halloween-da-alpha' },
  { id: 'f4', nome: 'Halloween Kat Klub · Open Bar (véspera)', local: 'Kat Klub · Rua Augusta, 609', quando: 'Sex 30/10 · 22h às 6h (plano B)', porPeao: 100,
    foto: 'https://katklub.com.br/imagens/eventos/30-10-2026_6aa25e345491f.jpg',
    precos: ['Antecipado lote 3: R$ 100', 'Aniversariante out/nov: R$ 80', 'Porta: R$ 120', 'Copo personalizado: R$ 15'],
    bebidas: 'Open bar a noite toda: vodka Smirnoff, gin nacional, cerveja Amstel, energético, refri e água. Xeque-Mate e caipirinha até meia-noite.',
    link: 'https://katklub.com.br/evento?id=707' },
];

// ===== 5. ESTADO DA PÁGINA =====
let me = null;    // nome do peão logado
let votes = {};   // todos os votos: { "paulo": {nome, ape, festa}, ... }
let db = null;    // conexão com o Firestore (null se não configurou)

// Lembra o peão logado neste navegador
try { me = localStorage.getItem('peao_nome') || null; } catch (e) {}

// Transforma "João Pé" em "joao-pe" para usar como id do voto
const slug = s => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'peao';
// Escapa texto para não quebrar o HTML (nome digitado pelo usuário)
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ===== 6. FUNÇÕES AUXILIARES =====
// Gera a <img>; se a foto não carregar, troca por um aviso
function photo(url, alt) {
  return `<img src="${url}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer"
    onerror="this.outerHTML='<div class=&quot;ph&quot;>Foto no link oficial ↗</div>'">`;
}
// Lista o nome de quem votou num item (field = 'ape' ou 'festa')
function votersOf(field, id) { return Object.values(votes).filter(v => v[field] === id).map(v => v.nome); }
// Voto do peão logado (ou objeto vazio)
function myVote() { return me ? votes[slug(me)] || {} : {}; }
// Conta votos por item e devolve o ranking [[id, qtd], ...]
function ranking(field) {
  const c = {};                                                        // contador
  Object.values(votes).forEach(v => { if (v[field]) c[v[field]] = (c[v[field]] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]);                // maior primeiro
}
// Item mais votado (ou null se ninguém votou)
function maisVotado(field, items) {
  const r = ranking(field);
  return r.length ? items.find(i => i.id === r[0][0]) : null;
}

// ===== 7. DESENHAR A PÁGINA =====
function render() {
  const mv = myVote(); // meu voto atual

  // --- Cards dos apês ---
  document.getElementById('apeGrid').innerHTML = APES.map(a => {
    const vs = votersOf('ape', a.id);   // quem votou neste
    const mine = mv.ape === a.id;       // é o meu voto?
    return `<article class="card${mine ? ' mine' : ''}">
      <div class="photo">${photo(a.foto, a.nome)}<span class="badge">${esc(a.bairro)}</span>${vs.length ? `<span class="votes-pill">${vs.length} voto${vs.length > 1 ? 's' : ''}</span>` : ''}</div>
      <div class="body">
        <h3>${esc(a.nome)}</h3>
        <div class="facts"><span class="chip">★ ${a.nota}</span><span class="chip">${a.quartos} quarto${a.quartos > 1 ? 's' : ''}</span><span class="chip">${a.camas} camas</span><span class="chip">${a.banh} banh.</span><span class="chip tv">TV ✓</span></div>
        <div class="money"><div class="total">Total da noite<br>${a.antes ? `<s>${brl(a.antes)}</s> ` : ''}<b>${brl(a.total)}</b></div><div class="peao">${brl(a.total / PEOES)}<small>por peão</small></div></div>
        <div class="voters">${vs.length ? 'Votaram: ' + vs.map(esc).join(', ') : ''}</div>
        <div class="actions"><button class="btn" data-vote="ape" data-id="${a.id}" type="button">${mine ? 'Seu voto ✓' : 'Votar neste'}</button><a class="btn ghost" href="https://www.airbnb.com.br/rooms/${a.room}${Q}" target="_blank" rel="noopener">Ver no Airbnb</a></div>
      </div></article>`;
  }).join('');

  // --- Cards das baladas ---
  document.getElementById('festaGrid').innerHTML = FESTAS.map(f => {
    const vs = votersOf('festa', f.id);
    const mine = mv.festa === f.id;
    return `<article class="card${mine ? ' mine' : ''}">
      <div class="photo">${photo(f.foto, f.nome)}<span class="badge">${esc(f.quando)}</span>${vs.length ? `<span class="votes-pill">${vs.length} voto${vs.length > 1 ? 's' : ''}</span>` : ''}</div>
      <div class="body">
        <h3>${esc(f.nome)}</h3>
        <div class="facts"><span class="chip">${esc(f.local)}</span></div>
        <ul class="prices">${f.precos.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        <div class="drinks"><b>Bebidas</b>${esc(f.bebidas)}</div>
        <div class="money"><div class="total">Entrada mais barata<br>por peão</div><div class="peao">${brl(f.porPeao)}<small>×6 = ${brl(f.porPeao * PEOES)}</small></div></div>
        <div class="voters">${vs.length ? 'Votaram: ' + vs.map(esc).join(', ') : ''}</div>
        <div class="actions"><button class="btn" data-vote="festa" data-id="${f.id}" type="button">${mine ? 'Seu voto ✓' : 'Votar nesta'}</button><a class="btn ghost" href="${f.link}" target="_blank" rel="noopener">Ingressos</a></div>
      </div></article>`;
  }).join('');

  // --- Quem está na frente ---
  leader('ape', APES, 'apeLeader', a => `${brl(a.total / PEOES)} por peão`);
  leader('festa', FESTAS, 'festaLeader', f => `a partir de ${brl(f.porPeao)} por peão`);

  // --- Placar: uma linha por peão ---
  const list = Object.values(votes).sort((a, b) => a.nome.localeCompare(b.nome));
  document.getElementById('peoesTbl').innerHTML = list.length
    ? list.map(v => {
        const a = APES.find(x => x.id === v.ape), f = FESTAS.find(x => x.id === v.festa);
        return `<tr><td>${esc(v.nome)}</td><td>${a ? esc(a.nome) : '—'}</td><td>${f ? esc(f.nome) : '—'}</td></tr>`;
      }).join('') + `<tr><td colspan="3">${list.length} de ${PEOES} peões votaram</td></tr>`
    : `<tr><td colspan="3">Nenhum peão votou ainda.</td></tr>`;

  // --- Conta: apê mais votado (ou mais barato) + balada mais votada ---
  const topA = maisVotado('ape', APES), topF = maisVotado('festa', FESTAS);
  const a = topA || APES.reduce((m, x) => x.total < m.total ? x : m);  // sem voto: o mais barato
  const f = topF || FESTAS[0];
  document.getElementById('contaTbl').innerHTML =
    `<tr><td>Apê</td><td>${esc(a.nome)}${topA ? '' : ' (mais barato)'}</td><td>${brl(a.total / PEOES)}</td></tr>
     <tr><td>Balada</td><td>${esc(f.nome)}${topF ? '' : ' (sem votos ainda)'}</td><td>${brl(f.porPeao)}</td></tr>
     <tr><td>Total</td><td>por peão, sem bebida extra e transporte</td><td><b>${brl(a.total / PEOES + f.porPeao)}</b></td></tr>`;

  // --- Resumo do meu voto na caixa de login ---
  if (me) {
    document.getElementById('myVotes').textContent =
      `Seu apê: ${(APES.find(x => x.id === mv.ape) || {}).nome || 'ainda não votou'} · Sua balada: ${(FESTAS.find(x => x.id === mv.festa) || {}).nome || 'ainda não votou'}`;
  }
}

// Escreve a faixa "Na frente: ..."
function leader(field, items, elId, extra) {
  const r = ranking(field);
  const el = document.getElementById(elId);
  if (!r.length) { el.textContent = 'Ninguém votou ainda. Seja o primeiro peão.'; return; }
  const [id, n] = r[0];                       // id e votos do primeiro
  const it = items.find(i => i.id === id);
  const tie = r[1] && r[1][1] === n;          // empate com o segundo?
  el.innerHTML = tie
    ? `Empate com <b>${n}</b> voto${n > 1 ? 's' : ''} cada. Falta peão votar.`
    : `Na frente: <b>${esc(it.nome)}</b> com ${n} voto${n > 1 ? 's' : ''} · ${extra(it)}`;
}

// Mostra um aviso rápido embaixo da tela
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove('on'), 2200);
}

// Alterna entre caixa de login e caixa de logado
function showLogin() {
  document.getElementById('loginBox').hidden = !!me;
  document.getElementById('loggedBox').hidden = !me;
  if (me) document.getElementById('whoName').textContent = me;
}

// ===== 8. EVENTOS =====
// Login: salva o nome e redesenha
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();                                   // não recarrega a página
  const n = document.getElementById('nome').value.trim();
  if (!n) return;
  me = n;
  try { localStorage.setItem('peao_nome', n); } catch (e) {}
  showLogin(); render();
  toast(`Fala, ${n}! Agora é só votar.`);
});

// Trocar peão: esquece o nome
document.getElementById('logout').addEventListener('click', () => {
  me = null;
  try { localStorage.removeItem('peao_nome'); } catch (e) {}
  showLogin(); render();
});

// Clique em qualquer botão de voto (delegação de evento)
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-vote]'); if (!b) return;   // não foi botão de voto
  if (!me) { document.getElementById('nome').focus(); toast('Entra com seu nome primeiro'); return; }
  if (!db) { toast('A votação ainda não está conectada.'); return; }
  const key = slug(me);                                         // id do documento
  const next = { ...(votes[key] || {}), nome: me, [b.dataset.vote]: b.dataset.id, atualizado: Date.now() };
  votes[key] = next; render();                                  // mostra na hora
  try { await db.collection('votos').doc(key).set(next); toast('Voto registrado'); }
  catch (err) { toast('Não salvou. Tenta de novo.'); }
});

// ===== 9. INICIAR =====
showLogin(); render();   // desenha a página mesmo sem banco

const st = document.getElementById('dbStatus');
if (firebaseConfig.projectId === 'COLE_AQUI') {
  // Ainda não colou a config do Firebase
  st.textContent = 'Votação desligada: falta configurar o Firebase no script.js.';
} else {
  firebase.initializeApp(firebaseConfig);   // liga o app
  db = firebase.firestore();                // abre o banco
  st.textContent = 'Votação ao vivo conectada.';
  // Escuta a coleção "votos": toda mudança atualiza a página de todo mundo
  db.collection('votos').onSnapshot(snap => {
    votes = {};
    snap.forEach(d => { const v = d.data(); if (v && v.nome) votes[d.id] = v; });
    render();
  }, () => { st.textContent = 'Não consegui ler os votos agora.'; });
}