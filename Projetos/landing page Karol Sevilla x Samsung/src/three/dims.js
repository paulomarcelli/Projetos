// Medidas do Galaxy S26 Ultra (mm), públicas: 163,6 × 78,1 × 7,9 mm, tela de 6,9″ (1440 × 3120).
// Sem three: a tela de carga (pequena) também usa estes números para desenhar a planta.
// Eixos do modelo: x para a direita, z para baixo do aparelho (o topo fica em z negativo), y para fora da tela.
export const PHONE = { w: 78.1, l: 163.6, t: 7.9, r: 11 };
export const SCREEN = { w: 73.4, l: 158.9, r: 8.6 };
export const TOP = PHONE.t; // topo do vidro frontal

// a câmera de selfie (o furo na tela) e o slot da S Pen, embaixo
export const PUNCH = { x: 0, z: -PHONE.l / 2 + 7.2, r: 1.7 };
export const SPEN = { x: -PHONE.w / 2 + 13, w: 7.4 };

// câmeras na traseira, vistas pelo eixo do modelo (a traseira olha para y negativo, o topo é z negativo).
// Desenho dos Galaxy Ultra (sem ilha): coluna de três lentes grandes no canto, cada uma com o seu anel,
// e à direita delas uma coluna de duas lentes menores (a tele 5× e o foco a laser), com o flash no meio.
// As menores ficam um pouco abaixo das grandes de cada linha, como na foto de referência do S26 Ultra.
const cz = -PHONE.l / 2;
const COL = 23.4, PASSO = 17.4, TOPO = 13.6; // x da coluna grande, distância entre lentes, centro da 1ª lente
export const LENSES = [
  { id: 'principal', x: COL, z: cz + TOPO, r: 7.3, mp: '200 MP', mm: 23 },
  { id: 'ultrawide', x: COL, z: cz + TOPO + PASSO, r: 7.3, mp: '50 MP', mm: 13 },
  { id: 'tele3x', x: COL, z: cz + TOPO + PASSO * 2, r: 7.3, mp: '10 MP', mm: 67 },
  { id: 'tele5x', x: COL - 14.6, z: cz + TOPO + 1.8, r: 4.6, mp: '50 MP', mm: 111 },
];
// o foco a laser tem o mesmo acabamento das lentes menores (na traseira ele parece uma quinta lente)
export const LASER = { x: COL - 14.6, z: cz + TOPO + PASSO + 1.8, r: 4.6 };
export const FLASH = { x: COL - 14.6, z: cz + TOPO + PASSO / 2 + 1.8, r: 1.9 };

// as seis camadas, de baixo para cima (a abertura monta nesta ordem)
export const LAYERS = ['traseira', 'bateria', 'placa', 'moldura', 'painel', 'vidro'];

// grade de "pixels" que acendem na tela de carga (uma varredura de cima para baixo)
export const GRID = { cols: 9, rows: 19, cell: 7.4, gap: 0.86 };
