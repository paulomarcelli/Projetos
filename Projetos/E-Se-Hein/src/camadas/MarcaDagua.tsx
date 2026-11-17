import { Img, staticFile } from "remotion";

// Símbolo "E?" branco, discreto, no canto de cima à direita
// (abaixo da lupa do TikTok e acima da coluna de botões).
export const MarcaDagua: React.FC<{ opacidade: number }> = ({ opacidade }) => (
  <Img
    src={staticFile("marca/marca-dagua-branca.svg")}
    style={{ position: "absolute", top: 196, right: 64, width: 92, height: 92, opacity: 0.55 * opacidade }}
  />
);
