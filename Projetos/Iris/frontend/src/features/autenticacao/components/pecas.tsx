/**
 * Peças compartilhadas pelas telas de conta (entrar, criar conta, recuperar e redefinir senha).
 *
 * Acessibilidade dos campos:
 * - cada campo tem <label> real; a dica (regras de senha) e o erro entram em aria-describedby;
 * - o erro é anunciado (role="alert") e fica logo abaixo do campo a que se refere;
 * - `aria-invalid` só aparece depois de uma tentativa de envio, para não acusar quem ainda digita.
 * Feedback do envio: o botão mostra o carregamento (aria-busy, rótulo trocado) e fica
 * desativado enquanto espera; o resultado aparece num aviso que entra com transição curta.
 */
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { REGRAS_SENHA } from "../../../utils/validadores";

interface PropsCampo extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  rotulo: string;
  erro?: string;
  /** Texto de ajuda sempre visível (ligado ao campo por aria-describedby). */
  dica?: ReactNode;
  /** Elemento à direita do rótulo (ex.: "Esqueceu a senha?"). */
  acessorio?: ReactNode;
  /** Botão sobreposto à direita do campo (ex.: mostrar senha). */
  sufixo?: ReactNode;
}

export function Campo({ id, rotulo, erro, dica, acessorio, sufixo, className = "", ...resto }: PropsCampo) {
  const descritores = [dica ? `${id}-dica` : null, erro ? `${id}-erro` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-corpo text-texto">
          {rotulo}
        </label>
        {acessorio}
      </div>
      <div className="relative">
        <input
          id={id}
          className={`campo min-h-12 text-[1rem] ${sufixo ? "pr-12" : ""} ${erro ? "border-negativo/70" : ""} ${className}`}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritores}
          {...resto}
        />
        {sufixo}
      </div>
      {dica && <div id={`${id}-dica`}>{dica}</div>}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-legenda text-negativo">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Campo de senha com o controle de mostrar/ocultar (o botão anuncia o estado com aria-pressed). */
export function CampoSenha(props: Omit<PropsCampo, "type" | "sufixo">) {
  const [ver, setVer] = useState(false);
  return (
    <Campo
      {...props}
      type={ver ? "text" : "password"}
      sufixo={
        <button
          type="button"
          className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-fino text-texto-3 transition-colors duration-150 hover:text-texto"
          aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={ver}
          onClick={() => setVer((v) => !v)}
        >
          {ver ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      }
    />
  );
}

/**
 * Regras da senha nova, marcadas à medida que são cumpridas. O estado vem em texto
 * ("cumprida"/"pendente") para não depender só da cor ou do ícone.
 */
export function RegrasDaSenha({ senha }: { senha: string }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {REGRAS_SENHA.map((r) => {
        const ok = r.ok(senha);
        return (
          <li key={r.id} className={`flex items-center gap-2 text-legenda transition-colors duration-150 ${ok ? "text-positivo" : "text-texto-2"}`}>
            <span aria-hidden="true" className="grid size-4 place-items-center">
              {ok ? <Check size={14} /> : <span className="size-1.5 rounded-full bg-texto-3" />}
            </span>
            {r.texto}
            <span className="sr-only">{ok ? "(cumprida)" : "(pendente)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Botão de envio: durante a espera, mostra o progresso e não aceita um segundo clique. */
export function BotaoEnviar({ carregando, children, rotuloCarregando }: { carregando: boolean; children: ReactNode; rotuloCarregando: string }) {
  return (
    <button type="submit" className="botao botao-primario botao-grande w-full" disabled={carregando} aria-busy={carregando || undefined}>
      {carregando ? (
        <>
          <Loader2 size={18} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
          {rotuloCarregando}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Área do resultado do envio. A troca de um aviso para outro é animada (AnimatePresence com
 * `mode="wait"`: o anterior sai antes de o novo entrar), só com opacidade e 4 px de deslocamento.
 */
export function Retorno({ chave, children }: { chave: string | null; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {chave && (
        <m.div
          key={chave}
          initial={{ opacity: 0, transform: "translateY(4px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{ opacity: 0, transform: "translateY(-4px)" }}
          transition={{ duration: 0.18 }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** Cabeçalho de cada tela: título curto e uma frase de apoio. */
export function TituloAuth({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {/* tabIndex -1: recebe o foco depois de uma troca de tela (LayoutConta), sem entrar no Tab. */}
      <h1 tabIndex={-1} className="font-editorial text-[2rem] leading-tight font-medium tracking-[-0.015em] text-texto outline-none">
        {titulo}
      </h1>
      <p className="text-corpo text-texto-2">{children}</p>
    </div>
  );
}
