import "@fontsource-variable/source-serif-4";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { ProvedorDeNotificacoes } from "./components/Notificacoes";

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("Elemento #raiz não encontrado.");

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <ProvedorDeNotificacoes>
        <App />
      </ProvedorDeNotificacoes>
    </BrowserRouter>
  </StrictMode>,
);
