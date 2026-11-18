import { costa } from "./Costa";
import { eixoTerra } from "./EixoTerra";
import { luaSome } from "./LuaSome";
import { mares } from "./Mares";
import { noiteEscura } from "./NoiteEscura";
import { pergunta } from "./Pergunta";
import { provisoria } from "./Provisoria";
import { solAgora } from "./SolAgora";
import { solApaga } from "./SolApaga";
import { solFrio } from "./SolFrio";
import { solLuz } from "./SolLuz";
import { solPergunta } from "./SolPergunta";
import type { Cena } from "./tipos";
import { terraLua } from "./TerraLua";

// Catálogo de cenas: o nome aqui é o que vai no campo "cena" de cada trecho em videos/<tema>.json.
export const cenas: Record<string, Cena> = {
  "lua-some": luaSome,
  "noite-escura": noiteEscura,
  mares,
  costa,
  "eixo-terra": eixoTerra,
  "terra-lua": terraLua,
  pergunta,
  "sol-agora": solAgora,
  "sol-luz": solLuz,
  "sol-apaga": solApaga,
  "sol-frio": solFrio,
  "sol-pergunta": solPergunta,
  provisoria,
};

export function buscarCena(nome: string): Cena {
  return cenas[nome] ?? provisoria;
}
