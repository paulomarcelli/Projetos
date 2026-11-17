import { Img, staticFile } from "remotion";

// Símbolo "E?" branco, 72 px, a 70%, em x 936 y 232. O vídeo todo menos o fechamento.
export const MarcaDagua: React.FC<{ opacidade: number }> = ({ opacidade }) => (
  <Img src={staticFile("marca/marca-dagua-branca.svg")} style={{ position: "absolute", left: 936, top: 232, width: 72, height: 72, opacity: 0.7 * opacidade }} />
);
