import { Check, ChevronDown, Circle, Coins, Cpu, Handshake, Shield, Ship, SlidersHorizontal, Zap, type LucideIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useId, useState } from "react";
import { NOME_REGIAO, type RegiaoId } from "../../relations/geo/regioes-def";
import { useRascunhos, type Horizonte, type Profundidade, type Rascunho } from "../../../hooks/useArmazenamentoLocal";
import { CRITERIOS, EXEMPLOS } from "./pergunta";
import { useSearchParams } from "react-router";
import { Epistemico } from "../../common/Epistemico";
import { LinhaHorizonte } from "./LinhaHorizonte";
import { useNotificar } from "../../../app/provedores/ProvedorDeNotificacoes";

// O mapa traz a geometria dos países (~100 kB): carrega só quando o formulário aparece.
const MapaEscopo = lazy(() => import("./MapaEscopo").then((m) => ({ default: m.MapaEscopo })));


/** Número do passo + rótulo: a ordem do formulário vista de relance (1 pergunta, 2 horizonte…). */
function Passo({ n, children, opcional = false }: { n: number; children: string; opcional?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden="true" className="numeros grid size-6 place-items-center rounded-full border border-linha-forte text-micro text-texto-2">
        {n}
      </span>
      <span className="text-corpo font-medium text-texto">{children}</span>
      {opcional && <span className="text-micro text-texto-3">opcional</span>}
    </span>
  );
}

const HORIZONTES: Horizonte[] = [1, 3, 5, 10, 25];

const DIMENSOES: { id: string; rotulo: string; icone: LucideIcon }[] = [
  { id: "diplomacia", rotulo: "Diplomacia", icone: Handshake },
  { id: "economia", rotulo: "Economia", icone: Coins },
  { id: "seguranca", rotulo: "Segurança", icone: Shield },
  { id: "comercio", rotulo: "Comércio", icone: Ship },
  { id: "tecnologia", rotulo: "Tecnologia", icone: Cpu },
  { id: "energia", rotulo: "Energia", icone: Zap },
];

const PROFUNDIDADES: { id: Profundidade; rotulo: string; descricao: string }[] = [
  { id: "exploratoria", rotulo: "Exploratória", descricao: "Primeira leitura: mapear atores, questões e fontes iniciais." },
  { id: "padrao", rotulo: "Padrão", descricao: "Equilíbrio entre amplitude de fontes e profundidade de análise." },
  { id: "aprofundada", rotulo: "Aprofundada", descricao: "Mais fontes e mais etapas de verificação; leva mais tempo." },
];

const MINIMO = 15;

/**
 * Ponto de entrada da plataforma. O motor de investigação ainda não existe no backend: o
 * formulário guarda a pergunta e a configuração como RASCUNHO neste navegador, e diz isso.
 * Por isso não há estado de "processando": não existe processamento real para mostrar.
 *
 * Revelação progressiva: a pergunta e o horizonte (o que toda investigação precisa) ficam à
 * vista; escopo geográfico, dimensões e profundidade, que já têm valores padrão, ficam atrás de
 * "Ajustar parâmetros", com um resumo do que está valendo. O mapa de escopo (~100 kB) só carrega
 * quando esse bloco abre.
 */
