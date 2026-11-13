// Os quatro destaques do túnel: cada um vira a abertura de um case.
const pages = 'https://paulomarcelli.github.io/Projetos/Projetos'
const codigo = 'https://github.com/paulomarcelli/Projetos/tree/main/Projetos'

export const casos = [
  { cliente: 'F.R.E.Y.A.', ano: 2026, disciplina: 'Inteligência artificial', cidade: 'projeto pessoal',
    resumo: 'Análise prospectiva do Universo Marvel com RAG híbrido e GraphRAG. Cada frase diz de onde veio.',
    foto: 'trabalhos/destaque-freya.webp', link: `${codigo}/FREYA`, acao: 'Ver o código' },
  { cliente: 'Iris', ano: 2026, disciplina: 'IA em desenvolvimento', cidade: 'Relações Internacionais',
    resumo: 'Entenda o presente, explore os futuros: cenários como hipóteses, com a fonte de cada afirmação.',
    foto: 'trabalhos/destaque-iris.webp', link: `${pages}/Iris/`, acao: 'Abrir a prévia' },
  { cliente: 'LUNA MIND', ano: 2026, disciplina: 'Assistente de IA', cidade: 'publicada',
    resumo: 'Apoio emocional por texto e voz, com uma camada de segurança que não depende da IA.',
    foto: 'trabalhos/destaque-luna.webp', link: `${pages}/Luna/`, acao: 'Abrir a Luna' },
  { cliente: 'KFKA', ano: 2026, disciplina: 'Projeto Interdisciplinar', cidade: 'FECAP',
    resumo: 'A escola e a família acompanhando o aluno juntas: o professor registra, a família acompanha.',
    foto: 'trabalhos/destaque-kfka.webp', link: `${pages}/KFKA/`, acao: 'Abrir o protótipo' },
]

// textos fixos do site
export const textos = {
  frase: ['Sites e inteligência artificial', 'que mostram de onde vem cada resposta.'],
  role: 'Role para entrar',
  local: 'São Paulo · 11 projetos em 2026',
  fim: 'Quatro de 11.',
  total: 11,
}
