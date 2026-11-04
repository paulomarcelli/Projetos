// O índice: quando, projeto, tipo, onde está, filtro, foto e link.
const pages = 'https://paulomarcelli.github.io/Projetos'
const codigo = 'https://github.com/paulomarcelli/Projetos/tree/main/Projetos'

export const filtros = [
  { id: 'todos', nome: 'Todos' },
  { id: 'ia', nome: 'IA' },
  { id: 'sites', nome: 'Sites' },
  { id: 'jogos', nome: 'Jogos' },
  { id: 'faculdade', nome: 'Faculdade' },
]

export const projetos = [
  ['nov. 2026', 'F.R.E.Y.A.', 'Inteligência artificial', 'Código no GitHub', 'ia', 'freya', `${codigo}/FREYA`],
  ['nov. 2026', 'Iris', 'IA em desenvolvimento', 'Prévia publicada', 'ia', 'iris', `${pages}/Projetos/Iris/`],
  ['out. 2026', 'KFKA', 'Projeto Interdisciplinar', 'Protótipo publicado', 'faculdade', 'kfka', `${pages}/Projetos/KFKA/`],
  ['out. 2026', 'Landing page 3D', 'Landing page animada', 'Publicada', 'sites', 'samsung', `${pages}/Projetos/Karol-x-Samsung/`],
  ['out. 2026', 'Landing page Gestalt', 'Design · FECAP', 'Publicada', 'faculdade', 'gestalt', `${pages}/Projetos/Landing-Page-Karol-Sevilla/`],
  ['out. 2026', 'Geometry Heroes', 'Jogo · POO · FECAP', 'Publicado', 'jogos', 'geometry', `${pages}/Projetos/Geometry-Heroes/`],
  ['ago. 2026', 'LUNA MIND', 'Assistente de IA', 'Publicada', 'ia', 'luna', `${pages}/Projetos/Luna/`],
  ['ago. 2026', 'Fã-site', 'Site', 'Publicado', 'sites', 'fasite', `${pages}/`],
  ['ago. 2026', 'Site de clipe I', 'Site', 'Publicado', 'sites', 'clipe1', `${pages}/Projetos/Cenicienta/`],
  ['ago. 2026', 'Site de clipe II', 'Site', 'Publicado', 'sites', 'clipe2', `${pages}/Projetos/Una-Noche-Mas/`],
  ['ago. 2026', 'Joken-Po', 'Jogo em Python', 'Código no GitHub', 'jogos', 'joken', `${codigo}/Joken-Po-Python`],
].map(([ano, cliente, disciplina, cidade, filtro, foto, link]) => ({ ano, cliente, disciplina, cidade, filtro, foto: `trabalhos/i-${foto}.webp`, link }))
