import { CalculateMetadataFunction, Composition } from "remotion";
import type { DadosVideo } from "./tipos";
import { ultimaPessoa } from "./v2/ultima-pessoa";
import type { ConfigV2 } from "./v2/tipos";
import { VideoV2 } from "./v2/VideoV2";
import { duracaoTotal, VideoEseHein } from "./Video";

// Uma composição para cada arquivo em videos/*.json. O nome do arquivo vira o id (videos/lua.json -> "lua").
const contexto = require.context("../videos", false, /\.json$/);
const videos = contexto
  .keys()
  .filter((k) => k.startsWith("./"))
  .map((k) => ({ id: k.slice(2, -5), dados: contexto<DadosVideo>(k) }));

// Vídeos no estilo realista (v2): camadas 2D por cima dos planos do Blender. Os outros seguem no mundo de brinquedo (v1).
const ESTILO_V2: Record<string, ConfigV2> = { "ultima-pessoa": ultimaPessoa };

type Props = { dados: DadosVideo };

const calcular: CalculateMetadataFunction<Props> = ({ props }) => ({
  durationInFrames: Math.ceil(duracaoTotal(props.dados) * 30),
});

export const RemotionRoot: React.FC = () => (
  <>
    {videos.map((v) =>
      ESTILO_V2[v.id] ? (
        <Composition
          key={v.id}
          id={v.id}
          component={VideoV2}
          width={1080}
          height={1920}
          fps={30}
          durationInFrames={Math.ceil(duracaoTotal(v.dados) * 30)}
          defaultProps={{ dados: v.dados, config: ESTILO_V2[v.id], fonte: "video" as "video" | "quadros" }}
        />
      ) : (
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
      ),
    )}
  </>
);
