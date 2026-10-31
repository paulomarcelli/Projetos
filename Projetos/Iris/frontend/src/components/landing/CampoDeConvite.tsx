/**
 * O campo de pergunta da landing, no padrão das IAs: enquanto está vazio, perguntas de exemplo se digitam sozinhas
 * no lugar do placeholder; o botão leva a pergunta para a plataforma (/app?pergunta=…), onde ela entra no campo da
 * conversa sem ser enviada. Com "reduzir movimento", o placeholder fica parado.
 */
import { ArrowUp } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router";
import { ROTAS } from "../../config/rotas";
import { PERGUNTAS_CURTAS, PERGUNTAS_DIGITADAS } from "./conteudo";

const POR_LETRA_MS = 34;
const PAUSA_MS = 2200;

function useDigitacao(ativa: boolean) {
  const [texto, setTexto] = useState("");
  useEffect(() => {
    if (!ativa) return;
    let frase = 0;
    let letra = 0;
    let apagando = false;
    let t: number;
    const passo = () => {
      const alvo = PERGUNTAS_DIGITADAS[frase];
      if (!apagando) {
        letra++;
        setTexto(alvo.slice(0, letra));
        if (letra === alvo.length) {
          apagando = true;
          t = window.setTimeout(passo, PAUSA_MS);
          return;
        }
        t = window.setTimeout(passo, POR_LETRA_MS);
      } else {
        letra = Math.max(0, letra - 3);
        setTexto(alvo.slice(0, letra));
        if (letra === 0) {
          apagando = false;
          frase = (frase + 1) % PERGUNTAS_DIGITADAS.length;
        }
        t = window.setTimeout(passo, 14);
      }
    };
    t = window.setTimeout(passo, 600);
    return () => window.clearTimeout(t);
  }, [ativa]);
  return texto;
}

export function CampoDeConvite({ grande = false }: { grande?: boolean }) {
  const id = useId();
  const [pergunta, setPergunta] = useState("");
  const [focado, setFocado] = useState(false);
  const reduzir = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const digitado = useDigitacao(!reduzir && !focado && pergunta === "");
  const destino = pergunta.trim() ? `${ROTAS.inicio}?pergunta=${encodeURIComponent(pergunta.trim())}` : ROTAS.inicio;

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className={`lp-painel lp-campo group relative flex items-end gap-3 p-3 pl-5 text-left transition-[border-color,box-shadow] duration-300 focus-within:border-[color:var(--lp-ouro)]/50 focus-within:shadow-[0_0_0_4px_rgba(245,196,81,0.08),0_30px_80px_-30px_rgba(79,125,255,0.45)] ${grande ? "min-h-[7.5rem]" : "min-h-[6.5rem]"}`}
      >
        <label htmlFor={id} className="sr-only">
          Escreva uma pergunta sobre relações internacionais
        </label>
        <div className="relative min-w-0 flex-1 self-stretch py-2">
          <textarea
            id={id}
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            rows={2}
            className="relative z-10 h-full w-full resize-none bg-transparent text-[1.0625rem] leading-relaxed text-[color:var(--lp-texto)] outline-none"
          />
          {pergunta === "" && (
            <p aria-hidden="true" className="pointer-events-none absolute inset-0 py-2 text-[1.0625rem] leading-relaxed text-[color:var(--lp-texto-3)]">
              {reduzir || focado ? "Pergunte sobre uma questão internacional…" : <span className="lp-cursor">{digitado}</span>}
            </p>
          )}
        </div>
        <Link
          to={destino}
          aria-label={pergunta.trim() ? "Investigar esta pergunta na Iris" : "Começar uma investigação"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[color:var(--lp-ouro)] text-[#0a1226] shadow-[0_8px_24px_-8px_rgba(245,196,81,0.7)] transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          <ArrowUp size={20} aria-hidden="true" />
        </Link>
      </div>
      <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0" aria-label="Perguntas de exemplo">
        {PERGUNTAS_CURTAS.map((p) => (
          <li key={p.rotulo}>
            <button type="button" onClick={() => setPergunta(p.pergunta)} className="lp-chip transition-colors duration-150 hover:border-[color:var(--lp-linha-forte)] hover:text-[color:var(--lp-texto)]">
              {p.rotulo}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
