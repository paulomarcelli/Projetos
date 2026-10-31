/**
 * O campo da pergunta. Enter envia, Shift+Enter quebra a linha; o campo cresce até oito linhas. Enquanto a Iris
 * responde, dá para escrever a próxima pergunta, mas não enviá-la.
 *
 * Na primeira pergunta, embaixo do campo, a pessoa escolhe o horizonte da investigação (1, 3, 5, 10 ou 25 anos, os
 * mesmos do formulário de rascunho); ele vale para a conversa inteira. Nas perguntas seguintes o horizonte já está
 * definido e o seletor some (escolherHorizonte=false).
 */
import { ArrowUp, Square } from "lucide-react";
import { useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { Horizonte } from "../../../hooks/useArmazenamentoLocal";

export const HORIZONTES: Horizonte[] = [1, 3, 5, 10, 25];
export const nomeDoHorizonte = (h: Horizonte) => `${h} ${h === 1 ? "ano" : "anos"}`;

export function CampoDePergunta({
  aoEnviar,
  ocupado = false,
  aoInterromper,
  continuacao = false,
  autoFoco = false,
  inicial = "",
  escolherHorizonte = true,
}: {
  aoEnviar: (texto: string, horizonte: Horizonte) => void;
  ocupado?: boolean;
  aoInterromper?: () => void;
  /** Já há uma investigação aberta: a pergunta a aprofunda (e o horizonte já foi escolhido). */
  continuacao?: boolean;
  autoFoco?: boolean;
  /** Pergunta trazida de fora (a landing manda /app?pergunta=…): entra no campo, sem ser enviada. */
  inicial?: string;
  /** Só na primeira pergunta: depois, o horizonte da conversa já está escolhido. */
  escolherHorizonte?: boolean;
}) {
  const [texto, setTexto] = useState(inicial);
  const [horizonte, setHorizonte] = useState<Horizonte>(5);
  const campo = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  // altura acompanha o texto (sem barra de rolagem até o limite)
  useLayoutEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 8 * 26 + 8)}px`;
  }, [texto]);

  const enviar = (e?: FormEvent) => {
    e?.preventDefault();
    const limpo = texto.trim();
    if (!limpo || ocupado) return;
    aoEnviar(limpo, horizonte);
    setTexto("");
  };
  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar();
    }
  };

  const pronto = !!texto.trim() && !ocupado;
  const rotulo = continuacao ? "Continue a investigação" : "Pergunte à Iris";
  const anoFinal = new Date().getFullYear() + horizonte;
  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={enviar}
        className={`campo-pergunta relative flex ${escolherHorizonte ? "flex-col" : "items-end gap-2 p-2"} rounded-[1.25rem] border border-linha-forte bg-institucional shadow-elevado transition-[border-color,box-shadow] duration-200 focus-within:border-ouro/45 focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-ouro)_9%,transparent),var(--shadow-elevado)]`}
      >
        <label className="sr-only" htmlFor={`${id}-pergunta`}>
          {rotulo}
        </label>
        <textarea
          id={`${id}-pergunta`}
          ref={campo}
          rows={escolherHorizonte ? 2 : 1}
          value={texto}
          autoFocus={autoFoco}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={aoTeclar}
          placeholder={continuacao ? "Aprofunde: atores, impactos, indicadores, história…" : "Que questão internacional você quer investigar?"}
          className={`max-h-[216px] min-h-6 resize-none bg-transparent text-texto outline-none placeholder:text-texto-3 ${
            escolherHorizonte ? "px-5 pt-4 pb-1 text-[1.0625rem] leading-[1.625rem]" : "flex-1 py-2 pl-4 text-corpo leading-6"
          }`}
        />
        <div className={escolherHorizonte ? "flex items-center justify-between gap-3 px-3 pt-1 pb-3 pl-5" : "contents"}>
          {escolherHorizonte && (
            <p className="hidden text-micro text-texto-3 sm:block" aria-hidden="true">
              <kbd className="font-dados">Enter</kbd> envia · <kbd className="font-dados">Shift + Enter</kbd> quebra a linha
            </p>
          )}
          {ocupado && aoInterromper ? (
            <button type="button" onClick={aoInterromper} aria-label="Interromper a resposta" className="botao botao-secundario ml-auto size-10 shrink-0 rounded-full p-0">
              <Square size={14} fill="currentColor" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!pronto}
              aria-label="Enviar pergunta"
              className={`ml-auto grid size-10 shrink-0 place-items-center rounded-full transition-[background-color,color,opacity,transform] duration-200 enabled:active:scale-95 ${
                pronto ? "bg-ouro text-abismo shadow-[0_6px_18px_-6px_color-mix(in_srgb,var(--color-ouro)_70%,transparent)]" : "bg-grafite text-texto-3"
              }`}
            >
              <ArrowUp size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {escolherHorizonte && (
        <fieldset className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 border-0 p-0">
          <legend className="float-left mr-1 text-legenda text-texto-2">Horizonte da análise</legend>
          <div className="flex flex-wrap gap-1.5">
            {HORIZONTES.map((h) => {
              const ativo = h === horizonte;
              return (
                <label
                  key={h}
                  className={`relative cursor-pointer rounded-full border px-3 py-1.5 text-legenda transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ouro ${
                    ativo ? "border-ouro/55 bg-ouro/10 text-texto" : "border-linha text-texto-2 hover:border-linha-forte hover:text-texto"
                  }`}
                >
                  <input type="radio" name={`${id}-horizonte`} value={h} checked={ativo} onChange={() => setHorizonte(h)} className="sr-only" />
                  {nomeDoHorizonte(h)}
                </label>
              );
            })}
          </div>
          <p className="numeros font-dados text-micro text-ambar" aria-live="polite">
            de {new Date().getFullYear()} até {anoFinal}
          </p>
        </fieldset>
      )}
    </div>
  );
}
