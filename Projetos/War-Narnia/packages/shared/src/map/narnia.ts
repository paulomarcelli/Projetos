/**
 * Mapa de Nárnia: 42 territórios, 6 regiões de 7 e o grafo de conexões.
 *
 * Fonte: arte do usuário (docs/referencias/mapa-narnia-original.webp e o recorte
 * packages/client/public/assets/mapa-narnia.webp, 2000 x 888).
 * `anchor` = centro do rótulo/área na arte. Justificativa de cada conexão: docs/MAP_DATA.md.
 */
import type { CardSymbol, Connection, MapData, Region, RegionId, Territory } from '../types';

export const REGIONS: Region[] = [
  { id: 'narnia', name: 'Reino de Nárnia', bonus: 5, color: '#D4A537' },
  { id: 'norte', name: 'Terras do Norte', bonus: 4, color: '#A9D3EA' },
  { id: 'arquelandia', name: 'Arquelândia', bonus: 3, color: '#5E9E57' },
  { id: 'calormania', name: 'Calormânia', bonus: 5, color: '#E07B39' },
  { id: 'telmar', name: 'Terras de Telmar', bonus: 4, color: '#8C8A3E' },
  { id: 'ilhas', name: 'Ilhas Orientais', bonus: 3, color: '#3B7DC4' },
];

type T = [id: string, name: string, region: RegionId, x: number, y: number, symbol: CardSymbol];

// [id, nome, região, âncora x, âncora y, símbolo da carta]
const TERRITORY_ROWS: T[] = [
  // Reino de Nárnia
  ['cair-paravel', 'Cair Paravel', 'narnia', 1095, 409, 'espada'],
  ['beruna', 'Beruna', 'narnia', 1018, 247, 'escudo'],
  ['lantern-waste', 'Lantern Waste', 'narnia', 1055, 494, 'coroa'],
  ['grande-rio', 'Grande Rio', 'narnia', 877, 514, 'espada'],
  ['mesa-de-pedra', 'Mesa de Pedra', 'narnia', 721, 479, 'escudo'],
  ['bosques-de-narnia', 'Bosques de Nárnia', 'narnia', 700, 308, 'coroa'],
  ['how-de-aslan', 'How de Aslan', 'narnia', 863, 263, 'espada'],
  // Terras do Norte
  ['ettinsmoor', 'Ettinsmoor', 'norte', 587, 113, 'escudo'],
  ['harfang', 'Harfang', 'norte', 733, 135, 'coroa'],
  ['terras-dos-gigantes', 'Terras dos Gigantes', 'norte', 877, 116, 'espada'],
  ['passagem-do-norte', 'Passagem do Norte', 'norte', 1002, 108, 'escudo'],
  ['pico-gelado', 'Pico Gelado', 'norte', 1189, 103, 'coroa'],
  ['desfiladeiro-branco', 'Desfiladeiro Branco', 'norte', 1282, 163, 'espada'],
  ['lago-congelado', 'Lago Congelado', 'norte', 1418, 148, 'escudo'],
  // Arquelândia
  ['anvard', 'Anvard', 'arquelandia', 1227, 271, 'coroa'],
  ['vale-verde', 'Vale Verde', 'arquelandia', 1432, 271, 'espada'],
  ['colinas-de-arquelandia', 'Colinas de Arquelândia', 'arquelandia', 1470, 362, 'escudo'],
  ['fortaleza-da-fronteira', 'Fortaleza da Fronteira', 'arquelandia', 1521, 484, 'coroa'],
  ['passagem-sul', 'Passagem Sul', 'arquelandia', 1238, 474, 'espada'],
  ['rio-das-colinas', 'Rio das Colinas', 'arquelandia', 1355, 536, 'escudo'],
  ['campo-real', 'Campo Real', 'arquelandia', 1494, 568, 'coroa'],
  // Calormânia
  ['tashbaan', 'Tashbaan', 'calormania', 732, 645, 'espada'],
  ['deserto-de-calormania', 'Deserto de Calormânia', 'calormania', 947, 630, 'escudo'],
  ['oasis-dourado', 'Oásis Dourado', 'calormania', 1107, 692, 'coroa'],
  ['rio-calormeno', 'Rio Calormeno', 'calormania', 1252, 641, 'espada'],
  ['cidade-murada', 'Cidade Murada', 'calormania', 1273, 765, 'escudo'],
  ['costa-sul', 'Costa Sul', 'calormania', 1083, 790, 'coroa'],
  ['estrada-das-caravanas', 'Estrada das Caravanas', 'calormania', 853, 773, 'espada'],
  // Terras de Telmar
  ['castelo-de-telmar', 'Castelo de Telmar', 'telmar', 393, 115, 'escudo'],
  ['porto-ocidental', 'Porto Ocidental', 'telmar', 215, 255, 'coroa'],
  ['ruinas-de-telmar', 'Ruínas de Telmar', 'telmar', 405, 255, 'espada'],
  ['floresta-ocidental', 'Floresta Ocidental', 'telmar', 435, 395, 'escudo'],
  ['fortaleza-do-mar', 'Fortaleza do Mar', 'telmar', 250, 385, 'coroa'],
  ['vale-telmarino', 'Vale Telmarino', 'telmar', 510, 505, 'espada'],
  ['baia-dos-exilados', 'Baía dos Exilados', 'telmar', 318, 552, 'escudo'],
  // Ilhas Orientais
  ['ilhas-solitarias', 'Ilhas Solitárias', 'ilhas', 1710, 193, 'coroa'],
  ['felimath', 'Felimath', 'ilhas', 1814, 276, 'espada'],
  ['avra', 'Avra', 'ilhas', 1676, 385, 'escudo'],
  ['doorn', 'Doorn', 'ilhas', 1841, 428, 'coroa'],
  ['galma', 'Galma', 'ilhas', 1703, 561, 'espada'],
  ['terebintia', 'Terebintia', 'ilhas', 1822, 647, 'escudo'],
  ['ilha-oriental', 'Ilha Oriental', 'ilhas', 1712, 759, 'coroa'],
];

