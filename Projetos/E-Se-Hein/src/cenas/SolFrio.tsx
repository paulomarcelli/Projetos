import { Pilula } from "../camadas/rotulos";
import { Termometro, yDoNivel } from "../camadas/Termometro";
import { nivelTermometro } from "../lib/sol";
import { ambienteNoite } from "../mundo/ambiente";
import type { Cena, Vec3 } from "./tipos";
import { entra, janela, lerp3 } from "./util";

// Sol · Q4 · Poucos dias depois (Breu). A cidade vista do alto, no escuro e gelada (geada nas janelas); o mar ao
// fundo, escuro, sem gelo: só o mar resistiria. O termômetro cai até abaixo do zero. Sem número na tela.
const DE: Vec3 = [46, 62, 232];
const PARA: Vec3 = [38, 58, 214];
const TERMO = { x: 176, yTopo: 430, altura: 440, zero: 0.42 };

export const solFrio: Cena = {
  camera: ({ p, seg, aos }) => {
    // Em "mar" a câmera levanta um pouco o olhar para o mar ao fundo.
    const mar = entra(seg, aos("mar") - 0.2, 1.2);
    const pos = lerp3(DE, PARA, p);
    return { pos, alvo: lerp3([0, 2, -60], [-10, 6, -220], mar), fov: 50 };
  },
  ambiente: ({ seg, aos }) => ({ ...ambienteNoite, breu: 1, lua: 0, estrelas: 1, domo: 0, reflexo: 0, geada: entra(seg, aos("dias"), 2.2) }),
  boneco: () => null,
  contexto: () => ({ texto: "Poucos dias depois", tempo: true }),
  Rotulos: (props) => {
    const { seg, aos } = props;
    const nivel = nivelTermometro(seg, aos("dias"), aos("zero") + 0.2, 0.8, 0.24);
    const yZero = yDoNivel(TERMO.yTopo, TERMO.altura, TERMO.zero);
    return (
      <>
        <Termometro {...TERMO} nivel={nivel} seg={seg} janela={janela(props, aos("poucos"))} />
        <Pilula texto="Abaixo de 0 °C" cor="vermelho" x={490} y={yZero} seg={seg} janela={janela(props, aos("abaixo"))} />
      </>
    );
  },
};
