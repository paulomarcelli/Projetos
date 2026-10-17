import { api } from '../../net/api';
import { useStore } from '../../net/store';
import { Icon } from './Icon';

/** Faixa de conexão: aparece só quando há problema. */
export function ConnectionBanner() {
  const conn = useStore((s) => s.conn);
  const hasSession = useStore((s) => s.session !== null);
  if (conn === 'reconnecting' && hasSession) {
    return (
      <div className="conn-banner conn-banner--warn" role="status">
        <span className="spinner spinner--light" aria-hidden="true" />
        <span>Reconectando… sua partida continua salva no servidor.</span>
      </div>
    );
  }
  if (conn === 'offline') {
    return (
      <div className="conn-banner conn-banner--error" role="alert">
        <Icon name="wifi-off" size={18} />
        <span>Sem conexão com o servidor.</span>
        <button type="button" className="conn-banner__action" onClick={() => api().retryNow()}>
          Tentar agora
        </button>
      </div>
    );
  }
  return null;
}

export function ConnDot({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <span className={`conn-dot ${connected ? 'conn-dot--on' : 'conn-dot--off'}`}>
      <span className="conn-dot__mark" aria-hidden="true" />
      <span className={label ? '' : 'sr-only'}>{label ?? (connected ? 'conectado' : 'desconectado')}</span>
    </span>
  );
}
