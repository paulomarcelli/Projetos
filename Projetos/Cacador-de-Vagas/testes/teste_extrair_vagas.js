// Teste do leitor de e-mails de alerta. Rode com: node testes/teste_extrair_vagas.js
// Os e-mails abaixo são exemplos inventados no formato dos alertas do LinkedIn (não são vagas reais).
const assert = require('node:assert/strict');
const { extrairVagas } = require('../n8n/codigo/extrair_vagas.js');

const textoPt = `Seu alerta de vagas para desenvolvedor python em São Paulo
Novas vagas correspondem às suas preferências.

Estagiário de Dados
Empresa Exemplo A
São Paulo, SP (Híbrido)
Recrutando ativamente
Ver vaga: https://www.linkedin.com/comm/jobs/view/4011111111/?trackingId=abc%3D&refId=x

---------------------------------------------------------

Desenvolvedor Python Júnior
Empresa Exemplo B · Brasil (Remoto)
Ver vaga: https://www.linkedin.com/comm/jobs/view/4022222222/?trackingId=def

---------------------------------------------------------
Ver todas as vagas: https://www.linkedin.com/comm/jobs/search?keywords=python
`;

const textoEn = `Your job alert for machine learning
New jobs match your preferences.

Junior Machine Learning Engineer
Example Corp C
São Paulo, São Paulo, Brazil (On-site)
1 connection
View job: https://www.linkedin.com/comm/jobs/view/4033333333

Unsubscribe: https://www.linkedin.com/comm/psettings/email-unsubscribe?x=1
`;

const html = `<html><body><table>
<tr><td><a href="https://www.linkedin.com/comm/jobs/view/4044444444/?trk=a"><img src="logo.png"></a></td>
<td><a href="https://www.linkedin.com/comm/jobs/view/4044444444/?trk=b">Analista de Dados J&uacute;nior &amp; BI</a>
<p>Empresa Exemplo D &middot; Campinas, SP</p><p>Promovida</p></td></tr>
<tr><td><a href="https://www.linkedin.com/comm/jobs/view/4055555555/?trk=c">Estágio em Inteligência Artificial</a>
<br>Empresa Exemplo E<br>São Paulo, SP (Remoto)</td></tr>
</table><a href="https://www.linkedin.com/comm/jobs/search">Ver todas as vagas</a></body></html>`;

// Texto em português
let v = extrairVagas({ text: textoPt });
assert.equal(v.length, 2);
assert.deepEqual(
  v.map((x) => [x.id, x.titulo, x.empresa, x.local]),
  [
    ['4011111111', 'Estagiário de Dados', 'Empresa Exemplo A', 'São Paulo, SP (Híbrido)'],
    ['4022222222', 'Desenvolvedor Python Júnior', 'Empresa Exemplo B', 'Brasil (Remoto)'],
  ]
);
assert.equal(v[0].link, 'https://www.linkedin.com/jobs/view/4011111111/');

// Texto em inglês, com ruído ("1 connection") e link de descadastro
v = extrairVagas({ text: textoEn });
assert.equal(v.length, 1);
assert.equal(v[0].titulo, 'Junior Machine Learning Engineer');
assert.equal(v[0].empresa, 'Example Corp C');

// Só HTML (link da imagem e do título repetidos, entidades HTML)
v = extrairVagas({ text: '', html });
assert.equal(v.length, 2);
assert.equal(v[0].id, '4044444444');
assert.equal(v[0].empresa, 'Empresa Exemplo D');
assert.equal(v[0].local, 'Campinas, SP');
assert.equal(v[1].titulo, 'Estágio em Inteligência Artificial');
assert.equal(v[1].local, 'São Paulo, SP (Remoto)');

// E-mail que não é de vaga
assert.equal(extrairVagas({ text: 'Oi, tudo bem?' }).length, 0);

console.log('ok: 4 cenários do leitor de alertas passaram');
