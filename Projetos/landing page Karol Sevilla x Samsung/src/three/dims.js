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
// Coluna de três lentes grandes no canto e uma quarta ao lado, com flash e foco a laser.
const cz = -PHONE.l / 2;
export const LENSES = [
  { id: 'principal', x: 23.4, z: cz + 16, r: 6.6, mp: '200 MP', mm: 23 },
  { id: 'ultrawide', x: 23.4, z: cz + 31.4, r: 6.6, mp: '50 MP', mm: 13 },
  { id: 'tele3x', x: 23.4, z: cz + 46.8, r: 6.6, mp: '10 MP', mm: 67 },
  { id: 'tele5x', x: 9.8, z: cz + 16, r: 5.2, mp: '50 MP', mm: 111 },
];
export const FLASH = { x: 9.8, z: cz + 28.8, r: 2.2 };
export const LASER = { x: 9.8, z: cz + 37, r: 1.5 };

// as seis camadas, de baixo para cima (a abertura monta nesta ordem)
export const LAYERS = ['traseira', 'bateria', 'placa', 'moldura', 'painel', 'vidro'];

// grade de "pixels" que acendem na tela de carga (uma varredura de cima para baixo)
export const GRID = { cols: 9, rows: 19, cell: 7.4, gap: 0.86 };
