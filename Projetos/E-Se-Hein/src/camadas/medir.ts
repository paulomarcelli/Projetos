import { measureText } from "@remotion/layout-utils";
import { FONTE } from "../fontes";

/** Largura real do texto em px (só chame depois de useFontesProntas). */
export const larguraTexto = (texto: string, tamanho: number, peso: 800 | 900, espacamentoEm = 0) =>
  measureText({ text: texto, fontFamily: FONTE, fontSize: tamanho, fontWeight: String(peso), letterSpacing: `${espacamentoEm}em` }).width;
