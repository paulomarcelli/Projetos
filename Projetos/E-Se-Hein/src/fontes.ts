import { loadFont } from "@remotion/fonts";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import r800 from "@fontsource/rubik/files/rubik-latin-800-normal.woff2";
import r800ext from "@fontsource/rubik/files/rubik-latin-ext-800-normal.woff2";
import r900 from "@fontsource/rubik/files/rubik-latin-900-normal.woff2";
import r900ext from "@fontsource/rubik/files/rubik-latin-ext-900-normal.woff2";

// Tipografia do Design System: Rubik 800 e 900 (OFL), latin e latin-ext, empacotada pelo npm.
export const FONTE = "Rubik";

const carregando = Promise.all([
  loadFont({ family: FONTE, url: r800, weight: "800" }),
  loadFont({ family: FONTE, url: r800ext, weight: "800" }),
  loadFont({ family: FONTE, url: r900, weight: "900" }),
  loadFont({ family: FONTE, url: r900ext, weight: "900" }),
]).then(() => Promise.all([document.fonts.load(`800 40px ${FONTE}`), document.fonts.load(`900 40px ${FONTE}`)]));

/** true quando a Rubik já está pronta para medir texto (segura o render até lá). */
export function useFontesProntas() {
  const [pronto, setPronto] = useState(false);
  const [handle] = useState(() => delayRender("Carregando a Rubik"));
  useEffect(() => {
    carregando.then(() => {
      setPronto(true);
      continueRender(handle);
    });
  }, [handle]);
  return pronto;
}
