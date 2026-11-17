import { loadFont } from "@remotion/fonts";
import m800 from "@fontsource/montserrat/files/montserrat-latin-800-normal.woff2";
import m900 from "@fontsource/montserrat/files/montserrat-latin-900-normal.woff2";

// Fonte PROVISÓRIA (Montserrat, licença OFL, empacotada pelo npm, sem rede no render).
// A tipografia final vem do Design System da Sofia.
export const FONTE = "Montserrat";

loadFont({ family: FONTE, url: m800, weight: "800" });
loadFont({ family: FONTE, url: m900, weight: "900" });