export const TERRITORIES: Territory[] = TERRITORY_ROWS.map(([id, name, region, x, y, cardSymbol]) => ({
  id,
  name,
  region,
  anchor: { x, y },
  cardSymbol,
}));

const L = (a: string, b: string, note: string): Connection => ({ a, b, kind: 'land', note });
const S = (a: string, b: string, note: string): Connection => ({ a, b, kind: 'sea', note });

export const CONNECTIONS: Connection[] = [
  /* ---------- Reino de Nárnia (internas) ---------- */
  L('bosques-de-narnia', 'how-de-aslan', 'Fronteira desenhada entre os Bosques e a encosta do How.'),
  L('bosques-de-narnia', 'mesa-de-pedra', 'Fronteira desenhada (linha leste-oeste abaixo dos Bosques).'),
  L('how-de-aslan', 'beruna', 'Fronteira desenhada a leste do How.'),
  L('how-de-aslan', 'cair-paravel', 'A área da cabeça do leão (parte do How) faz fronteira com Cair Paravel.'),
  L('how-de-aslan', 'grande-rio', 'Fronteira pelo rio que contorna a área do leão, ao sul.'),
  L('how-de-aslan', 'lantern-waste', 'Fronteira pelo rio que contorna a área do leão, a sudeste.'),
  L('how-de-aslan', 'mesa-de-pedra', 'Fronteira pelo rio a oeste da área do leão.'),
  L('beruna', 'cair-paravel', 'Fronteira desenhada entre Beruna e Cair Paravel.'),
  L('cair-paravel', 'lantern-waste', 'Fronteira desenhada ao sul de Cair Paravel.'),
  L('grande-rio', 'mesa-de-pedra', 'Fronteira desenhada a oeste do Grande Rio.'),
  L('grande-rio', 'lantern-waste', 'Fronteira pelo rio entre Grande Rio e Lantern Waste.'),

  /* ---------- Terras do Norte (internas) ---------- */
  L('ettinsmoor', 'harfang', 'Fronteira desenhada na faixa nevada.'),
  L('harfang', 'terras-dos-gigantes', 'Fronteira desenhada na faixa nevada.'),
  L('terras-dos-gigantes', 'passagem-do-norte', 'Fronteira desenhada na faixa nevada.'),
  L('passagem-do-norte', 'pico-gelado', 'Fronteira pela cordilheira/rio entre os dois.'),
  L('pico-gelado', 'desfiladeiro-branco', 'Fronteira desenhada (o Desfiladeiro fica encaixado no Pico).'),
  L('pico-gelado', 'lago-congelado', 'Fronteira curta no alto, acima do Desfiladeiro Branco.'),
  L('desfiladeiro-branco', 'lago-congelado', 'Fronteira desenhada.'),

  /* ---------- Arquelândia (internas) ---------- */
  L('anvard', 'vale-verde', 'Fronteira desenhada.'),
  L('anvard', 'colinas-de-arquelandia', 'Fronteira desenhada a leste do castelo de Anvard.'),
  L('anvard', 'passagem-sul', 'Fronteira desenhada ao sul do castelo de Anvard.'),
  L('anvard', 'rio-das-colinas', 'Fronteira desenhada ao sul do castelo de Anvard.'),
  L('vale-verde', 'colinas-de-arquelandia', 'Fronteira desenhada.'),
  L('colinas-de-arquelandia', 'fortaleza-da-fronteira', 'Fronteira desenhada.'),
  L('colinas-de-arquelandia', 'rio-das-colinas', 'Fronteira curta desenhada no canto noroeste do Rio das Colinas.'),
  L('passagem-sul', 'rio-das-colinas', 'Fronteira desenhada.'),
  L('rio-das-colinas', 'fortaleza-da-fronteira', 'Fronteira desenhada (o rio corre até a Fortaleza).'),
  L('rio-das-colinas', 'campo-real', 'Fronteira desenhada.'),
  L('fortaleza-da-fronteira', 'campo-real', 'Fronteira desenhada.'),

  /* ---------- Calormânia (internas) ---------- */
  L('tashbaan', 'deserto-de-calormania', 'Fronteira desenhada.'),
  L('tashbaan', 'estrada-das-caravanas', 'Fronteira desenhada.'),
  L('deserto-de-calormania', 'estrada-das-caravanas', 'Fronteira desenhada.'),
  L('deserto-de-calormania', 'oasis-dourado', 'Fronteira desenhada.'),
  L('deserto-de-calormania', 'costa-sul', 'Fronteira desenhada ao sul do oásis do Deserto.'),
  L('deserto-de-calormania', 'rio-calormeno', 'Fronteira desenhada a oeste do rio Calormeno.'),
  L('oasis-dourado', 'rio-calormeno', 'Fronteira pelo rio Calormeno.'),
  L('oasis-dourado', 'costa-sul', 'Fronteira desenhada.'),
  L('estrada-das-caravanas', 'costa-sul', 'Fronteira desenhada.'),
  L('costa-sul', 'cidade-murada', 'Fronteira pelo rio, junto ao porto fortificado.'),
  L('rio-calormeno', 'cidade-murada', 'Mesma massa de terra; a divisa fica sob a cidade amuralhada.'),

  /* ---------- Terras de Telmar (internas) ---------- */
  L('castelo-de-telmar', 'porto-ocidental', 'Fronteira curta desenhada junto à foz do rio.'),
  L('castelo-de-telmar', 'ruinas-de-telmar', 'Fronteira desenhada.'),
  L('porto-ocidental', 'ruinas-de-telmar', 'Fronteira desenhada.'),
  L('porto-ocidental', 'fortaleza-do-mar', 'Fronteira desenhada.'),
  L('ruinas-de-telmar', 'fortaleza-do-mar', 'Fronteira desenhada.'),
  L('ruinas-de-telmar', 'floresta-ocidental', 'Fronteira desenhada.'),
  L('fortaleza-do-mar', 'floresta-ocidental', 'Fronteira desenhada.'),
  L('fortaleza-do-mar', 'baia-dos-exilados', 'Fronteira desenhada.'),
  L('floresta-ocidental', 'baia-dos-exilados', 'Fronteira desenhada.'),
  L('floresta-ocidental', 'vale-telmarino', 'Fronteira desenhada.'),
  L('baia-dos-exilados', 'vale-telmarino', 'Fronteira desenhada.'),

  /* ---------- Ilhas Orientais (rotas tracejadas) ---------- */
  S('ilhas-solitarias', 'felimath', 'Rota tracejada entre as duas ilhas do norte.'),
  S('ilhas-solitarias', 'avra', 'Rota tracejada a oeste, descendo das Ilhas Solitárias até Avra.'),
  S('felimath', 'doorn', 'Rota tracejada a leste, de Felimath até Doorn.'),
  S('avra', 'galma', 'Rota tracejada a oeste, de Avra até Galma.'),
  S('doorn', 'galma', 'Rota tracejada do laço de Galma até Doorn.'),
  S('doorn', 'terebintia', 'Rota tracejada a leste, de Doorn até Terebintia.'),
  S('galma', 'terebintia', 'Rota tracejada entre Galma e Terebintia.'),
  S('galma', 'ilha-oriental', 'Rota tracejada do laço de Galma até a Ilha Oriental.'),
  S('terebintia', 'ilha-oriental', 'Rota tracejada contornando Terebintia até a Ilha Oriental.'),

  /* ---------- Entre regiões ---------- */
  // Norte ↔ Telmar
  L('ettinsmoor', 'castelo-de-telmar', 'Fronteira grossa entre a neve e o Castelo de Telmar.'),
  L('ettinsmoor', 'ruinas-de-telmar', 'Fronteira grossa entre a neve e a serra das Ruínas.'),
  // Norte ↔ Nárnia
  L('ettinsmoor', 'bosques-de-narnia', 'Fronteira curta no canto noroeste dos Bosques.'),
  L('harfang', 'bosques-de-narnia', 'Fronteira grossa (borda norte dos Bosques).'),
  L('harfang', 'how-de-aslan', 'Fronteira grossa (borda norte do How).'),
  L('terras-dos-gigantes', 'how-de-aslan', 'Fronteira grossa (borda norte do How).'),
  L('passagem-do-norte', 'beruna', 'Fronteira grossa (borda norte de Beruna).'),
  // Norte ↔ Arquelândia
  L('pico-gelado', 'anvard', 'Fronteira grossa (borda norte de Anvard).'),
  L('desfiladeiro-branco', 'anvard', 'Fronteira grossa (borda norte de Anvard).'),
  L('lago-congelado', 'vale-verde', 'Fronteira grossa (borda norte do Vale Verde).'),
  // Telmar ↔ Nárnia
  L('ruinas-de-telmar', 'bosques-de-narnia', 'Fronteira grossa a leste da serra das Ruínas.'),
  L('floresta-ocidental', 'bosques-de-narnia', 'Fronteira grossa a leste da Floresta Ocidental.'),
  L('floresta-ocidental', 'mesa-de-pedra', 'Fronteira grossa a leste da Floresta Ocidental (trecho sul).'),
  L('vale-telmarino', 'mesa-de-pedra', 'Fronteira grossa a leste do Vale Telmarino.'),
  // Nárnia ↔ Arquelândia (pelo grande rio)
  L('beruna', 'anvard', 'Fronteira pelo grande rio que separa Nárnia de Arquelândia.'),
  L('cair-paravel', 'anvard', 'Fronteira pelo grande rio (frente ao castelo de Anvard).'),
  L('cair-paravel', 'passagem-sul', 'Fronteira pelo grande rio (trecho curto ao sul).'),
  L('lantern-waste', 'passagem-sul', 'Fronteira desenhada a leste de Lantern Waste.'),
  // Nárnia ↔ Calormânia
  L('mesa-de-pedra', 'tashbaan', 'Fronteira grossa ao sul da Mesa de Pedra.'),
  L('mesa-de-pedra', 'deserto-de-calormania', 'Fronteira grossa curta no canto sudeste da Mesa de Pedra.'),
  L('grande-rio', 'deserto-de-calormania', 'Fronteira grossa ao sul do Grande Rio.'),
  L('lantern-waste', 'deserto-de-calormania', 'Fronteira grossa ao sul de Lantern Waste.'),
  L('lantern-waste', 'rio-calormeno', 'Fronteira grossa no canto sudeste de Lantern Waste.'),
  // Arquelândia ↔ Calormânia
  L('passagem-sul', 'rio-calormeno', 'Fronteira grossa ao sul da Passagem Sul.'),
  L('rio-das-colinas', 'rio-calormeno', 'Fronteira grossa ao sul do Rio das Colinas.'),
  // Rotas marítimas para o continente
  S('baia-dos-exilados', 'tashbaan', 'Navio desenhado no golfo entre Telmar e Calormânia.'),
  S('fortaleza-da-fronteira', 'avra', 'A rota tracejada oeste das ilhas passa rente à costa da Fortaleza.'),
  S('campo-real', 'galma', 'Rota tracejada de Galma termina na costa de Campo Real.'),
  S('cidade-murada', 'ilha-oriental', 'Rota tracejada da Ilha Oriental segue até o navio ao largo de Cidade Murada.'),
];

export const NARNIA_MAP: MapData = {
  regions: REGIONS,
  territories: TERRITORIES,
  connections: CONNECTIONS,
  artSize: { width: 2000, height: 888 },
};
