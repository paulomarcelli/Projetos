// Extrai as vagas de um e-mail de alerta de vagas do LinkedIn.
// Este é o mesmo código do nó "Extrair vagas" do fluxo 01 (o teste em testes/ usa este arquivo).
// Entrada: o texto puro (text) e/ou o HTML (html) do e-mail.
// Saída: [{ id, titulo, empresa, local, link, trecho }]

const RUIDO = [
  /^view job/i, /^ver vaga/i, /^ver emprego/i, /^apply/i, /^candidat/i, /^easy apply/i,
  /^promoted/i, /^promovid/i, /^actively recruiting/i, /^recrutando/i, /^contratando/i,
  /connections?$/i, /conex(ã|a)o(ões|oes)?$/i, /alumni/i, /ex-alunos/i,
  /^new$/i, /^novo$/i, /^nova$/i, /^-{3,}$/, /^_{3,}$/, /^=+$/, /^\s*$/,
  /^your job alert/i, /^seu alerta/i, /^see all jobs/i, /^ver todas/i, /^unsubscribe/i,
  /^cancelar inscri/i, /^this email was intended/i, /^este e-mail/i, /^linkedin$/i,
  /^\d+ (applicants|candidatos)/i, /^(reposted|publicada|anunciada|posted)/i,
];

const ehRuido = (linha) => RUIDO.some((r) => r.test(linha.trim())) || /https?:\/\//.test(linha);

const ENTIDADES = {
  middot: '·', bull: '•', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', atilde: 'ã', otilde: 'õ',
  acirc: 'â', ecirc: 'ê', ocirc: 'ô', agrave: 'à', ccedil: 'ç', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Atilde: 'Ã', Otilde: 'Õ',
  Acirc: 'Â', Ecirc: 'Ê', Ocirc: 'Ô', Agrave: 'À', Ccedil: 'Ç', Ntilde: 'Ñ',
};

function decodificar(s) {
  return s
    .replace(/&([a-zA-Z]+);/g, (m, nome) => ENTIDADES[nome] ?? m)
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

// HTML -> texto, deixando cada link numa linha própria ANTES do texto do link.
function htmlParaTexto(html) {
  return decodificar(
    html
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
      .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi, '\n$1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|td|li|h\d|table|a)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  );
}

const LINK_VAGA = /https?:\/\/[^\s"'<>]*linkedin\.com\/(?:comm\/)?jobs\/view\/(?:[^\s"'<>\/]*?-)?(\d{6,})[^\s"'<>]*/i;

function limparLinhas(texto) {
  return texto.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.length > 0);
}

// Separa "Empresa · Local" quando vem numa linha só.
function separarEmpresaLocal(empresa, local) {
  if (empresa && !local && /\s[·•|]\s/.test(empresa)) {
    const [e, ...resto] = empresa.split(/\s[·•|]\s/);
    return [e.trim(), resto.join(' · ').trim()];
  }
  return [empresa, local];
}

function extrairVagas({ text = '', html = '' }) {
  const vagas = new Map();

  // 1) Texto puro: título, empresa e local vêm ANTES da linha "Ver vaga: <link>".
  const linhasTexto = limparLinhas(text || '');
  linhasTexto.forEach((linha, i) => {
    const m = linha.match(LINK_VAGA);
    if (!m || vagas.has(m[1])) return;
    const antes = [];
    for (let j = i - 1; j >= 0 && antes.length < 3; j--) {
      const l = linhasTexto[j];
      if (LINK_VAGA.test(l)) break; // chegou na vaga anterior
      if (!ehRuido(l)) antes.unshift(l);
    }
    if (!antes.length) return;
    const [titulo, empresaBruta = '', localBruto = ''] = antes.length === 3 ? antes : [antes[0], antes[1], antes[2]];
    const [empresa, local] = separarEmpresaLocal(empresaBruta, localBruto);
    vagas.set(m[1], { titulo, empresa, local: local || '', trecho: antes.join(' | ') });
  });

  // 2) HTML (se o texto não trouxe nada): o texto da vaga vem DEPOIS do link.
  if (!vagas.size && html) {
    const linhas = limparLinhas(htmlParaTexto(html));
    linhas.forEach((linha, i) => {
      const m = linha.match(LINK_VAGA);
      if (!m || vagas.has(m[1])) return;
      const depois = [];
      for (let j = i + 1; j < linhas.length && depois.length < 3; j++) {
        const l = linhas[j];
        if (LINK_VAGA.test(l)) {
          const outro = l.match(LINK_VAGA);
          if (outro && outro[1] !== m[1]) break; // começou outra vaga
          continue; // o mesmo link repetido (imagem, botão)
        }
        if (!ehRuido(l)) depois.push(l);
      }
      if (!depois.length) return;
      const [titulo, empresaBruta = '', localBruto = ''] = depois;
      const [empresa, local] = separarEmpresaLocal(empresaBruta, localBruto);
      vagas.set(m[1], { titulo, empresa, local: local || '', trecho: depois.join(' | ') });
    });
  }

  return [...vagas.entries()].map(([id, v]) => ({
    id,
    titulo: v.titulo.slice(0, 200),
    empresa: v.empresa.slice(0, 200),
    local: v.local.slice(0, 200),
    link: `https://www.linkedin.com/jobs/view/${id}/`,
    trecho: v.trecho.slice(0, 500),
  }));
}

if (typeof module !== 'undefined') module.exports = { extrairVagas };
