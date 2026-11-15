// Avatares da equipe no estilo "figurinha": cabeça grande, olhos grandes e brilhantes, corpo pequeno.
// São desenhos originais em SVG, feitos para este projeto e inspirados nos heróis de cada agente (a Sofia tem
// identidade própria, de designer). O contorno branco de figurinha vem do CSS (.boneco, .av).
// Para usar uma imagem sua no lugar do desenho, ponha o arquivo em web/avatares/pessoais/<id>.png (ou .jpg, .webp):
// essa pasta fica fora do git e o escritório usa a imagem se ela existir.

let serie = 0;
const PELE = '#f6d2b8';
const PELE_SOMBRA = '#e9b799';

// ---------- partes comuns ----------
const olhos = ({ cor = '#2a1d1a', y = 66, piscando = false } = {}) => `
  <g class="av-olhos">
    ${piscando ? `<path d="M40 ${y}q6 -5 12 0" stroke="${cor}" stroke-width="3" fill="none" stroke-linecap="round"/>` : `<ellipse cx="46" cy="${y}" rx="6.800" ry="8.400" fill="${cor}"/><circle cx="43.600" cy="${y - 3.200}" r="2.700" fill="#fff"/><circle cx="48.400" cy="${y + 2.600}" r="1.200" fill="#fff"/>`}
    <ellipse cx="74" cy="${y}" rx="6.800" ry="8.400" fill="${cor}"/><circle cx="71.600" cy="${y - 3.200}" r="2.700" fill="#fff"/><circle cx="76.400" cy="${y + 2.600}" r="1.200" fill="#fff"/>
  </g>`;
const bochechas = (y = 77) => `<ellipse cx="35" cy="${y}" rx="5.500" ry="3.200" fill="#ff8fa3" opacity=".55"/><ellipse cx="85" cy="${y}" rx="5.500" ry="3.200" fill="#ff8fa3" opacity=".55"/>`;
const boca = (tipo = 'sorriso', y = 80) =>
  tipo === 'aberta'
    ? `<path d="M55 ${y}q5 7 10 0z" fill="#8a3a3a"/><path d="M56.500 ${y + 3}q3.500 2 7 0" fill="#ff8fa3"/>`
    : tipo === 'bravo'
      ? `<path d="M54 ${y + 2}q6 -5 12 0z" fill="#3b2420"/><path d="M55.500 ${y + 1}h9" stroke="#fff" stroke-width="1.400"/>`
      : `<path d="M55 ${y}q5 4.500 10 0" stroke="#8a3a3a" stroke-width="2.200" fill="none" stroke-linecap="round"/>`;
const cabeca = (pele = PELE) => `<ellipse cx="60" cy="62" rx="35" ry="32" fill="${pele}"/><ellipse cx="60" cy="88" rx="20" ry="4" fill="${PELE_SOMBRA}" opacity=".45"/>`;
const sombraChao = '<ellipse cx="60" cy="135" rx="30" ry="4" fill="#000" opacity=".18"/>';
// corpo: tronco, braços e pernas curtinhos
const corpo = ({ tronco, braco = tronco, perna, sapato, mao = PELE, maoDir = mao }) => `
  <path d="M42 96h36c3 0 5 2 5 5v18H37v-18c0-3 2-5 5-5z" fill="${tronco}"/>
  <path d="M38 99c-8 3-11 10-10 17 0 3 3 4 5 3l8-4z" fill="${braco}"/><circle cx="30" cy="117" r="5" fill="${mao}"/>
  <path d="M82 99c8 3 11 10 10 17 0 3-3 4-5 3l-8-4z" fill="${braco}"/><circle cx="90" cy="117" r="5" fill="${maoDir}"/>
  <rect x="44" y="117" width="13" height="14" rx="5" fill="${perna}"/><rect x="63" y="117" width="13" height="14" rx="5" fill="${perna}"/>
  <path d="M42 129h16v4c0 2-2 3-4 3h-9c-2 0-3-1-3-3z" fill="${sapato}"/><path d="M62 129h16v4c0 2-1 3-3 3h-9c-2 0-4-1-4-3z" fill="${sapato}"/>`;

