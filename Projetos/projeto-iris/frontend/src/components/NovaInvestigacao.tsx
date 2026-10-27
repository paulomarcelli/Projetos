import { Coins, Cpu, Handshake, Shield, Ship, Zap, type LucideIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useId, useState } from "react";
import { NOME_REGIAO, type RegiaoId } from "../geo/regioes-def";
import { useRascunhos, type Horizonte, type Profundidade, type Rascunho } from "../lib/local";
import { Epistemico } from "./Epistemico";
import { LinhaHorizonte } from "./LinhaHorizonte";
import { useNotificar } from "./Notificacoes";

// O mapa traz a geometria dos países (~100 kB): carrega só quando o formulário aparece.
const MapaEscopo = lazy(() => import("./MapaEscopo").then((m) => ({ default: m.MapaEscopo })));

const EXEMPLO =
  "Como uma mudança na política externa brasileira pode afetar a ordem internacional nos próximos cinco anos?";

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
 */
export function NovaInvestigacao({ rascunho }: { rascunho?: Rascunho | null }) {
  const notificar = useNotificar();
  const { salvar } = useRascunhos();
  const id = useId();
  const [editando, setEditando] = useState<string | undefined>(rascunho?.id);
  const [pergunta, setPergunta] = useState(rascunho?.pergunta ?? "");
  const [horizonte, setHorizonte] = useState<Horizonte>(rascunho?.horizonte ?? 5);
  const [regioes, setRegioes] = useState<RegiaoId[]>((rascunho?.regioes as RegiaoId[]) ?? []);
  const [dimensoes, setDimensoes] = useState<string[]>(rascunho?.dimensoes ?? ["diplomacia", "economia"]);
  const [profundidade, setProfundidade] = useState<Profundidade>(rascunho?.profundidade ?? "padrao");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!rascunho) return;
    setEditando(rascunho.id);
    setPergunta(rascunho.pergunta);
    setHorizonte(rascunho.horizonte);
    setRegioes(rascunho.regioes as RegiaoId[]);
    setDimensoes(rascunho.dimensoes);
    setProfundidade(rascunho.profundidade);
    setErro(null);
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${id}-titulo`} className="font-editorial text-secao text-texto">
            {editando ? "Editar investigação" : "Nova investigação"}
          </h2>
          <Epistemico tipo="hipotese" rotulo="Toda investigação começa como pergunta" />
        </div>
        <label htmlFor={`${id}-pergunta`} className="mb-2 block text-legenda text-texto-2">
          Qual questão internacional você quer investigar?
        </label>
        <textarea
          id={`${id}-pergunta`}
          rows={3}
          maxLength={600}
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder={EXEMPLO}
          aria-invalid={erro?.startsWith("Escreva") || undefined}
          aria-describedby={`${id}-ajuda`}
          className="campo resize-y font-editorial text-leitura leading-relaxed"
        />
        <div id={`${id}-ajuda`} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-micro text-texto-3">
          <span>Formule em linguagem natural: atores, mudança e efeito que interessam.</span>
          <span className="numeros">{pergunta.length}/600</span>
        </div>
        {!pergunta && (
          <button type="button" className="mt-2 text-legenda text-ciano-texto underline-offset-4 hover:underline" onClick={() => setPergunta(EXEMPLO)}>
            Usar a pergunta de exemplo
          </button>
        )}
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
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
            <legend className="sr-only">Horizonte temporal</legend>
            <p className="rotulo mb-3" aria-hidden="true">
              Horizonte temporal
            </p>
            <div role="radiogroup" aria-label="Horizonte temporal" className="mb-4 flex flex-wrap gap-2">
              {HORIZONTES.map((h) => (
                <button key={h} type="button" role="radio" aria-checked={horizonte === h} className="ficha numeros" onClick={() => setHorizonte(h)}>
                  {h} {h === 1 ? "ano" : "anos"}
                </button>
              ))}
            </div>
            <LinhaHorizonte anos={horizonte} />
          </fieldset>

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

      <div className="flex flex-col gap-4 border-t border-linha bg-abismo/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 space-y-1.5">
          <p className="text-legenda text-texto-2">
            Horizonte <span className="numeros text-ambar">{anoFinal}</span> · {escopo} ·{" "}
            {dimensoes.length === 1 ? "1 dimensão" : `${dimensoes.length} dimensões`}
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