export function NovaInvestigacao({ rascunho }: { rascunho?: Rascunho | null }) {
  const notificar = useNotificar();
  const { salvar } = useRascunhos();
  const id = useId();
  const [editando, setEditando] = useState<string | undefined>(rascunho?.id);
  // A landing pode trazer uma pergunta já escrita (/app?pergunta=…): ela entra no campo, sem salvar.
  const [params] = useSearchParams();
  const [pergunta, setPergunta] = useState(rascunho?.pergunta ?? params.get("pergunta")?.slice(0, 600) ?? "");
  const [horizonte, setHorizonte] = useState<Horizonte>(rascunho?.horizonte ?? 5);
  const [regioes, setRegioes] = useState<RegiaoId[]>((rascunho?.regioes as RegiaoId[]) ?? []);
  const [dimensoes, setDimensoes] = useState<string[]>(rascunho?.dimensoes ?? ["diplomacia", "economia"]);
  const [profundidade, setProfundidade] = useState<Profundidade>(rascunho?.profundidade ?? "padrao");
  const [erro, setErro] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState(false);

  useEffect(() => {
    if (!rascunho) return;
    setEditando(rascunho.id);
    setPergunta(rascunho.pergunta);
    setHorizonte(rascunho.horizonte);
    setRegioes(rascunho.regioes as RegiaoId[]);
    setDimensoes(rascunho.dimensoes);
    setProfundidade(rascunho.profundidade);
    setErro(null);
    // Ao editar um rascunho, os parâmetros ficam abertos: quem volta costuma querer revê-los.
    setAjustes(true);
  }, [rascunho]);

  const anoFinal = new Date().getFullYear() + horizonte;
  const escopo = regioes.length === 0 ? "escopo global" : regioes.map((r) => NOME_REGIAO[r]).join(", ");

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const texto = pergunta.trim();
    if (texto.length < MINIMO) {
      setErro(`Escreva a pergunta completa (pelo menos ${MINIMO} caracteres).`);
      document.getElementById(`${id}-pergunta`)?.focus();
      return;
    }
    if (dimensoes.length === 0) {
      setErro("Escolha pelo menos uma dimensão de análise.");
      setAjustes(true);
      return;
    }
    setErro(null);
    const { rascunho: salvo, gravado } = salvar({ id: editando, pergunta: texto, horizonte, regioes, dimensoes, profundidade });
    setEditando(salvo.id);
    if (gravado) notificar("sucesso", "Rascunho de investigação salvo neste navegador.");
    else notificar("erro", "Não foi possível salvar: o armazenamento do navegador está bloqueado.");
  };

  const limpar = () => {
    setEditando(undefined);
    setPergunta("");
    setRegioes([]);
    setDimensoes(["diplomacia", "economia"]);
    setHorizonte(5);
    setProfundidade("padrao");
    setErro(null);
  };

  return (
    <form onSubmit={enviar} noValidate className="painel overflow-hidden" aria-labelledby={`${id}-titulo`}>
      <div className="border-b border-linha p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id={`${id}-titulo`} className="font-editorial text-secao text-texto">
            {editando ? "Editar investigação" : "Nova investigação"}
          </h2>
          <span className="text-micro text-texto-3">3 passos · só a pergunta é obrigatória</span>
        </div>
        <label htmlFor={`${id}-pergunta`} className="mb-3 block">
          <Passo n={1}>Qual questão internacional você quer investigar?</Passo>
        </label>
        <textarea
          id={`${id}-pergunta`}
          rows={3}
          maxLength={600}
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Escreva a pergunta como a faria a um especialista…"
          onKeyDown={(e) => {
            // Atalho de quem usa teclado o tempo todo: Ctrl/⌘ + Enter salva sem tirar a mão.
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          aria-invalid={erro?.startsWith("Escreva") || undefined}
          aria-describedby={`${id}-ajuda`}
          className="campo resize-y font-editorial text-leitura leading-relaxed"
        />
        <div id={`${id}-ajuda`} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-micro text-texto-3">
          <span>Linguagem natural. Ctrl ou ⌘ + Enter salva.</span>
          <span className="numeros">{pergunta.length}/600</span>
        </div>

        {/* Sem texto: perguntas de partida. Com texto: o lembrete do que faz uma boa pergunta. */}
        {!pergunta ? (
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-micro text-texto-3">Ou comece por uma destas</span>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {EXEMPLOS.map((x) => (
                <li key={x}>
                  <button
                    type="button"
                    onClick={() => {
                      setPergunta(x);
                      document.getElementById(`${id}-pergunta`)?.focus();
                    }}
                    className="group flex w-full items-start gap-2 rounded-padrao border border-linha px-3 py-2 text-left text-legenda text-texto-2 transition-colors duration-150 hover:border-ciano/40 hover:bg-ciano-suave hover:text-texto"
                  >
                    <span aria-hidden="true" className="text-texto-3 transition-colors group-hover:text-ciano-texto">
                      →
                    </span>
                    {x}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2" aria-live="polite">
            <span className="text-micro text-texto-3">Uma boa pergunta costuma ter (checagem simples por palavras, não é análise):</span>
            <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
              {CRITERIOS.map((c) => {
                const ok = c.ok(pergunta);
                return (
                  <li key={c.id} className={`flex items-start gap-2 rounded-padrao border px-3 py-2 transition-colors duration-200 ${ok ? "border-positivo/30 bg-positivo-suave" : "border-linha"}`}>
                    {ok ? (
                      <Check size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-positivo" />
                    ) : (
                      <Circle size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-texto-3" />
                    )}
                    <span className="flex flex-col">
                      <span className="text-legenda text-texto">
                        {c.rotulo}
                        <span className="sr-only">{ok ? ": encontrado" : ": não encontrado"}</span>
                      </span>
                      <span className="text-micro text-texto-3">{c.dica}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <fieldset className="m-0 min-w-0 border-0 border-b border-linha p-5 sm:p-6">
        <legend className="sr-only">Horizonte temporal</legend>
        <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-8">
          <div>
            <p className="mb-3" aria-hidden="true">
              <Passo n={2}>Até quando olhar?</Passo>
            </p>
            <div role="radiogroup" aria-label="Horizonte temporal" className="flex flex-wrap gap-2">
              {HORIZONTES.map((h) => (
                <button key={h} type="button" role="radio" aria-checked={horizonte === h} className="ficha numeros" onClick={() => setHorizonte(h)}>
                  {h} {h === 1 ? "ano" : "anos"}
                </button>
              ))}
            </div>
          </div>
          <LinhaHorizonte anos={horizonte} />
        </div>
      </fieldset>

      <div className="border-b border-linha">
        <button
          type="button"
          aria-expanded={ajustes}
          aria-controls={`${id}-ajustes`}
          onClick={() => setAjustes((x) => !x)}
          className="flex min-h-12 w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-left transition-colors duration-150 hover:bg-grafite/50 sm:px-6"
        >
          <span aria-hidden="true" className="numeros grid size-6 place-items-center rounded-full border border-linha-forte text-micro text-texto-2">
            3
          </span>
          <span className="text-corpo font-medium text-texto">Escopo e dimensões</span>
          <SlidersHorizontal size={14} aria-hidden="true" className="text-texto-3" />
          {/* No celular o resumo desce para a própria linha; no desktop fica entre o rótulo e a seta. */}
          <ChevronDown size={16} aria-hidden="true" className={`ml-auto shrink-0 text-texto-3 transition-transform duration-200 sm:order-last ${ajustes ? "rotate-180" : ""}`} />
          <span className="order-last basis-full pl-7 text-legenda text-texto-2 sm:order-none sm:min-w-0 sm:flex-1 sm:basis-auto sm:pl-0">
            {escopo} · {dimensoes.length === 1 ? "1 dimensão" : `${dimensoes.length} dimensões`} · profundidade {PROFUNDIDADES.find((p) => p.id === profundidade)?.rotulo.toLowerCase()}
          </span>
        </button>

        {ajustes && (
          <div id={`${id}-ajustes`} className="grid gap-0 border-t border-linha lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <fieldset className="m-0 min-w-0 border-0 border-b border-linha p-5 sm:p-6 lg:border-r lg:border-b-0">
              <legend className="sr-only">Escopo geográfico</legend>
              <p className="rotulo mb-3" aria-hidden="true">
                Escopo geográfico
              </p>
              <Suspense fallback={<div className="esqueleto aspect-[960/470] w-full rounded-padrao" role="status" aria-label="Carregando o mapa" />}>
                <MapaEscopo selecionadas={regioes} aoMudar={setRegioes} />
              </Suspense>
            </fieldset>

            <div className="flex min-w-0 flex-col">
              <fieldset className="m-0 border-0 border-b border-linha p-5 sm:p-6">
                <legend className="sr-only">Dimensões de análise</legend>
                <p className="rotulo mb-3" aria-hidden="true">
                  Dimensões de análise
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Dimensões de análise">
                  {DIMENSOES.map(({ id: d, rotulo, icone: Icone }) => (
                    <button
                      key={d}
                      type="button"
                      className="ficha"
                      aria-pressed={dimensoes.includes(d)}
                      onClick={() => setDimensoes((atual) => (atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d]))}
                    >
                      <Icone size={14} strokeWidth={1.7} aria-hidden="true" />
                      {rotulo}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="m-0 border-0 p-5 sm:p-6">
                <legend className="sr-only">Profundidade da investigação</legend>
                <p className="rotulo mb-3" aria-hidden="true">
                  Profundidade
                </p>
                <div role="radiogroup" aria-label="Profundidade da investigação" className="mb-2 flex flex-wrap gap-2">
                  {PROFUNDIDADES.map((p) => (
                    <button key={p.id} type="button" role="radio" aria-checked={profundidade === p.id} className="ficha" onClick={() => setProfundidade(p.id)}>
                      {p.rotulo}
                    </button>
                  ))}
                </div>
                <p className="text-legenda text-texto-2">{PROFUNDIDADES.find((p) => p.id === profundidade)?.descricao}</p>
              </fieldset>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 bg-abismo/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 space-y-1.5">
          {/* Resumo do que será investigado: a confirmação de tudo o que foi escolhido acima. */}
          <p className="text-legenda text-texto-2">
            Até <span className="numeros text-ambar">{anoFinal}</span> · {escopo} · {dimensoes.length === 1 ? "1 dimensão" : `${dimensoes.length} dimensões`}
          </p>
          <Epistemico tipo="limitacao" rotulo="O motor de investigação ainda não existe: a pergunta fica salva como rascunho neste navegador." />
          {erro && (
            <p role="alert" className="text-legenda text-negativo">
              {erro}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {(editando || pergunta) && (
            <button type="button" className="botao botao-fantasma" onClick={limpar}>
              Limpar
            </button>
          )}
          <button type="submit" className="botao botao-primario">
            {editando ? "Atualizar rascunho" : "Salvar rascunho da investigação"}
          </button>
        </div>
      </div>
    </form>
  );
}
