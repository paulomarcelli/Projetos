import "@fontsource-variable/source-serif-4";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router";
import { PREVIA } from "./lib/api";
import { App } from "./App";
import { ProvedorDeNotificacoes } from "./components/Notificacoes";

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("Elemento #raiz não encontrado.");

createRoot(raiz).render(
  <StrictMode>
    {PREVIA ? (
      <MemoryRouter initialEntries={[location.hash === "#investigacao" ? "/app/investigacoes/exemplo-flavio-2026" : "/"]}>
        <ProvedorDeNotificacoes>
          <App />
        </ProvedorDeNotificacoes>
      </MemoryRouter>
    ) : (
      <BrowserRouter>
        <ProvedorDeNotificacoes>
          <App />
        </ProvedorDeNotificacoes>
      </BrowserRouter>
    )}
  </StrictMode>,
);
