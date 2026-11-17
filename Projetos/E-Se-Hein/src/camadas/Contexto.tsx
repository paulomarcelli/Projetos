import { FONTE } from "../fontes";

// Rótulo pequeno do canto de cima, como o "5º ANDAR" da referência.
export const Contexto: React.FC<{ texto: string; opacidade: number }> = ({ texto, opacidade }) =>
  texto ? (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 222,
        opacity: opacidade,
        fontFamily: FONTE,
        fontWeight: 900,
        fontSize: 46,
        color: "#fff",
        WebkitTextStroke: "9px #141414",
        paintOrder: "stroke fill",
        textTransform: "uppercase",
        rotate: "-3deg",
        transformOrigin: "left center",
      }}
    >
      {texto}
    </div>
  ) : null;
