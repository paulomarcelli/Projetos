import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/game.css';

async function boot() {
  // Rota de pré-visualização SÓ em desenvolvimento: `import.meta.env.DEV` vira `false`
  // no build de produção e o Vite remove este bloco (e o módulo de exemplo) do pacote.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')) {
    const { startPreview } = await import('./preview/preview');
    startPreview(new URLSearchParams(window.location.search));
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void boot();
