import { useState } from 'react';
import type { PlayerColor } from '@war/shared';
import { api } from '../net/api';
import { inviteLink } from '../net/session';
import { toast, useStore } from '../net/store';
import { Button } from '../components/ui/Button';
import { ConnDot } from '../components/ui/ConnectionBanner';
import { Dialog } from '../components/ui/Dialog';
import { PlayerSeal } from '../components/ui/Emblem';
import { FullscreenLoading } from '../components/ui/Loading';
import { PLAYER_COLORS, PLAYER_META } from '../game/players';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback para contextos sem Clipboard API (http em IP local).
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/** (3) Sala de espera. */
export function LobbyScreen() {
  const room = useStore((s) => s.room);
  const me = useStore((s) => s.session?.playerId ?? null);
  const conn = useStore((s) => s.conn);
  const preview = useStore((s) => s.preview);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [colorBusy, setColorBusy] = useState<PlayerColor | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!room) return <FullscreenLoading text="Abrindo a sala…" />;

  const isHost = room.hostId === me;
  const myColor = room.players.find((p) => p.id === me)?.color;
  const enough = room.players.length >= room.minPlayers;
  const link = inviteLink(room.code);
  const online = conn === 'connected' || preview;

  const onCopy = async () => {
    const ok = await copyText(link);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast('error', 'Não deu para copiar. Selecione o link e copie manualmente.');
    }
  };

  const pickColor = async (c: PlayerColor) => {
    if (c === myColor) return;
    setColorBusy(c);
    try {
      await api().setColor(c);
    } finally {
      setColorBusy(null);
    }
  };

  const start = async () => {
    setStarting(true);
    try {
      await api().startGame();
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="lobby">
      <div className="home__art home__art--dim" aria-hidden="true" />
      <main className="lobby__card surface" id="conteudo">
        <header className="lobby__head">
          <div>
            <p className="eyebrow">Sala de espera</p>
            <h1 className="lobby__title">Reúna seus aliados</h1>
          </div>
          <ConnDot connected={online} label={online ? 'Conectado' : 'Sem conexão'} />
        </header>

        <section className="invite" aria-labelledby="invite-title">
          <h2 id="invite-title" className="section-title">
            Convite
          </h2>
          <div className="invite__row">
            <div className="invite__code" aria-label={`Código da sala: ${room.code.split('').join(' ')}`}>
              {room.code}
            </div>
            <Button variant="primary" icon={copied ? 'check' : 'copy'} onClick={() => void onCopy()}>
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>
          </div>
          <p className="field__help invite__link">{link}</p>
          <p className="sr-only" role="status">
            {copied ? 'Link de convite copiado.' : ''}
          </p>
        </section>

        <section aria-labelledby="players-title">
          <h2 id="players-title" className="section-title">
            Jogadores ({room.players.length}/{room.maxPlayers})
          </h2>
          <ul className="lobby__players">
            {room.players.map((p) => (
              <li key={p.id} className="lobby__player">
                <PlayerSeal color={p.color} size={30} title={`${PLAYER_META[p.color].label} (${PLAYER_META[p.color].emblemLabel})`} />
                <span className="lobby__player-name">
                  {p.name}
                  {p.id === me ? <span className="tag">você</span> : null}
                  {p.isHost ? <span className="tag tag--accent">anfitrião</span> : null}
                </span>
                <ConnDot connected={p.connected} label={p.connected ? 'online' : 'offline'} />
              </li>
            ))}
            {Array.from({ length: Math.max(0, room.minPlayers - room.players.length) }, (_, i) => (
              <li key={`vazio-${i}`} className="lobby__player lobby__player--empty">
                Aguardando jogador…
              </li>
            ))}
          </ul>
        </section>

        <fieldset className="colors">
          <legend className="section-title">Sua cor</legend>
          <div className="colors__grid">
            {PLAYER_COLORS.map((c) => {
              const owner = room.players.find((p) => p.color === c);
              const taken = !!owner && owner.id !== me;
              const meta = PLAYER_META[c];
              return (
                <label key={c} className={`swatch${c === myColor ? ' is-selected' : ''}${taken ? ' is-taken' : ''}`}>
                  <input
                    type="radio"
                    name="cor"
                    value={c}
                    checked={c === myColor}
                    disabled={taken || colorBusy !== null}
                    onChange={() => void pickColor(c)}
                  />
                  <PlayerSeal color={c} size={32} />
                  <span className="swatch__label">
                    {meta.label}
                    <span className="swatch__sub">{taken ? `com ${owner!.name}` : meta.emblemLabel}</span>
                  </span>
                  {colorBusy === c ? <span className="spinner" aria-hidden="true" /> : null}
                </label>
              );
            })}
          </div>
        </fieldset>

        <footer className="lobby__actions">
          <Button variant="ghost" icon="door" onClick={() => setConfirmLeave(true)}>
            Sair da sala
          </Button>
          {isHost ? (
            <div className="lobby__start">
              <Button variant="primary" icon="swords" disabled={!enough} loading={starting} onClick={() => void start()} className="btn--lg">
                Iniciar partida
              </Button>
              {!enough ? (
                <p className="hint hint--center">Precisa de pelo menos {room.minPlayers} jogadores.</p>
              ) : null}
            </div>
          ) : (
            <p className="hint" role="status">
              Aguardando o anfitrião iniciar a partida…
            </p>
          )}
        </footer>
      </main>
      <Dialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Sair da sala?"
        actions={
          <>
            <Button onClick={() => setConfirmLeave(false)} data-autofocus>
              Ficar
            </Button>
            <Button variant="danger" onClick={() => void api().leaveRoom()}>
              Sair
            </Button>
          </>
        }
      >
        <p>{isHost ? 'Você é o anfitrião: os outros jogadores serão avisados da sua saída.' : 'Você poderá entrar de novo com o link de convite, enquanto a partida não começar.'}</p>
      </Dialog>
    </div>
  );
}
