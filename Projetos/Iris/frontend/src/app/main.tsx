// Inter (variável, eixo de peso 100–900): interface e texto corrido.
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "../styles/globais.css";
import "../styles/cristal.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router";
import { PREVIA } from "../config/env";
import { App } from "./App";
import { entradaDaPrevia } from "./entradaDaPrevia";
import { ProvedorDeNotificacoes } from "./provedores/ProvedorDeNotificacoes";
import { prepararImpressao } from "../utils/impressao";
import { iniciarPreferencias } from "../store/preferencias";

// O index.html já aplicou tema e tamanho do texto antes da pintura; aqui o estado passa a ser
// acompanhado (troca do tema do sistema) e reaplicado (prévia e testes).
iniciarPreferencias();
prepararImpressao();

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("Elemento #raiz não encontrado.");

createRoot(raiz).render(
  <StrictMode>
    {PREVIA ? (
      <MemoryRouter initialEntries={[entradaDaPrevia(location.hash)]}>
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
