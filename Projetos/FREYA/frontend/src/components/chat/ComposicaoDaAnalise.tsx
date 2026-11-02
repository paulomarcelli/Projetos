import { ArrowUp, ArrowUpRight, Clock3, Info, Sparkles } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { rotas } from "../../config/rotas";
import { usePreferencias } from "../../contexts/Preferencias";
import { comoErroDaApi, mensagemDoErro } from "../../hooks";
import { criarInvestigacao } from "../../services";
import { PainelVidro } from "../layout";
import { AvisoDeErro, BotaoIcone, CampoTexto, cx } from "../ui";
import { iniciais } from "../sidebar/itens";
import { EXEMPLOS, HORIZONTES } from "./exemplos";

export interface ComposicaoDaAnaliseProps {
  /** "painel" no dashboard; "pagina" em /analises/nova (mais exemplos e o passo a passo) */
  variante?: "painel" | "pagina";
  /** valores iniciais (ex.: "Tentar de novo" de uma análise que falhou) */
  questaoInicial?: string;
  horizonteInicial?: string;
  /** título do painel (h2); padrão "Nova análise" */
  titulo?: string;
  className?: string;
}

/**
 * O ponto de entrada da análise prospectiva (o "New Chat" da referência): saudação, exemplos, horizonte
 * e o campo em pílula. Enviar cria a investigação (POST /investigacoes) e abre a página dela.
 */
