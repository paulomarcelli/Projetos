import { useState, type FormEvent } from 'react';
import { LIMITS } from '@war/shared';
import { api } from '../net/api';
import { setState, useStore } from '../net/store';
import { Button } from '../components/ui/Button';

type Mode = 'criar' | 'entrar';

function validateName(name: string): string | null {
  const n = name.trim();
  if (n.length === 0) return 'Digite seu nome.';
  if (n.length > LIMITS.nameMaxLength) return `Use no máximo ${LIMITS.nameMaxLength} caracteres.`;
  return null;
}

function validateCode(code: string): string | null {
  const c = code.trim();
  if (c.length === 0) return 'Digite o código da sala.';
  if (c.length !== LIMITS.roomCodeLength) return `O código tem ${LIMITS.roomCodeLength} caracteres.`;
  return null;
}

/** (2) Menu: criar sala ou entrar com código (o link /?sala=CODIGO já preenche). */
export function MenuScreen() {
  const invite = useStore((s) => s.inviteCode);
  const [mode, setMode] = useState<Mode>(invite ? 'entrar' : 'criar');
  const [name, setName] = useState('');
  const [code, setCode] = useState(invite ?? '');
  const [touched, setTouched] = useState({ name: false, code: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const nameErr = validateName(name);
  const codeErr = mode === 'entrar' ? validateCode(code) : null;
  const showName = (touched.name || submitted) && nameErr;
  const showCode = (touched.code || submitted) && codeErr;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (nameErr || codeErr) {
      document.getElementById(nameErr ? 'f-name' : 'f-code')?.focus();
      return;
    }
    setLoading(true);
    try {
      if (mode === 'criar') await api().createRoom(name.trim());
      else await api().joinRoom(code.trim().toUpperCase(), name.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="menu">
      <div className="home__art home__art--dim" aria-hidden="true" />
      <main className="menu__card surface" id="conteudo">
        <button type="button" className="link-back" onClick={() => setState({ screen: 'inicio' })}>
          ← Início
        </button>
        <h1 className="menu__title">{mode === 'criar' ? 'Criar uma sala' : 'Entrar em uma sala'}</h1>
        <div className="seg seg--wide" role="radiogroup" aria-label="O que você quer fazer?">
          {(['criar', 'entrar'] as const).map((m) => (
            <label key={m} className="seg__opt">
              <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} />
              <span>{m === 'criar' ? 'Criar sala' : 'Tenho um código'}</span>
            </label>
          ))}
        </div>
        <form onSubmit={onSubmit} noValidate className="form">
          <div className={`field${showName ? ' field--error' : ''}`}>
            <label htmlFor="f-name">Seu nome</label>
            <input
              id="f-name"
              name="nome"
              autoComplete="nickname"
              maxLength={LIMITS.nameMaxLength}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              aria-invalid={!!showName}
              aria-describedby="f-name-help"
              required
            />
            <p id="f-name-help" className={showName ? 'field__error' : 'field__help'} role={showName ? 'alert' : undefined}>
              {showName ? nameErr : `Como os outros vão ver você (até ${LIMITS.nameMaxLength} letras).`}
            </p>
          </div>
          {mode === 'entrar' ? (
            <div className={`field${showCode ? ' field--error' : ''}`}>
              <label htmlFor="f-code">Código da sala</label>
              <input
                id="f-code"
                name="codigo"
                className="input--code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={LIMITS.roomCodeLength}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onBlur={() => setTouched((t) => ({ ...t, code: true }))}
                aria-invalid={!!showCode}
                aria-describedby="f-code-help"
                required
              />
              <p id="f-code-help" className={showCode ? 'field__error' : 'field__help'} role={showCode ? 'alert' : undefined}>
                {showCode ? codeErr : invite ? 'Preenchido pelo link de convite.' : `${LIMITS.roomCodeLength} letras/números que o anfitrião enviou.`}
              </p>
            </div>
          ) : null}
          <Button type="submit" variant="primary" block loading={loading} icon={mode === 'criar' ? 'crown' : 'arrow-right'}>
            {mode === 'criar' ? 'Criar sala' : 'Entrar na sala'}
          </Button>
        </form>
      </main>
    </div>
  );
}
