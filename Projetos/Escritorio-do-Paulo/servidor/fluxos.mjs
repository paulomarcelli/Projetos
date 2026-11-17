// Fluxos prontos: planos de partida para os tipos de projeto mais comuns. Viram tarefas com dependências, do mesmo
// jeito que um plano escrito pela coordenadora (Sabrina).
export const FLUXOS = {
  interface: {
    nome: 'Interface nova',
    resumo: 'Sofia → Karol → Sabrina',
    plano: (projeto, pedido) => ({
      projeto,
      tarefas: [
        { chave: 'ds', agente: 'sofia', titulo: 'Design System no Figma', descricao: `Criar ou atualizar o Design System e os layouts no Figma para: ${pedido}\nDocumentar em docs/design-system.md do projeto.` },
        { chave: 'front', agente: 'karol', titulo: 'Arquitetura e interface', descricao: `Definir a estrutura do projeto e como rodar, e implementar seguindo o Design System da Sofia. Pedido: ${pedido}`, dependeDe: ['ds'] },
        { chave: 'qa', agente: 'sabrina', titulo: 'Testar e revisar', descricao: 'Testar no navegador com capturas, conferir contra o Design System e revisar a segurança.', dependeDe: ['front'], tipo: 'revisao' },
      ],
    }),
  },
  ia: {
    nome: 'Projeto de IA',
    resumo: 'Sofia → Karol (servidor, motor de IA e interface) → Sabrina',
    plano: (projeto, pedido) => ({
      projeto,
      tarefas: [
        { chave: 'ds', agente: 'sofia', titulo: 'Design System no Figma', descricao: `Criar ou atualizar o Design System e os layouts no Figma para: ${pedido}\nDocumentar em docs/design-system.md do projeto.` },
        { chave: 'dados', agente: 'karol', titulo: 'Arquitetura, servidor e dados', descricao: `Definir as partes (interface, servidor, dados, motor de IA) e os contratos, e implementar o servidor e a persistência, com testes. Pedido: ${pedido}` },
        { chave: 'motor', agente: 'karol', titulo: 'Motor de IA', descricao: 'Construir e avaliar o motor de IA (prompt, modelo, ferramentas), com casos de teste, custo e limitações.', dependeDe: ['dados'] },
        { chave: 'front', agente: 'karol', titulo: 'Implementar a interface', descricao: 'Implementar a interface seguindo o Design System e ligar ao servidor e ao motor de IA.', dependeDe: ['ds', 'motor'] },
        { chave: 'qa', agente: 'sabrina', titulo: 'Testar e revisar', descricao: 'Testar o fluxo inteiro, conferir a interface contra o Design System e revisar a segurança.', dependeDe: ['front'], tipo: 'revisao' },
      ],
    }),
  },
  pesquisa: {
    nome: 'Pesquisa',
    resumo: 'Sabrina',
    plano: (projeto, pedido) => ({
      projeto,
      tarefas: [{ chave: 'pesquisa', agente: 'sabrina', titulo: 'Pesquisar e recomendar', descricao: `Pesquisar com fontes, marcar o nível de certeza de cada achado e recomendar. Pergunta: ${pedido}` }],
    }),
  },
};

export const listaDeFluxos = () => Object.entries(FLUXOS).map(([id, f]) => ({ id, nome: f.nome, resumo: f.resumo }));