export function ComposicaoDaAnalise({ variante = "painel", questaoInicial = "", horizonteInicial = "", titulo = "Nova análise", className }: ComposicaoDaAnaliseProps) {
  const { perfil } = usePreferencias();
  const navegar = useNavigate();
  const idForm = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [questao, setQuestao] = useState(questaoInicial);
  const [horizonte, setHorizonte] = useState(horizonteInicial);
  const [enviando, setEnviando] = useState(false);
  const [erroQuestao, setErroQuestao] = useState<string | null>(null);
  const [erroHorizonte, setErroHorizonte] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<unknown>(null);
  const pagina = variante === "pagina";
  const exemplos = pagina ? EXEMPLOS : EXEMPLOS.slice(0, 3);
  const nome = perfil.nome.trim().split(/\s+/)[0] || "analista";

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const q = questao.trim();
    setErroGeral(null);
    setErroHorizonte(null);
    if (!q) {
      setErroQuestao("Escreva a questão que você quer investigar.");
      campo.current?.focus();
      return;
    }
    setErroQuestao(null);
    setEnviando(true);
    try {
      const criada = await criarInvestigacao(q, horizonte);
      navegar(rotas.analise(criada.id));
    } catch (err) {
      const erro = comoErroDaApi(err);
      setEnviando(false);
      if (erro.tipo === "invalido") {
        if (/horizonte/i.test(erro.message) && !/quest/i.test(erro.message)) setErroHorizonte(erro.message);
        else {
          setErroQuestao(erro.message);
          campo.current?.focus();
        }
      } else setErroGeral(erro);
    }
  }

  function usarExemplo(q: string, h?: string) {
    setQuestao(q);
    if (h !== undefined) setHorizonte(h);
    setErroQuestao(null);
    campo.current?.focus();
  }

  const msg = erroGeral ? mensagemDoErro(erroGeral, "a nova análise") : null;

  const rodape = (
    <form id={idForm} onSubmit={enviar} noValidate className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <CampoTexto
          ref={campo}
          rotulo="Questão prospectiva"
          rotuloOculto
          classeDoGrupo="flex-1 min-w-0 [&_.fr-campo-caixa]:rounded-full [&_.fr-campo-caixa]:min-h-14 [&_.fr-campo-caixa]:pl-2"
          placeholder="Pergunte sobre o futuro de algo no MCU…"
          value={questao}
          onChange={(e) => {
            setQuestao(e.target.value);
            if (erroQuestao) setErroQuestao(null);
          }}
          erro={erroQuestao ?? undefined}
          maxLength={500}
          autoComplete="off"
          enterKeyHint="send"
        />
        <BotaoIcone type="submit" rotulo={enviando ? "Criando a análise" : "Analisar"} variante="solido" tamanho="grande" disabled={enviando} aria-busy={enviando || undefined} className="mb-0.5 shrink-0 self-start">
          {enviando ? <span className="fr-botao-giro" /> : <ArrowUp size={20} />}
        </BotaoIcone>
      </div>
    </form>
  );

  return (
    <PainelVidro
      titulo={titulo}
      inicio={
        <span className="grid size-11 place-items-center rounded-full border border-vidro-borda bg-vidro-forte text-escarlate shadow-baixa" aria-hidden="true">
          <Sparkles size={18} />
        </span>
      }
      rodape={rodape}
      className={className}
    >
      <div className={cx("flex flex-col gap-7", pagina && "mx-auto max-w-3xl")}>
        <div className="flex items-center gap-4 sm:gap-5">
          <span className="fr-avatar size-16! shrink-0 text-xl! sm:size-20! sm:text-2xl!" aria-hidden="true">
            {iniciais(perfil.nome)}
          </span>
          <p className="text-2xl leading-tight sm:text-3xl">
            <span className="block font-light">Olá, {nome}!</span>
            <span className="block font-semibold">O que vamos investigar?</span>
          </p>
        </div>

        <p className="max-w-prose text-sm leading-relaxed text-texto-suave">
          A resposta não é uma conversa: é uma <strong className="font-medium text-texto">análise prospectiva</strong> estruturada, com contexto, atores, incertezas,
          cenários e consequências, cada afirmação marcada como confirmada, inferida ou hipotética e ligada às suas fontes.
        </p>

        {msg && <AvisoDeErro titulo={msg.titulo} texto={msg.texto} />}

        <div>
          <p className="mb-3 text-xs font-medium text-texto-fraco">Comece por um exemplo</p>
          <ul className={cx("grid gap-3", pagina ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
            {exemplos.map((ex) => (
              <li key={ex.questao}>
                <button
                  type="button"
                  className="group flex h-full w-full flex-col justify-between gap-4 rounded-3xl border border-vidro-borda bg-vidro-forte p-4 text-left shadow-baixa transition-[border-color,transform] duration-150 ease-out active:scale-[0.98] passar:border-borda-forte"
                  onClick={() => usarExemplo(ex.questao, ex.horizonte)}
                >
                  <span className="text-sm leading-snug font-medium text-texto">{ex.questao}</span>
                  <span className="flex items-center justify-between gap-2 text-xs text-texto-fraco">
                    <span className="truncate">{ex.horizonte ?? ex.tema}</span>
                    <ArrowUpRight aria-hidden="true" size={14} className="shrink-0 transition-colors duration-150 group-hover:text-escarlate" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <CampoTexto
            form={idForm}
            rotulo="Horizonte (opcional)"
            dica={erroHorizonte ? undefined : "A partir de quando olhar para o futuro, na linha do tempo do MCU."}
            erro={erroHorizonte ?? undefined}
            prefixo={<Clock3 size={16} />}
            placeholder="ex.: após Avengers: Endgame"
            value={horizonte}
            onChange={(e) => setHorizonte(e.target.value)}
            maxLength={200}
            autoComplete="off"
          />
          {pagina && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Sugestões de horizonte">
              {HORIZONTES.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    aria-pressed={horizonte === h}
                    className={cx(
                      "h-8 rounded-full border px-3 text-xs font-medium transition-[background-color,border-color,color] duration-150",
                      horizonte === h ? "border-escarlate bg-escarlate-tinta text-escarlate-forte" : "border-borda-forte bg-superficie text-texto-suave passar:text-texto",
                    )}
                    onClick={() => setHorizonte(horizonte === h ? "" : h)}
                  >
                    {h}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pagina && (
          <ol className="grid gap-3 sm:grid-cols-3" aria-label="O que acontece depois de enviar">
            {[
              ["Recuperação", "Trechos da base e o subgrafo das entidades da questão."],
              ["Análise", "Contexto, atores, incertezas e cenários, citando evidências."],
              ["Validação", "Cada afirmação conferida contra as fontes. Cerca de um minuto no total."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-borda bg-superficie/60 p-4">
                <p className="text-xs text-texto-fraco fr-numeros">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 text-sm font-semibold">{t}</p>
                <p className="mt-1 text-xs text-texto-suave">{d}</p>
              </li>
            ))}
          </ol>
        )}

        <p className="flex items-start gap-2 text-xs text-texto-fraco">
          <Info aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
          <span>
            A base cobre a continuidade dos filmes e séries do MCU. Uma questão fora dela é analisada mesmo assim, mas volta com pouca sustentação, e a análise diz isso.
          </span>
        </p>
      </div>
    </PainelVidro>
  );
}