const DESENHOS = {
  // Sofia: designer. Coque com lápis rosa, franja, óculos redondos, gola alta preta, fone rosa e uma mesa
  // digitalizadora na mão.
  sofia: () => `${sombraChao}
    ${corpo({ tronco: '#1b1d24', perna: '#2c3140', sapato: '#ff7ab8' })}
    <path d="M50 96h20v6H50z" fill="#121318"/>
    <path d="M38 101q22 14 44 0" stroke="#ff7ab8" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="33" y="96" width="9" height="13" rx="4.500" fill="#ff7ab8"/><rect x="78" y="96" width="9" height="13" rx="4.500" fill="#ff7ab8"/>
    <rect x="80" y="104" width="22" height="16" rx="3" fill="#2c3140" transform="rotate(-12 91 112)"/><rect x="83" y="107" width="16" height="10" rx="1.500" fill="#ff7ab8" transform="rotate(-12 91 112)"/>
    <g class="av-cabeca">
      <circle cx="60" cy="24" r="14" fill="#2b1c18"/>
      <path d="M44 15l34 18" stroke="#ff7ab8" stroke-width="3.500" stroke-linecap="round"/><path d="M78 33l4 2.500-5 .3z" fill="#ffe3c7"/>
      <path d="M24 66c-4-28 12-44 36-44s40 16 36 44c-2 14 1 22 3 28H21c2-6 5-14 3-28z" fill="#2b1c18"/>
      ${cabeca()}
      <path d="M26 58c1-20 15-31 34-31s33 11 34 31c-6-8-12-12-18-13-2 5-8 8-16 8-9 0-14-3-16-8-7 1-13 5-18 13z" fill="#2b1c18"/>
      ${olhos()}
      <g fill="none" stroke="#3a2a28" stroke-width="2"><circle cx="46" cy="66" r="11"/><circle cx="74" cy="66" r="11"/><path d="M57 65q3-2 6 0"/></g>
      ${bochechas(80)}${boca('sorriso', 82)}
    </g>`,

  // Wanda: tiara escarlate em pontas, cabelo ruivo comprido, roupa vermelha e magia rosa nas mãos.
  wanda: () => `${sombraChao}
    <path d="M24 70c-6-30 10-50 36-50s42 20 36 50c-1 22 4 34 8 44H16c4-10 9-22 8-44z" fill="#8c2a1d"/>
    ${corpo({ tronco: '#a3172a', perna: '#5e0f1b', sapato: '#5e0f1b' })}
    <path d="M52 96l8 16 8-16z" fill="#6f0f1d"/>
    <g class="av-magia"><circle cx="26" cy="114" r="10" fill="#ff4fa0" opacity=".35"/><circle cx="26" cy="114" r="6.500" fill="none" stroke="#ff7ac0" stroke-width="2"/><circle cx="26" cy="114" r="2.500" fill="#fff"/>
      <circle cx="94" cy="114" r="10" fill="#ff4fa0" opacity=".35"/><circle cx="94" cy="114" r="6.500" fill="none" stroke="#ff7ac0" stroke-width="2"/><circle cx="94" cy="114" r="2.500" fill="#fff"/></g>
    <g class="av-cabeca">
      ${cabeca()}
      <path d="M26 64c-2-22 12-38 34-38s36 16 34 38c-4-10-10-16-17-18-5 4-11 6-17 6s-12-2-17-6c-7 2-13 8-17 18z" fill="#8c2a1d"/>
      <path d="M24 58c4-17 13-27 22-31l14 15 14-15c9 4 18 14 22 31 2-24-12-42-36-46-24 4-38 22-36 46z" fill="#d42a46"/>
      <path d="M55 40l5-12 5 12-5 6z" fill="#ff6f86"/>
      ${olhos({ cor: '#2c3a2a', piscando: true })}${bochechas()}${boca('aberta', 80)}
    </g>`,

  // Peter: máscara vermelha com teia e olhos brancos grandes, traje vermelho e azul.
  peter: n => `${sombraChao}
    <defs><clipPath id="av-teia-${n}"><ellipse cx="60" cy="62" rx="35" ry="32"/></clipPath></defs>
    ${corpo({ tronco: '#d6202e', braco: '#d6202e', perna: '#1f4fb5', sapato: '#d6202e', mao: '#d6202e' })}
    <path d="M37 108h46v11H37z" fill="#1f4fb5"/>
    <path d="M60 100l-3 4-6-3 4 5-4 5 6-3 3 6 3-6 6 3-4-5 4-5-6 3z" fill="#16181d"/>
    <g class="av-cabeca">
      <ellipse cx="60" cy="62" rx="35" ry="32" fill="#e02a38"/>
      <g clip-path="url(#av-teia-${n})" fill="none" stroke="#8a121c" stroke-width="1.100">
        <path d="M60 28v68M24 62h72M33 36l54 52M87 36L33 88"/>
        <ellipse cx="60" cy="64" rx="10" ry="9"/><ellipse cx="60" cy="64" rx="21" ry="19"/><ellipse cx="60" cy="64" rx="32" ry="29"/>
      </g>
      <g class="av-olhos" fill="#fbfcff" stroke="#16181d" stroke-width="3" stroke-linejoin="round">
        <path d="M30 60c6-11 17-12 25-4 1 10-5 16-13 16-8 0-12-5-12-12z"/><path d="M90 60c-6-11-17-12-25-4-1 10 5 16 13 16 8 0 12-5 12-12z"/>
      </g>
    </g>`,

  // Tony: armadura vermelha e dourada, olhos de luz e o reator no peito.
  tony: () => `${sombraChao}
    ${corpo({ tronco: '#c21622', braco: '#e9b23a', perna: '#c21622', sapato: '#e9b23a', mao: '#c21622' })}
    <circle cx="60" cy="106" r="7" fill="#e9b23a"/><circle class="av-luz" cx="60" cy="106" r="4.800" fill="#bff6ff"/><circle cx="60" cy="106" r="2" fill="#fff"/>
    <g class="av-luz"><circle cx="90" cy="117" r="3" fill="#bff6ff"/></g>
    <g class="av-cabeca">
      <path d="M25 62c0-21 15-35 35-35s35 14 35 35v6c0 15-15 26-35 26S25 83 25 68z" fill="#c21622"/>
      <path d="M35 56c5-9 14-14 25-14s20 5 25 14l-3 22c-2 9-11 15-22 15s-20-6-22-15z" fill="#f2bc3c"/>
      <path d="M35 56l9 8h32l9-8" fill="none" stroke="#c48a1c" stroke-width="2"/>
      <g class="av-olhos av-luz" fill="#e6fdff"><path d="M40 66h15l-2 6H42z"/><path d="M80 66H65l2 6h11z"/></g>
      <path d="M51 84h18" stroke="#c48a1c" stroke-width="2.400" stroke-linecap="round"/>
      <path d="M40 76l6 12M80 76l-6 12" stroke="#c48a1c" stroke-width="1.600"/>
      <ellipse cx="45" cy="44" rx="7" ry="4" fill="#fff" opacity=".25"/>
    </g>`,

  // Stephen: cabelo escuro com têmporas grisalhas, cavanhaque, túnica azul, capa vermelha e um círculo de magia
  // laranja na mão.
  stephen: () => `${sombraChao}
    <path d="M30 98c-10 6-14 20-14 36h88c0-16-4-30-14-36z" fill="#b2202b"/>
    ${corpo({ tronco: '#27467a', braco: '#27467a', perna: '#1d3459', sapato: '#3a2a22' })}
    <path d="M58 98h4v21h-4z" fill="#d8a53a"/><circle cx="60" cy="102" r="3.500" fill="#d8a53a"/><circle cx="60" cy="102" r="1.500" fill="#2c8a5a"/>
    <path d="M36 96l-8-14 14 8zM84 96l8-14-14 8z" fill="#b2202b"/>
    <g class="av-magia"><circle cx="26" cy="112" r="12" fill="#ffb347" opacity=".25"/><circle cx="26" cy="112" r="10" fill="none" stroke="#ff9a2e" stroke-width="2"/><circle cx="26" cy="112" r="5.500" fill="none" stroke="#ffc46b" stroke-width="1.500"/><path d="M16 112h20M26 102v20M19 105l14 14M33 105l-14 14" stroke="#ffc46b" stroke-width="1"/></g>
    <g class="av-cabeca">
      ${cabeca('#f0c6a8')}
      <path d="M25 60c-2-22 13-36 35-36 21 0 36 13 34 36-4-9-10-15-16-17-10 6-26 6-36 0-7 3-13 9-17 17z" fill="#2a2220"/>
      <path d="M26 58c1-9 3-15 7-20l3 11c-4 2-7 5-10 9zM94 58c-1-9-3-15-7-20l-3 11c4 2 7 5 10 9z" fill="#d6dbe3"/>
      <path d="M38 57q8-4 14 0M68 57q6-4 14 0" stroke="#2a2220" stroke-width="2.800" fill="none" stroke-linecap="round"/>
      ${olhos({ cor: '#1f2a33' })}${bochechas(78)}
      <path d="M50 81c3-3 7-4 10-4s7 1 10 4c0 9-4 13-10 13s-10-4-10-13z" fill="#2a2220"/>
      <path d="M55 84q5 3 10 0" stroke="#f0c6a8" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>`,

  // Steve: capacete azul com uma estrela e as asinhas, uniforme azul com a faixa vermelha e branca, escudo redondo.
  steve: () => `${sombraChao}
    ${corpo({ tronco: '#2456b8', perna: '#2456b8', sapato: '#7a4a2a', mao: '#7a4a2a', maoDir: '#7a4a2a' })}
    <path d="M37 108h46v4H37z" fill="#f1f3f7"/><path d="M37 112h46v4H37z" fill="#c9202c"/>
    <path d="M60 99l2.200 4.600 5 .5-3.800 3.400 1.100 4.900L60 110l-4.500 2.400 1.100-4.900-3.800-3.400 5-.5z" fill="#f1f3f7"/>
    <g transform="translate(92 114)"><circle r="15" fill="#c9202c"/><circle r="11.500" fill="#f1f3f7"/><circle r="8" fill="#c9202c"/><circle r="5" fill="#2456b8"/>
      <path d="M0-4.500l1.300 2.800 3 .3-2.300 2 .7 3L0 2.200-2.700 3.600l.7-3-2.300-2 3-.3z" fill="#f1f3f7"/></g>
    <g class="av-cabeca">
      ${cabeca()}
      <path d="M24 64c-3-24 13-40 36-40s39 16 36 40c-1 6-3 8-5 9V58c-8-5-19-8-31-8s-23 3-31 8v15c-2-1-4-3-5-9z" fill="#2860c4"/>
      <path d="M60 32l3 6.500 7 .7-5.300 4.700 1.500 7-6.200-3.600-6.200 3.600 1.500-7-5.300-4.700 7-.7z" fill="#f1f3f7"/>
      <path d="M26 50c-7-2-10-7-10-12 6 1 11 4 13 7zM94 50c7-2 10-7 10-12-6 1-11 4-13 7z" fill="#f1f3f7"/>
      ${olhos({ cor: '#24324f', y: 68 })}${bochechas(80)}${boca('sorriso', 83)}
    </g>`,

  // Natasha: cabelo ruivo ondulado, traje preto com cinto e a ampulheta vermelha.
  natasha: () => `${sombraChao}
    <path d="M22 66c-6-28 10-44 38-44s44 16 38 44c0 14 4 22 6 30H16c2-8 6-16 6-30z" fill="#c2402a"/>
    ${corpo({ tronco: '#17191f', perna: '#17191f', sapato: '#2a2e38', mao: '#17191f', maoDir: '#17191f' })}
    <path d="M37 111h46v4H37z" fill="#3a3f4b"/><path d="M56 110h8l-4 3.500zM56 116h8l-4-3.500z" fill="#e0282b"/>
    <path d="M55 96l5 8 5-8" fill="none" stroke="#3a3f4b" stroke-width="1.600"/>
    <g class="av-cabeca">
      ${cabeca()}
      <path d="M25 62c0-22 14-36 35-36s35 14 35 36c-6-10-14-16-24-17-6 6-14 8-22 7-10 1-18 4-24 10z" fill="#c2402a"/>
      <path d="M25 60c-5 12-3 24 3 34 2-6 1-12 0-18zM95 60c5 12 3 24-3 34-2-6-1-12 0-18z" fill="#c2402a"/>
      ${olhos({ cor: '#24352b' })}${bochechas()}${boca('sorriso', 81)}
    </g>`,

  // Bruce: pele verde, cabelo escuro bagunçado, sobrancelhas bravas, braços fortes e bermuda roxa rasgada.
  bruce: () => `${sombraChao}
    <path d="M40 96h40c4 0 6 3 6 6v15H34v-15c0-3 2-6 6-6z" fill="#7cc04a"/>
    <path d="M36 98c-12 2-17 10-16 18 1 4 5 6 9 5l10-7z" fill="#7cc04a"/><circle cx="25" cy="116" r="8" fill="#6aac3c"/>
    <path d="M84 98c12 2 17 10 16 18-1 4-5 6-9 5l-10-7z" fill="#7cc04a"/><circle cx="95" cy="116" r="8" fill="#6aac3c"/>
    <path d="M38 113h44v13l-6-3-5 4-5-4-6 4-5-4-5 4-6-3z" fill="#6b3fa0"/>
    <rect x="44" y="124" width="13" height="8" rx="4" fill="#7cc04a"/><rect x="63" y="124" width="13" height="8" rx="4" fill="#7cc04a"/>
    <path d="M42 130h16v3c0 2-2 3-4 3h-9c-2 0-3-1-3-3zM62 130h16v3c0 2-1 3-3 3h-9c-2 0-4-1-4-3z" fill="#6aac3c"/>
    <g class="av-cabeca">
      ${cabeca('#86c552').replace(PELE_SOMBRA, '#5e9a35')}
      <path d="M24 60c-3-24 13-38 36-38 22 0 38 14 36 38-3-6-6-10-9-11l-3 7-6-10-5 8-7-9-6 8-6-8-5 9-5-7-4 6c-5 0-10 3-16 7z" fill="#2a2a22"/>
      <path d="M36 58l15 5M84 58l-15 5" stroke="#2a2a22" stroke-width="3.500" stroke-linecap="round"/>
      ${olhos({ cor: '#1a2410', y: 69 })}<ellipse cx="35" cy="80" rx="5.500" ry="3.200" fill="#5e9a35" opacity=".6"/><ellipse cx="85" cy="80" rx="5.500" ry="3.200" fill="#5e9a35" opacity=".6"/>
      ${boca('bravo', 82)}
    </g>`,

  padrao: () => `${sombraChao}
    ${corpo({ tronco: '#5a6b8c', perna: '#3a4458', sapato: '#2a3140' })}
    <g class="av-cabeca">${cabeca('#d9c3b0')}<path d="M26 58c0-20 14-32 34-32s34 12 34 32c-8-8-20-12-34-12s-26 4-34 12z" fill="#3b3f4a"/>${olhos()}${bochechas()}${boca()}</g>`,
};

export function avatar(tipo, rotulo = '') {
  serie += 1;
  const desenho = DESENHOS[tipo] || DESENHOS.padrao;
  return `<svg class="av" viewBox="0 0 120 140" role="img" aria-label="${rotulo}" focusable="false">${desenho(serie)}</svg>`;
}

export const temDesenho = tipo => Boolean(DESENHOS[tipo]);
