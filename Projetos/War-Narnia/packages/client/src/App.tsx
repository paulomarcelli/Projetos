import { useEffect } from 'react';
import { api } from './net/api';
import { inviteCodeFromUrl, loadSession } from './net/session';
import { setState, useStore } from './net/store';
import { ConnectionBanner } from './components/ui/ConnectionBanner';
import { FullscreenLoading } from './components/ui/Loading';
import { Toasts } from './components/ui/Toasts';
import { HomeScreen } from './screens/HomeScreen';
import { MenuScreen } from './screens/MenuScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { GameScreen } from './screens/GameScreen';

export function App() {
  const screen = useStore((s) => s.screen);
  const restoring = useStore((s) => s.restoring);
  const preview = useStore((s) => s.preview);

  useEffect(() => {
    if (preview) return;
    const invite = inviteCodeFromUrl();
    if (invite) setState({ inviteCode: invite, screen: 'menu' });
    const saved = loadSession();
    // Convite para OUTRA sala tem prioridade sobre a sessão salva.
    if (saved && (!invite || invite === saved.code)) void api().resume();
  }, [preview]);

  let content;
  if (restoring) content = <FullscreenLoading text="Retomando sua partida…" />;
  else if (screen === 'menu') content = <MenuScreen />;
  else if (screen === 'sala') content = <LobbyScreen />;
  else if (screen === 'jogo') content = <GameScreen />;
  else content = <HomeScreen />;

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <ConnectionBanner />
      {content}
      <Toasts />
      {import.meta.env.DEV && preview ? <PreviewBadge /> : null}
    </>
  );
}

function PreviewBadge() {
  return (
    <div className="preview-badge" role="note">
      PRÉ-VISUALIZAÇÃO — dados de exemplo
    </div>
  );
}
