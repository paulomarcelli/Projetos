import { CalculateMetadataFunction, Composition } from "remotion";
import type { DadosVideo } from "./tipos";
import { duracaoTotal, VideoEseHein } from "./Video";

// Uma composição para cada arquivo em videos/*.json. O nome do arquivo vira o id (videos/lua.json -> "lua").
const contexto = require.context("../videos", false, /\.json$/);
const videos = contexto
  .keys()
  .filter((k) => k.startsWith("./"))
  .map((k) => ({ id: k.slice(2, -5), dados: contexto<DadosVideo>(k) }));

type Props = { dados: DadosVideo };

const calcular: CalculateMetadataFunction<Props> = ({ props }) => ({
  durationInFrames: Math.ceil(duracaoTotal(props.dados) * 30),
});

export const RemotionRoot: React.FC = () => (
  <>
    {videos.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={VideoEseHein}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={Math.ceil(duracaoTotal(v.dados) * 30)}
        defaultProps={{ dados: v.dados }}
        calculateMetadata={calcular}
      />
    ))}
  </>
);
