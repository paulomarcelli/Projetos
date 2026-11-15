// Fluxos prontos: planos de partida para os tipos de projeto mais comuns. Viram tarefas com dependências, do mesmo
// jeito que um plano escrito pelo Steve.
export const FLUXOS = {
  interface: {
    nome: 'Interface nova',
    resumo: 'Sofia → Tony → Peter → Natasha',
    plano: (projeto, pedido) => ({
      projeto,
      tarefas: [
        { chave: 'ds', agente: 'sofia', titulo: 'Design System no Figma', descricao: `Criar ou atualizar o Design System e os layouts no Figma para: ${pedido}\nDocumentar em docs/design-system.md do projeto.` },
        { chave: 'arq', agente: 'tony', titulo: 'Arquitetura da interface', descricao: `Definir a estrutura do projeto, as tecnologias e como rodar, a partir do Design System. Pedido: ${pedido}`, dependeDe: ['ds'] },
        { chave: 'front', agente: 'peter', titulo: 'Implementar a interface', descricao: `Implementar seguindo o Design System da Sofia e a arquitetura do Tony. Pedido: ${pedido}`, dependeDe: ['ds', 'arq'] },
        { chave: 'qa', agente: 'natasha', titulo: 'Testar e revisar', descricao: 'Testar no navegador com capturas, conferir contra o Design System e revisar a segurança.', dependeDe: ['front'], tipo: 'revisao' },
      ],
    }),
  },
  ia: {
    nome: 'Projeto de IA',
    resumo: 'Sofia e Tony → Bruce → Wanda → Peter → Natasha',
    plano: (projeto, pedido) => ({
      projeto,
      tarefas: [
        { chave: 'ds', agente: 'sofia', titulo: 'Design System no Figma', descricao: `Criar ou atualizar o Design System e os layouts no Figma para: ${pedido}\nDocumentar em docs/design-system.md do projeto.` },
        { chave: 'arq', agente: 'tony', titulo: 'Arquitetura do projeto', descricao: `Definir as partes (interface, servidor, dados, motor de IA), os contratos e como rodar. Pedido: ${pedido}`, dependeDe: ['ds'] },
        { chave: 'dados', agente: 'bruce', titulo: 'Servidor e dados', descricao: 'Implementar o servidor, as rotas e a persistência definidos na arquitetura, com testes.', dependeDe: ['arq'] },
        { chave: 'motor', agente: 'wanda', titulo: 'Motor de IA', descricao: 'Construir e avaliar o motor de IA (prompt, modelo, ferramentas), com casos de teste, custo e limitações.', dependeDe: ['arq', 'dados'] },
        { chave: 'front', agente: 'peter', titulo: 'Implementar a interface', descricao: 'Implementar a interface seguindo o Design System e ligar ao servidor e ao motor de IA.', dependeDe: ['ds', 'arq', 'motor'] },
        { chave: 'qa', agente: 'natasha', titulo: 'Testar e revisar', descricao: 'Testar o fluxo inteiro, conferir a interface contra o Design System e revisar a segurança.', dependeDe: ['front'], tipo: 'revisao' },
      ],
    }),
  },
  pesquisa: {
    nome: 'Pesquisa',
    resumo: 'Stephen',
    plano: (projeto, pedido) => ({
      projeto,
      tarefas: [{ chave: 'pesquisa', agente: 'stephen', titulo: 'Pesquisar e recomendar', descricao: `Pesquisar com fontes, marcar o nível de certeza de cada achado e recomendar. Pergunta: ${pedido}` }],
    }),
  },
};

export const listaDeFluxos = () => Object.entries(FLUXOS).map(([id, f]) => ({ id, nome: f.nome, resumo: f.resumo }));
