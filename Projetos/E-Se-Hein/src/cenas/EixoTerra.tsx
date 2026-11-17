import { Cartao, LinhaTracejada, Pilula, SetaCurva, TextoPreso } from "../camadas/rotulos";
import { IconeFloco, IconeSol } from "../camadas/icones";
import { ambienteNoite, MARE_AMP_SEM_LUA } from "../mundo/ambiente";
import { poloNorte, TERRA_POS, TERRA_RAIO } from "../mundo/Terra";
import type { Cena, PropsCena, Vec3 } from "./tipos";
import { entra, janela, somar } from "./util";

// Q5 · O eixo (espaço). Terra grande no centro, eixo inclinado 23,4°; órbita lenta da câmera (10°).
// Em "variar" o eixo oscila, cada vez mais (acelerado: milhões de anos em segundos).
// Rótulos conferidos pela Sabrina: "COM LUA: 22° A 24,5°" e "SEM LUA: BALANÇA MAIS" (sem número).
export const balancoEixo = ({ seg, aos }: Pick<PropsCena, "seg" | "aos">) => {
  const t0 = aos("variar") - 0.3;
  const forca = entra(seg, t0, 2.5);
  const fase = Math.max(0, seg - t0);
  return 0.32 * forca * Math.sin(fase * (2 + fase * 0.35));
};

const orbita = (p: number): Vec3 => {
  const a = ((-5 + 10 * p) * Math.PI) / 180;
  return somar(TERRA_POS, [Math.sin(a) * 215, 12, Math.cos(a) * 215]);
};

export const eixoTerra: Cena = {
  camera: ({ p }) => ({ pos: orbita(p), alvo: TERRA_POS, fov: 50 }),
  ambiente: (props) => ({ ...ambienteNoite, lua: 0, estrelas: 1, espaco: 1, terra: 1, mareAmp: MARE_AMP_SEM_LUA, balanco: balancoEixo(props) }),
  boneco: () => null,
  contexto: () => ({ texto: "Milhões de anos", tempo: true }),
  Rotulos: (props) => {
    const { seg, aos, projetar } = props;
    const polo = projetar(poloNorte(balancoEixo(props)));
    const cima = projetar(somar(TERRA_POS, [0, TERRA_RAIO * 1.6, 0]));
    const baixo = projetar(somar(TERRA_POS, [0, -TERRA_RAIO * 1.6, 0]));
    // As pílulas saem quando o cartão entra (em "estações").
    const cartao = janela(props, aos("estações"));
    const eixo = janela(props, aos("inclinação"));
    return (
      <>
        <LinhaTracejada de={[cima.x, cima.y]} para={[baixo.x, baixo.y]} opacidade={1} />
        <SetaCurva cx={polo.x} cy={polo.y} raio={58} de={-Math.PI * 0.95} ate={-Math.PI * 0.05} cor="amarelo" seg={seg} janela={eixo} />
        <TextoPreso texto="Eixo" x={polo.x + 150} y={polo.y + 20} seg={seg} janela={eixo} />
        <Pilula texto="Com Lua: 22° a 24,5°" cor="verde" tamanho="P" x={330} y={330} seg={seg} janela={janela(props, aos("estabiliza"), cartao[0])} />
        <Pilula texto="Sem Lua: balança mais" cor="vermelho" tamanho="P" x={360} y={420} seg={seg} janela={janela(props, aos("sem"), cartao[0])} />
        <Cartao
          tipo="dois"
          y={420}
          seg={seg}
          janela={cartao}
          itens={[
            { icone: <IconeSol />, texto: "Verão" },
            { icone: <IconeFloco />, texto: "Inverno" },
          ]}
        />
      </>
    );
  },
};
