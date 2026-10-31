/* =========================================================
   KFKA — Dados demonstrativos (fictícios) e "serviço" local
   Na etapa funcional, as funções de KFKA.api serão trocadas por
   chamadas fetch() para a API Node/Express + MySQL — as telas não
   precisam mudar, pois só conversam com KFKA.api.
   ========================================================= */
(function (K) {
  'use strict';
  const cores = ['#5FD4A8', '#74C0FC', '#FFC94A', '#F8B4C9', '#B9C8FF', '#9FE3D0', '#FFD8A8', '#C9E7F5'];
  const pick = (i) => cores[i % cores.length];

  const turmas = [
    { id: '6A', nome: '6º A', ano: '6º ano', turno: 'Manhã', sala: 'Sala 12' },
    { id: '6B', nome: '6º B', ano: '6º ano', turno: 'Tarde', sala: 'Sala 14' },
    { id: '7A', nome: '7º A', ano: '7º ano', turno: 'Manhã', sala: 'Sala 15' },
    { id: '7B', nome: '7º B', ano: '7º ano', turno: 'Tarde', sala: 'Sala 15' },
    { id: '8A', nome: '8º A', ano: '8º ano', turno: 'Manhã', sala: 'Sala 21' },
    { id: '9A', nome: '9º A', ano: '9º ano', turno: 'Manhã', sala: 'Sala 22' }
  ];
  const areas = [
    { id: 'LIN', nome: 'Linguagens', cor: '#E0186F' },
    { id: 'MAT', nome: 'Matemática', cor: '#2A5CFF' },
    { id: 'NAT', nome: 'Ciências da Natureza', cor: '#26593F' },
    { id: 'HUM', nome: 'Ciências Humanas', cor: '#8A5A12' }
  ];
  const disciplinas = [
    { id: 'POR', nome: 'Língua Portuguesa', area: 'LIN', ativa: true },
    { id: 'ING', nome: 'Inglês', area: 'LIN', ativa: true },
    { id: 'ART', nome: 'Arte', area: 'LIN', ativa: true },
    { id: 'EDF', nome: 'Educação Física', area: 'LIN', ativa: true },
    { id: 'MAT', nome: 'Matemática', area: 'MAT', ativa: true },
    { id: 'CIE', nome: 'Ciências', area: 'NAT', ativa: true },
    { id: 'HIS', nome: 'História', area: 'HUM', ativa: true },
    { id: 'GEO', nome: 'Geografia', area: 'HUM', ativa: true }
  ];
  const professores = [
    { id: 'p1', nome: 'Carlos Lima', email: 'carlos.lima@aurora.edu.br', tel: '(11) 97654-3210', disc: ['MAT', 'GEO'], ativo: true, cor: '#74C0FC' },
    { id: 'p2', nome: 'Renata Alves', email: 'renata.alves@aurora.edu.br', tel: '(11) 96543-2109', disc: ['POR'], ativo: true, cor: '#FFC94A' },
    { id: 'p3', nome: 'Jorge Mota', email: 'jorge.mota@aurora.edu.br', tel: '(11) 95432-1098', disc: ['CIE'], ativo: true, cor: '#5FD4A8' },
    { id: 'p4', nome: 'Paula Reis', email: 'paula.reis@aurora.edu.br', tel: '(11) 94321-0987', disc: ['HIS'], ativo: true, cor: '#F8B4C9' },
    { id: 'p5', nome: 'Tânia Melo', email: 'tania.melo@aurora.edu.br', tel: '(11) 93210-9876', disc: ['ING'], ativo: true, cor: '#B9C8FF' },
    { id: 'p6', nome: 'Bruno Farias', email: 'bruno.farias@aurora.edu.br', tel: '(11) 92109-8765', disc: ['EDF', 'ART'], ativo: true, cor: '#FFD8A8' },
    { id: 'p7', nome: 'Lígia Prado', email: 'ligia.prado@aurora.edu.br', tel: '(11) 91098-7654', disc: ['MAT'], ativo: false, cor: '#C9E7F5' }
  ];
  const responsaveis = [
    { id: 'r1', nome: 'Ana Souza', email: 'ana.souza@email.com', tel: '(11) 91234-5678', alunos: ['a1', 'a2'], parentesco: 'Mãe', consentimento: '02/02/2026', ativo: true },
    { id: 'r2', nome: 'Roberto Souza', email: 'roberto.souza@email.com', tel: '(11) 98877-6655', alunos: ['a1', 'a2'], parentesco: 'Pai', consentimento: '02/02/2026', ativo: true },
    { id: 'r3', nome: 'Marcos Nunes', email: 'marcos.nunes@email.com', tel: '(11) 97766-5544', alunos: ['a3'], parentesco: 'Pai', consentimento: '05/02/2026', ativo: true },
    { id: 'r4', nome: 'José Nunes', email: 'jose.nunes@email.com', tel: '(11) 96655-4433', alunos: ['a3'], parentesco: 'Avô', consentimento: '05/02/2026', ativo: true },
    { id: 'r5', nome: 'Diego Lima', email: 'diego.lima@email.com', tel: '(11) 95544-3322', alunos: ['a5'], parentesco: 'Pai', consentimento: '03/02/2026', ativo: true },
    { id: 'r6', nome: 'Clara Viana', email: 'clara.viana@email.com', tel: '(11) 94433-2211', alunos: ['a6'], parentesco: 'Mãe', consentimento: '—', ativo: true },
    { id: 'r7', nome: 'Renata Costa', email: 'renata.costa@email.com', tel: '(11) 93322-1100', alunos: ['a7'], parentesco: 'Mãe', consentimento: '04/02/2026', ativo: true }
  ];
  const nomes6A = ['Lucas Souza', 'Beatriz Nunes', 'Alice Lima', 'Bernardo Silva', 'Davi Viana', 'Gabriel Costa', 'Helena Lima', 'Maria Alves', 'Theo Rocha', 'Laura Oliveira', 'Pedro Henrique', 'Sofia Martins'];
  const alunos = nomes6A.map((nome, i) => ({ id: 'a' + (i === 0 ? 1 : i + 2), nome, ra: '2026-0' + (142 + i * 7), turma: '6A', nasc: `${String(3 + i).padStart(2, '0')}/0${(i % 9) + 1}/2014`, ativo: i !== 11, cor: pick(i) }));
  alunos.splice(1, 0, { id: 'a2', nome: 'Júlia Souza', ra: '2026-0187', turma: '8A', nasc: '19/05/2012', ativo: true, cor: '#F8B4C9' });
  alunos.push(
    { id: 'a20', nome: 'Rafael Lima', ra: '2025-0877', turma: '9A', nasc: '11/11/2011', ativo: true, cor: '#B9C8FF' },
    { id: 'a21', nome: 'Isabela Rocha', ra: '2026-0301', turma: '7A', nasc: '27/08/2013', ativo: true, cor: '#FFD8A8' },
    { id: 'a22', nome: 'Miguel Santos', ra: '2026-0310', turma: '6B', nasc: '14/02/2014', ativo: true, cor: '#9FE3D0' }
  );
  // Ajuste de vínculos das famílias com os ids gerados
  const byName = (n) => alunos.find((a) => a.nome === n).id;
  responsaveis.find((r) => r.id === 'r3').alunos = [byName('Beatriz Nunes')];
  responsaveis.find((r) => r.id === 'r4').alunos = [byName('Beatriz Nunes')];
  responsaveis.find((r) => r.id === 'r5').alunos = [byName('Alice Lima')];
  responsaveis.find((r) => r.id === 'r6').alunos = [byName('Davi Viana')];
  responsaveis.find((r) => r.id === 'r7').alunos = [byName('Gabriel Costa')];

  const vinculos = [
    ['6A', 'POR', 'p2'], ['6A', 'MAT', 'p1'], ['6A', 'CIE', 'p3'], ['6A', 'HIS', 'p4'], ['6A', 'GEO', 'p1'], ['6A', 'ING', 'p5'], ['6A', 'EDF', 'p6'], ['6A', 'ART', 'p6'],
    ['6B', 'MAT', 'p1'], ['6B', 'POR', 'p2'], ['7A', 'MAT', 'p1'], ['7A', 'CIE', 'p3'], ['7B', 'MAT', 'p7'],
    ['8A', 'POR', 'p2'], ['8A', 'MAT', 'p1'], ['8A', 'HIS', 'p4'], ['8A', 'CIE', 'p3'], ['8A', 'ING', 'p5'],
    ['9A', 'GEO', 'p1'], ['9A', 'HIS', 'p4']
  ].map(([turma, disc, prof]) => ({ turma, disc, prof }));

  const bimestres = [
    { n: 1, ini: '03/02/2026 08:00', fim: '30/04/2026 23:59', status: 'encerrado', rotulo: 'Encerrado' },
    { n: 2, ini: '04/05/2026 08:00', fim: '10/07/2026 23:59', status: 'encerrado', rotulo: 'Encerrado' },
    { n: 3, ini: '01/08/2026 08:00', fim: '30/09/2026 23:59', status: 'aberto', rotulo: 'Digitação aberta' },
    { n: 4, ini: '05/10/2026 08:00', fim: '11/12/2026 23:59', status: 'agendado', rotulo: 'Agendado' }
  ];
  // Tags = classificações pedagógicas do registro (não são diagnósticos)
  const tags = [
    { id: 't1', nome: 'Participação ativa', tom: '', tipo: 'Participação' },
    { id: 't2', nome: 'Evolução no bimestre', tom: 't-verde', tipo: 'Desempenho' },
    { id: 't3', nome: 'Leitura e interpretação', tom: 't-azul', tipo: 'Habilidade' },
    { id: 't4', nome: 'Autonomia nas atividades', tom: '', tipo: 'Participação' },
    { id: 't5', nome: 'Reforço em conteúdos', tom: 't-alerta', tipo: 'Atenção pedagógica' },
    { id: 't6', nome: 'Organização dos materiais', tom: 't-neutro', tipo: 'Hábito de estudo' },
    { id: 't7', nome: 'Trabalho em grupo', tom: 't-azul', tipo: 'Participação' },
    { id: 't8', nome: 'Faltas a acompanhar', tom: 't-alerta', tipo: 'Frequência' },
    { id: 't9', nome: 'Criatividade', tom: 't-verde', tipo: 'Habilidade' }
  ];

  const D = 'Demonstrou boa participação nas aulas, realizou as atividades propostas e apresentou evolução em relação ao bimestre anterior. Recomendamos manter a rotina de estudos em casa.';
  const descricoes = {
    MAT: 'Lucas demonstrou ótima participação nas aulas de frações e resolveu os desafios em grupo com autonomia. Na avaliação bimestral, apresentou evolução consistente em relação ao 2º bimestre, especialmente em problemas com números decimais. Recomendamos manter a rotina de revisão do caderno em casa.',
    POR: 'Lucas tem lido mais em casa e isso aparece nas produções de texto: frases mais completas e boa organização em parágrafos. Seguimos trabalhando a pontuação e a revisão do próprio texto.',
    CIE: 'Participou com curiosidade do projeto sobre o ciclo da água, registrando observações no caderno de campo. Ótima apresentação oral em grupo.',
    HIS: 'Compreende bem a linha do tempo dos conteúdos estudados. Pode aprofundar a leitura dos textos de apoio antes das aulas.',
    GEO: 'Fez um bom trabalho com mapas e escalas. Participou da maquete de relevo com dedicação.',
    ING: 'Apresenta boa compreensão oral e amplia o vocabulário a cada atividade. Precisa praticar a escrita de frases curtas.',
    EDF: 'Participa das atividades coletivas com respeito às regras e aos colegas.',
    ART: 'Mostrou criatividade na releitura de obras e no uso das cores.'
  };

  // ------- Relatórios (acompanhamentos) -------
  let seq = 100;
  const rel = [];
  const H = (quem, papel, quando, acao, de, para, coment) => ({ quem, papel, quando, acao, de, para, coment });
  const add = (o) => { const r = { id: 'rel-' + (++seq), ano: 2026, lido: false, comentarios: [], historico: [], observacao: null, ...o }; rel.push(r); return r; };
  const discProf = (turma, disc) => (vinculos.find((v) => v.turma === turma && v.disc === disc) || {}).prof;

  // Lucas (a1) — publicado em todos os bimestres anteriores; no 3º, alguns ainda em fluxo
  const lucas = alunos.find((a) => a.nome === 'Lucas Souza');
  const notas = { MAT: [7.5, 8.0, 8.5], POR: [7.0, 7.5, 8.0], CIE: [8.5, 8.5, 9.0], HIS: [7.0, 7.5, 7.5], GEO: [8.0, 8.0, 8.0], ING: [7.5, 8.0, null], EDF: [9.0, 9.5, 9.5], ART: [8.5, 9.0, 9.0] };
  Object.entries(notas).forEach(([disc, arr]) => {
    arr.forEach((m, i) => {
      const bim = i + 1;
      if (m == null) return;
      let status = 'publicado';
      if (bim === 3 && disc === 'MAT') status = 'revisao';
      if (bim === 3 && disc === 'GEO') status = 'enviado';
      const prof = discProf('6A', disc);
      const pn = professores.find((p) => p.id === prof).nome;
      const r = add({ aluno: lucas.id, turma: '6A', disc, prof, bim, media: m, status,
        desc: bim === 3 ? descricoes[disc] : D, tags: disc === 'MAT' ? ['t1', 't2', 't3'] : disc === 'POR' ? ['t3', 't2'] : disc === 'CIE' ? ['t4', 't7'] : ['t1'],
        lido: status === 'publicado' && !(bim === 3 && (disc === 'POR' || disc === 'CIE')) });
      r.historico.push(H(pn, 'Professor', `${bim === 3 ? '12/09' : bim === 2 ? '28/06' : '15/04'} 14:02`, 'Rascunho criado', null, 'rascunho'));
      if (status !== 'rascunho') r.historico.push(H(pn, 'Professor', `${bim === 3 ? '15/09' : bim === 2 ? '01/07' : '20/04'} 09:10`, 'Enviado para revisão', 'rascunho', 'enviado'));
      if (status === 'revisao' || status === 'publicado') r.historico.push(H('Marina Rocha', 'Coordenação', `${bim === 3 ? '15/09' : bim === 2 ? '03/07' : '22/04'} 10:30`, 'Revisão iniciada', 'enviado', 'revisao'));
      if (status === 'publicado') r.historico.push(H('Marina Rocha', 'Coordenação', `${bim === 3 ? '28/09' : bim === 2 ? '05/07' : '25/04'} 10:44`, 'Publicado para a família', 'revisao', 'publicado'));
    });
  });
  // Ajuste: MAT 3º bim de Lucas tem alteração de média pela coordenação
  const lucasMat = rel.find((r) => r.aluno === lucas.id && r.disc === 'MAT' && r.bim === 3);
  lucasMat.historico.push(H('Marina Rocha', 'Coordenação', '15/09 10:41', 'Média alterada', '8,0', '8,5'));
  // Retorno da família (RF12): observação registrada no relatório publicado do 2º bimestre
  const lucasMat2 = rel.find((r) => r.aluno === lucas.id && r.disc === 'MAT' && r.bim === 2);
  lucasMat2.observacao = { texto: 'Obrigada pelo retorno! Vamos revisar o caderno de frações em casa toda quarta-feira.', quem: 'Ana Souza', papel: 'Responsável', quando: '27/09 19:40' };
  lucasMat2.historico.push(H('Ana Souza', 'Responsável', '27/09 19:38', 'Ciência registrada', null, null), H('Ana Souza', 'Responsável', '27/09 19:40', 'Observação enviada', null, null));

  // Júlia (a2) — 8º A: publicados no 1º e 2º; nenhum publicado no 3º (estado vazio para a família)
  const julia = alunos.find((a) => a.id === 'a2');
  [['POR', [8.0, 8.5]], ['MAT', [6.5, 7.0]], ['HIS', [9.0, 8.5]], ['CIE', [7.5, 8.0]]].forEach(([disc, arr]) => arr.forEach((m, i) => {
    const prof = discProf('8A', disc); const pn = professores.find((p) => p.id === prof).nome;
    const r = add({ aluno: julia.id, turma: '8A', disc, prof, bim: i + 1, media: m, status: 'publicado', desc: D, tags: disc === 'HIS' ? ['t9', 't1'] : ['t1'], lido: true });
    r.historico.push(H(pn, 'Professor', '20/04 09:10', 'Enviado para revisão', 'rascunho', 'enviado'), H('Marina Rocha', 'Coordenação', '25/04 10:44', 'Publicado para a família', 'revisao', 'publicado'));
  }));
  add({ aluno: julia.id, turma: '8A', disc: 'HIS', prof: 'p4', bim: 3, media: 8.0, status: 'devolvido', desc: 'Júlia participou do seminário sobre a Revolução Industrial.', tags: ['t1'],
    historico: [H('Paula Reis', 'Professor', '22/09 17:00', 'Enviado para revisão', 'rascunho', 'enviado'), H('Marina Rocha', 'Coordenação', '27/09 17:10', 'Devolvido para ajustes', 'revisao', 'devolvido', 'Detalhe as habilidades observadas no seminário e sugira uma leitura complementar.')],
    comentarios: [{ quem: 'Marina Rocha', papel: 'Coordenação', quando: '27/09 17:10', texto: 'Detalhe as habilidades observadas no seminário e sugira uma leitura complementar.' }] });

  // Turma 6º A · Matemática · 3º bimestre (Prof. Carlos) — estados variados
  const plan6A = { 'Beatriz Nunes': ['enviado', 7.5, ['t3']], 'Alice Lima': ['publicado', 9.0, ['t1', 't9']], 'Bernardo Silva': [null], 'Davi Viana': ['rascunho', 6.5, ['t5']], 'Gabriel Costa': ['devolvido', 7.0, ['t6']], 'Helena Lima': ['enviado', 8.0, ['t4', 't2']], 'Maria Alves': [null], 'Theo Rocha': ['revisao', 7.0, ['t7']], 'Laura Oliveira': ['publicado', 8.5, ['t1']], 'Pedro Henrique': ['enviado', 6.0, ['t5', 't8']], 'Sofia Martins': ['cancelado', null, []] };
  Object.entries(plan6A).forEach(([nome, [status, media, tg]]) => {
    if (!status) return;
    const a = alunos.find((x) => x.nome === nome);
    const r = add({ aluno: a.id, turma: '6A', disc: 'MAT', prof: 'p1', bim: 3, media, status, tags: tg,
      desc: status === 'rascunho' ? `${nome.trim().split(/\s+/)[0]} tem se esforçado nas atividades de frações, mas ainda confunde numerador e denominador em problemas…` : `${nome.trim().split(/\s+/)[0]} ${D.charAt(0).toLowerCase() + D.slice(1)}` });
    r.historico.push(H('Carlos Lima', 'Professor', '10/09 16:20', 'Rascunho criado', null, 'rascunho'));
    if (['enviado', 'revisao', 'publicado', 'devolvido'].includes(status)) r.historico.push(H('Carlos Lima', 'Professor', '15/09 09:12', 'Enviado para revisão', 'rascunho', 'enviado'));
    if (['revisao', 'publicado', 'devolvido'].includes(status)) r.historico.push(H('Marina Rocha', 'Coordenação', '16/09 11:00', 'Revisão iniciada', 'enviado', 'revisao'));
    if (status === 'publicado') r.historico.push(H('Marina Rocha', 'Coordenação', '20/09 10:05', 'Publicado para a família', 'revisao', 'publicado'));
    if (status === 'devolvido') { const c = 'Detalhe quais conteúdos de frações o aluno já domina e sugira uma atividade para casa.'; r.historico.push(H('Marina Rocha', 'Coordenação', '27/09 14:20', 'Devolvido para ajustes', 'revisao', 'devolvido', c)); r.comentarios.push({ quem: 'Marina Rocha', papel: 'Coordenação', quando: '27/09 14:20', texto: c }); }
    if (status === 'cancelado') r.historico.push(H('Marina Rocha', 'Coordenação', '18/09 09:00', 'Registro cancelado', 'rascunho', 'cancelado', 'Aluna transferida em 16/09; registro não será publicado.'));
  });
  // Outros registros aguardando revisão (outras turmas/professores)
  [['Isabela Rocha', '7A', 'CIE', 'p3', 'enviado', 8.0], ['Rafael Lima', '9A', 'GEO', 'p1', 'revisao', 7.5], ['Miguel Santos', '6B', 'POR', 'p2', 'enviado', 7.0], ['Beatriz Nunes', '6A', 'POR', 'p2', 'revisao', 7.5]].forEach(([nome, turma, disc, prof, status, media]) => {
    const a = alunos.find((x) => x.nome === nome); const pn = professores.find((p) => p.id === prof).nome;
    const r = add({ aluno: a.id, turma, disc, prof, bim: 3, media, status, tags: ['t1'], desc: `${nome.trim().split(/\s+/)[0]} ${D.charAt(0).toLowerCase() + D.slice(1)}` });
    r.historico.push(H(pn, 'Professor', '24/09 08:40', 'Enviado para revisão', 'rascunho', 'enviado'));
    if (status === 'revisao') r.historico.push(H('Marina Rocha', 'Coordenação', '25/09 09:15', 'Revisão iniciada', 'enviado', 'revisao'));
  });

  const auditoria = [
    ['28/09 10:44', 'Marina Rocha', 'Publicou relatório', 'Lucas Souza · Ciências · 6º A', 'Em revisão', 'Publicado'],
    ['27/09 19:40', 'Ana Souza', 'Enviou observação', 'Lucas Souza · Matemática · 2º bimestre', '—', 'Observação registrada'],
    ['28/09 10:41', 'Marina Rocha', 'Alterou média', 'Lucas Souza · Matemática · 6º A', '8,0', '8,5'],
    ['27/09 17:10', 'Marina Rocha', 'Devolveu para ajustes', 'Júlia Souza · História · 8º A', 'Em revisão', 'Devolvido'],
    ['27/09 15:02', 'Marina Rocha', 'Criou tag', 'Tag “Autonomia nas atividades”', '—', 'Ativa'],
    ['27/09 14:20', 'Marina Rocha', 'Devolveu para ajustes', 'Gabriel Costa · Matemática · 6º A', 'Em revisão', 'Devolvido'],
    ['26/09 18:22', 'Marina Rocha', 'Alterou período', '3º bimestre · encerramento', '25/09 23:59', '30/09 23:59'],
    ['26/09 11:05', 'Marina Rocha', 'Inativou aluno', 'Sofia Martins · 6º A', 'Ativo', 'Inativo'],
    ['25/09 09:15', 'Marina Rocha', 'Iniciou revisão', 'Rafael Lima · Geografia · 9º A', 'Enviado', 'Em revisão'],
    ['24/09 08:40', 'Jorge Mota', 'Enviou para revisão', 'Isabela Rocha · Ciências · 7º A', 'Rascunho', 'Enviado'],
    ['22/09 10:00', 'Marina Rocha', 'Vinculou professor', '7º B · Matemática → Lígia Prado', '—', 'Vinculado'],
    ['20/09 10:05', 'Marina Rocha', 'Publicou relatório', 'Alice Lima · Matemática · 6º A', 'Em revisão', 'Publicado']
  ].map(([quando, quem, acao, registro, de, para]) => ({ quando, quem, acao, registro, de, para }));

  const notificacoes = {
    admin: [['review', 'ico-warn', '5 registros enviados para revisão', '6º A · Matemática · Prof. Carlos Lima', 'há 12 min', '#/admin/revisao'], ['clock', 'ico-bad', '3º bimestre encerra em 2 dias', '28 registros ainda pendentes', 'hoje, 08:00', '#/admin/periodos'], ['message', 'ico-teal', 'Nova observação de responsável', 'Ana Souza · Lucas Souza · 6º A', 'ontem, 19:40', '#/admin/revisao/rel-102']],
    professor: [['undo', 'ico-bad', 'Registro devolvido para ajustes', 'Gabriel Costa · 6º A · Matemática', 'há 3 h', null], ['message', 'ico-teal', 'Ana Souza enviou uma observação', 'Lucas Souza · Matemática · 2º bimestre', 'ontem', '#/professor/registros/rel-102'], ['clock', 'ico-warn', 'Digitação encerra em 2 dias', '3º bimestre · 30/09 às 23:59', 'hoje', null]],
    familia: [['file', 'ico-ok', 'Novo relatório publicado', 'Lucas · Ciências · 3º bimestre', 'hoje, 10:44', null], ['message', 'ico-teal', 'A escola respondeu sua observação', 'Prof. Carlos Lima · Matemática', 'ontem', null]]
  };

  /* ---------- Pior caso realista (skill break-ui) ----------
     Só para teste de design: abra index.html?dados=pior. Nunca aparece no uso normal.
     Valores plausíveis (nomes longos reais, e-mail sem espaços, nome de 2 letras,
     acentos empilhados, textos longos) — nada de "aaaaaaa". */
  const PIOR = /[?&]dados=pior\b/.test(location.search);
  const escola = { nome: PIOR ? 'Escola Municipal de Ensino Fundamental Professora Aurora Wiśniewska' : 'Escola Municipal Aurora', ano: 2026 };
  if (PIOR) {
    const novos = { a1: 'Aleksandra Wiśniewska-Kowalczyk', a3: 'Jo', a4: 'Christopher Alexander Montgomery III', a5: 'Đặng Thị Ngọc Hân', a6: 'María José de la Cruz y Fernández', a7: '  Sam   Lee ' };
    alunos.forEach((a) => { if (novos[a.id]) a.nome = novos[a.id]; });
    Object.assign(responsaveis[0], { nome: 'Ana Beatriz Wiśniewska-Kowalczyk de Souza', email: 'ana.beatriz.wisniewska-kowalczyk@northwind-industries-holdings.example.com' });
    Object.assign(responsaveis[2], { nome: 'J', email: 'a@b.co' });
    tags[0].nome = 'Participação ativa nas atividades em grupo e individuais';
    rel.filter((r) => r.aluno === 'a1').slice(0, 3).forEach((r) => { r.desc = (r.desc + ' ').repeat(6).trim(); });
  }

  K.data = { escola, turmas, areas, disciplinas, professores, responsaveis, alunos, vinculos, bimestres, tags, relatorios: rel, auditoria, notificacoes,
    sessao: { admin: { nome: 'Marina Rocha', cargo: 'Coordenação pedagógica', email: 'marina.rocha@aurora.edu.br', cor: '#FFC94A' }, professor: { id: 'p1' }, familia: { id: 'r1' } } };

  /* ---------- "API" local (troque por fetch na etapa funcional) ---------- */
  const A = {
    aluno: (id) => alunos.find((a) => a.id === id),
    turma: (id) => turmas.find((t) => t.id === id),
    disc: (id) => disciplinas.find((d) => d.id === id),
    prof: (id) => professores.find((p) => p.id === id),
    resp: (id) => responsaveis.find((r) => r.id === id),
    rel: (id) => rel.find((r) => r.id === id),
    area: (id) => areas.find((a) => a.id === id),
    alunosDaTurma: (t) => alunos.filter((a) => a.turma === t),
    respDoAluno: (aid) => responsaveis.filter((r) => r.alunos.includes(aid)),
    profDe: (turma, disc) => A.prof((vinculos.find((v) => v.turma === turma && v.disc === disc) || {}).prof),
    vinculosDoProf: (pid) => vinculos.filter((v) => v.prof === pid),
    relsFiltrados: (f = {}) => rel.filter((r) => Object.entries(f).every(([k, v]) => v == null || v === '' || (Array.isArray(v) ? v.includes(r[k]) : String(r[k]) === String(v)))),
    // Regra de visibilidade da família: apenas alunos vinculados e somente PUBLICADOS
    relsDaFamilia: (respId, alunoId) => { const r = A.resp(respId); if (!r || !r.alunos.includes(alunoId)) return []; return rel.filter((x) => x.aluno === alunoId && x.status === 'publicado'); },
    registro: (aluno, disc, bim) => rel.find((r) => r.aluno === aluno && r.disc === disc && r.bim === Number(bim) && r.status !== 'cancelado'),
    mudarStatus: (id, para, quem, papel, coment) => {
      const r = A.rel(id); const de = r.status; r.status = para;
      const acoes = { enviado: 'Enviado para revisão', revisao: 'Revisão iniciada', publicado: 'Publicado para a família', devolvido: 'Devolvido para ajustes', rascunho: 'Rascunho salvo', cancelado: 'Registro cancelado' };
      r.historico.push(H(quem, papel, 'agora', acoes[para] || 'Atualizado', de, para, coment));
      if (coment) r.comentarios.push({ quem, papel, quando: 'agora', texto: coment });
      auditoria.unshift({ quando: 'agora', quem, acao: acoes[para], registro: `${A.aluno(r.aluno).nome} · ${A.disc(r.disc).nome} · ${A.turma(r.turma).nome}`, de: K.STATUS[de].label, para: K.STATUS[para].label });
      return r;
    },
    salvarRegistro: (dados) => {
      const { id, ...rest } = dados;            // id indefinido não pode sobrescrever o gerado
      let r = id ? A.rel(id) : null;
      if (!r) { r = add({ ...rest, historico: [H('Carlos Lima', 'Professor', 'agora', 'Rascunho criado', null, 'rascunho')] }); }
      else Object.assign(r, rest);
      return r;
    }
  };
  K.api = A;
})(window.KFKA);
