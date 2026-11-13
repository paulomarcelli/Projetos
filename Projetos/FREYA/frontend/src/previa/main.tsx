// Entrada da PRÉVIA estática: o mesmo App, com roteador em memória e um aviso fixo de que os dados são
// respostas reais capturadas da API (sem API ao vivo).
import "@fontsource-variable/outfit";
import "@fontsource-variable/inter";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "../styles/globais.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ProvedorDePreferencias } from "../contexts/Preferencias";
import { definicaoDasRotas } from "../app/roteador";

const roteador = createMemoryRouter(definicaoDasRotas, { initialEntries: ["/"] });

function AvisoDaPrevia() {
  return (
    <div role="note" style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 60, display: "flex", justifyContent: "center",
      padding: "6px max(16px, env(safe-area-inset-left, 0px)) calc(6px + env(safe-area-inset-bottom, 0px))", pointerEvents: "none" }}>
      <p className="bg-superficie text-texto-suave border border-borda shadow-media" style={{ margin: 0, padding: "6px 14px", borderRadius: 999,
        fontSize: "0.75rem", pointerEvents: "auto", maxWidth: 720, textAlign: "center" }}>
        <strong className="text-escarlate">Prévia</strong> · respostas reais capturadas da API da F.R.E.Y.A. em 2 nov. 2026
        (Thor × Loki e China–Taiwan). Sem API ao vivo: criar e excluir análises ficam desativados.
      </p>
    </div>
  );
}

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <ProvedorDePreferencias>
      <RouterProvider router={roteador} />
      <AvisoDaPrevia />
    </ProvedorDePreferencias>
  </StrictMode>,
);
