// Ícones e rótulos dos estados. O estado nunca é dito só pela cor: sempre vem ícone e rótulo.

// 16 px, traço de 1,6.
const icone = d => `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.600" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;

export const ICONES = {
  disponivel: icone('<circle cx="8" cy="8" r="5.500"/>'),
  trabalhando: icone('<path d="M2.500 4.500h11M2.500 8h7M2.500 11.500h9"/>'),
  pensando: icone('<circle cx="3.500" cy="8" r=".8" fill="currentColor"/><circle cx="8" cy="8" r=".8" fill="currentColor"/><circle cx="12.500" cy="8" r=".8" fill="currentColor"/>'),
  pesquisando: icone('<circle cx="7" cy="7" r="4.300"/><path d="M10.300 10.300l3.200 3.200"/>'),
  aguardando: icone('<path d="M4 2.500h8M4 13.500h8M4.500 2.500c0 3 3.500 3.500 3.500 5.500s-3.500 2.500-3.500 5.500M11.500 2.500c0 3-3.500 3.500-3.500 5.500s3.500 2.500 3.500 5.500"/>'),
  revisao: icone('<path d="M2.500 4l1.300 1.300L6 3M2.500 8.300l1.300 1.300L6 7.300M2.500 12.600l1.300 1.300L6 11.600M8.500 4.200h5M8.500 8.500h5M8.500 12.800h5"/>'),
  concluido: icone('<circle cx="8" cy="8" r="5.800"/><path d="M5.300 8.200l1.900 1.900 3.600-4"/>'),
  erro: icone('<path d="M8 2.300l6.200 10.900H1.800z"/><path d="M8 6.500v3"/><circle cx="8" cy="11.300" r=".5" fill="currentColor"/>'),
  seta: icone('<path d="M3 8h9.500M9 4.500L12.500 8 9 11.500"/>'),
  fechar: icone('<path d="M3.500 3.500l9 9M12.500 3.500l-9 9"/>'),
  mais: icone('<path d="M8 3v10M3 8h10"/>'),
};

export const ROTULOS = {
  disponivel: 'Disponível', trabalhando: 'Trabalhando', pensando: 'Pensando', pesquisando: 'Pesquisando',
  aguardando: 'Aguardando', revisao: 'Em revisão', concluido: 'Concluído', erro: 'Com erro',
};

export const ESTADOS_ATIVOS = ['trabalhando', 'pensando', 'pesquisando', 'revisao'];
