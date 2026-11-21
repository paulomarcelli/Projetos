import { loadFont } from "@remotion/fonts";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import n500 from "@fontsource/newsreader/files/newsreader-latin-500-normal.woff2";
import n500x from "@fontsource/newsreader/files/newsreader-latin-ext-500-normal.woff2";
import n500i from "@fontsource/newsreader/files/newsreader-latin-500-italic.woff2";
import n500ix from "@fontsource/newsreader/files/newsreader-latin-ext-500-italic.woff2";
import p400 from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2";
import p400x from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-ext-400-normal.woff2";
import p500 from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2";
import p500x from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-ext-500-normal.woff2";
import p600 from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2";
import p600x from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-ext-600-normal.woff2";

// Tipografia v2 (Design System, "Realismo documental"): serifa é o que se diz, sem serifa é o que se mede.
export const SERIFA = "Newsreader";
export const SEM_SERIFA = "IBM Plex Sans";

const carregando = Promise.all([
  loadFont({ family: SERIFA, url: n500, weight: "500" }),
  loadFont({ family: SERIFA, url: n500x, weight: "500" }),
  loadFont({ family: SERIFA, url: n500i, weight: "500", style: "italic" }),
  loadFont({ family: SERIFA, url: n500ix, weight: "500", style: "italic" }),
  loadFont({ family: SEM_SERIFA, url: p400, weight: "400" }),
  loadFont({ family: SEM_SERIFA, url: p400x, weight: "400" }),
  loadFont({ family: SEM_SERIFA, url: p500, weight: "500" }),
  loadFont({ family: SEM_SERIFA, url: p500x, weight: "500" }),
  loadFont({ family: SEM_SERIFA, url: p600, weight: "600" }),
  loadFont({ family: SEM_SERIFA, url: p600x, weight: "600" }),
]);

/** Segura o render até as fontes da v2 estarem prontas. */
export function useFontesV2() {
  const [pronto, setPronto] = useState(false);
  const [handle] = useState(() => delayRender("Carregando Newsreader e IBM Plex Sans"));
  useEffect(() => {
    carregando.then(() => {
      setPronto(true);
      continueRender(handle);
    });
  }, [handle]);
  return pronto;
}
