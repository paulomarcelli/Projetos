/** Tema claro/escuro: "sistema" segue o sistema operacional; a escolha fica só neste navegador. */
import { useEffect, useState } from "react";

export type Tema = "sistema" | "claro" | "escuro";
const CHAVE = "atlas-tema";

function ler(): Tema {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "claro" || v === "escuro" ? v : "sistema";
  } catch {
    return "sistema";
  }
}

export function aplicarTema(t: Tema) {
  const raiz = document.documentElement;
  if (t === "sistema") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", t === "escuro" ? "dark" : "light");
}

export function useTema(): [Tema, (t: Tema) => void] {
  const [tema, setTema] = useState<Tema>(ler);
  useEffect(() => {
    aplicarTema(tema);
    try {
      if (tema === "sistema") localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, tema);
    } catch {
      /* armazenamento indisponível: o tema vale só nesta visita */
    }
  }, [tema]);
  return [tema, setTema];
}
