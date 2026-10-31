/**
 * 03 Cenários prospectivos: o núcleo da investigação e a parte de maior destaque da resposta. Construídos a partir
 * do diagnóstico e das dinâmicas acima, num só painel (sem uma pilha de cartões):
 *   - o que separa os futuros (a incerteza principal) e o seletor dos cenários;
 *   - o cenário escolhido: descrição, trajetória e horizonte; premissas e condições; o que favorece e o que dificulta;
 *     consequências geopolíticas; riscos e incertezas; evidências; o que obrigaria a rever; probabilidade;
 *   - comparação das trajetórias (cada fator em cada futuro);
 *   - premissas comuns e variáveis críticas (a matriz das incertezas, onde cada cenário se posiciona).
 * Nenhuma probabilidade é inventada: só aparece se o cenário trouxer uma estimativa com método e limitações.
 */
import { Map as IconeMapa, PanelRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Esqueleto } from "../../../common/Carregando";
import type { Cenario, Efeito } from "../../../../types/cenario";
import type { Afirmacao } from "../../../../types/fonte";
import { useResultado } from "../../investigacao/contexto";
import { Citacoes, Letra } from "../../investigacao/pecas";
import { MatrizDasIncertezas } from "../../prospectiva/ComparacaoDeCenarios";
import { TabelaComparativa } from "../../prospectiva/TabelaComparativa";
import { ancora, CabecalhoDeParte, Frase } from "./partes";

const EFEITO: Record<Efeito, string> = { aproximacao: "aproximação", atrito: "atrito", misto: "efeito misto", neutro: "neutro" };

export function Prospectiva({ gerando, aoVerNoMapa }: { gerando: boolean; aoVerNoMapa: (c: Cenario) => void }) {
  const { r } = useResultado();
  const [ativo, setAtivo] = useState(r.cenarios[0]?.id ?? "A");
  const principal = r.incertezas.find((i) => i.id === r.principalIncerteza);
  const c = r.cenarios.find((x) => x.id === ativo) ?? r.cenarios[0];
  const id = ancora(r.id, "cenarios");

  return (
    <section
      id={id}
      aria-labelledby={`${id}-t`}
      aria-busy={gerando}
      className="prospectiva relative flex scroll-mt-24 flex-col gap-6 overflow-hidden rounded-[1.5rem] border border-ouro/30 bg-institucional/70 p-5 shadow-elevado sm:p-7"
    >
      {/* um halo de ouro discreto marca o núcleo da investigação */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_20%_0%,color-mix(in_srgb,var(--color-ouro)_14%,transparent),transparent)]" />
      <div className="relative flex flex-col gap-4">
        <CabecalhoDeParte rid={r.id} parte="cenarios" titulo="Cenários prospectivos">
          Futuros possíveis entre {r.horizonte.inicio} e {r.horizonte.fim}, construídos a partir do diagnóstico e das dinâmicas acima. São
          trajetórias condicionais, não previsões.
        </CabecalhoDeParte>
        {principal && (
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-legenda text-texto-2">
            <span className="text-micro font-medium text-ambar uppercase">O que separa os futuros</span>
            <span className="text-texto">{principal.pergunta}</span>
          </p>
        )}
      </div>

      {gerando ? (
        <div role="status" className="relative flex flex-col gap-3">
          <span className="sr-only">Construindo os cenários prospectivos</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Esqueleto key={i} className="h-20 rounded-padrao" />
            ))}
          </div>
          <Esqueleto className="h-40 rounded-padrao" />
        </div>
      ) : !c ? (
        <p className="relative text-legenda text-texto-2">
          Esta investigação não reuniu dados suficientes para construir cenários. O diagnóstico e as dinâmicas continuam válidos; as lacunas estão
          em "Método e limites", mais abaixo.
        </p>
      ) : (
        <>
          <Seletor ativo={c.id} aoEscolher={setAtivo} />
          <div id={`${id}-painel`} role="tabpanel" aria-labelledby={`${id}-aba-${c.id}`} className="relative">
            <Cenario c={c} aoVerNoMapa={() => aoVerNoMapa(c)} />
          </div>
          <Comparacao />
          <PremissasEVariaveis />
        </>
      )}
    </section>
  );
}

/** Os três futuros lado a lado, como abas: letra, nome, arquétipo e a ideia em uma linha. */
function Seletor({ ativo, aoEscolher }: { ativo: string; aoEscolher: (id: Cenario["id"]) => void }) {
  const { r } = useResultado();
  const id = ancora(r.id, "cenarios");
  return (
    <div role="tablist" aria-label="Cenários" className="relative grid gap-2 sm:grid-cols-3">
      {r.cenarios.map((c) => {
        const on = c.id === ativo;
        return (
          <button
            key={c.id}
            id={`${id}-aba-${c.id}`}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={`${id}-painel`}
            onClick={() => aoEscolher(c.id)}
            className={`flex flex-col gap-1.5 rounded-padrao border px-3.5 py-3 text-left transition-colors duration-150 ${
              on ? "border-ouro/60 bg-ouro/[0.07]" : "border-linha hover:border-linha-forte"
            }`}
          >
            <span className="flex items-center gap-2">
              <Letra id={c.id} ativa={on} />
              <span className="text-micro text-texto-3 uppercase">{c.arquetipo}</span>
            </span>
            <span className={`text-corpo font-medium ${on ? "text-texto" : "text-texto-2"}`}>{c.nome}</span>
            <span className="text-micro leading-snug text-texto-3">{c.ideia}</span>
          </button>
        );
      })}
    </div>
  );
}

function Cenario({ c, aoVerNoMapa }: { c: Cenario; aoVerNoMapa: () => void }) {
  const { r, ix, selecionar } = useResultado();
  const evidencias = [...new Set([...c.premissas, ...c.favoraveis, ...c.contrarias, ...c.tendencias].flatMap((a) => a.evidencias ?? []))];
  const sinais = c.indicadores.map((s) => ix.sinais.get(s)).filter((s) => s !== undefined);
  const semProbabilidade = r.limitacoes.find((l) => /probabilidade/i.test(l.texto));

  return (
    <article aria-label={`Cenário ${c.id}: ${c.nome}`} className="aparecer flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-editorial text-leitura text-texto">{c.ideia}</p>
        <p className="text-corpo leading-[1.7] text-texto-2">
          <span className="mr-1.5 text-micro font-medium text-texto-3 uppercase">Trajetória possível</span>
          {c.sintese}
        </p>
      </div>

      <Horizonte />

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <Bloco titulo="Premissas">
          <Lista itens={c.premissas} />
        </Bloco>
        <Bloco titulo="Condições para se materializar">
          <Lista itens={c.condicoes.map((t): Afirmacao => ({ tipo: "hipotese", texto: t }))} />
        </Bloco>
        <Bloco titulo="O que favorece" tom="favor">
          <Lista itens={c.favoraveis} />
        </Bloco>
        <Bloco titulo="O que dificulta" tom="contra">
          <Lista itens={c.contrarias} vazio="Nenhum fator contrário declarado." />
        </Bloco>
      </div>

      {c.consequencias.length > 0 && (
        <Bloco titulo="Consequências geopolíticas">
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {c.consequencias.map((q, i) => (
              <li key={i} className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[10rem_1fr]">
                <span className="flex items-baseline gap-2 text-texto">
                  {q.regiao}
                  <span className="text-micro text-texto-3">{EFEITO[q.efeito]}</span>
                </span>
                <span>{q.texto}</span>
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        <Bloco titulo="Riscos e incertezas" tom="risco">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {c.gatilhos.map((t, i) => (
              <li key={`g${i}`}>
                <span className="mr-1.5 text-micro text-ambar uppercase">Gatilho</span>
                {t}
              </li>
            ))}
            {c.incertezas.map((t, i) => (
              <li key={`i${i}`}>
                <span className="mr-1.5 text-micro text-texto-3 uppercase">Incerteza</span>
                {t}
              </li>
            ))}
            {c.limitacoes.map((t, i) => (
              <li key={`l${i}`} className="text-texto-3">
                <span className="mr-1.5 text-micro uppercase">Limite</span>
                {t}
              </li>
            ))}
          </ul>
        </Bloco>
        <Bloco titulo="O que obrigaria a rever este cenário">
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-4 marker:text-texto-3">
            {c.revisao.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Bloco>
      </div>

      <div className="flex flex-col gap-3 border-t border-linha pt-4 text-legenda text-texto-2">
        {evidencias.length > 0 && (
          <p>
            <span className="mr-1.5 text-micro font-medium text-texto-3 uppercase">Evidências relacionadas</span>
            {evidencias.length} {evidencias.length === 1 ? "evidência" : "evidências"} <Citacoes ids={evidencias} />
            {sinais.length > 0 && <span className="text-texto-3"> · {sinais.length} indicadores a acompanhar, em Monitoramento</span>}
          </p>
        )}
        <p>
          <span className="mr-1.5 text-micro font-medium text-texto-3 uppercase">Probabilidade</span>
          {c.estimativa ? (
            <>
              <span className="text-texto">{c.estimativa.valor}</span> · método: {c.estimativa.metodo}. <span className="text-texto-3">Limites: {c.estimativa.limitacoes}</span>
            </>
          ) : semProbabilidade ? (
            semProbabilidade.texto
          ) : (
            "nenhuma probabilidade é atribuída: esta investigação não tem método nem dados para estimá-la."
          )}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={aoVerNoMapa} className="botao botao-secundario botao-pequeno">
            <IconeMapa size={14} aria-hidden="true" />
            Ver este cenário no mapa
          </button>
          <button type="button" onClick={() => selecionar({ tipo: "cenario", id: c.id })} className="botao botao-fantasma botao-pequeno">
            <PanelRight size={14} aria-hidden="true" />
            Detalhe completo
          </button>
        </div>
      </div>
    </article>
  );
}

/** O horizonte em fases (curto, médio, longo prazo), do início ao fim da investigação. */
function Horizonte() {
  const { r } = useResultado();
  const total = r.horizonte.fim - r.horizonte.inicio + 1;
  const fases = r.horizontes.length ? r.horizontes : [{ id: "todo", nome: "Horizonte", inicio: r.horizonte.inicio, fim: r.horizonte.fim }];
  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <figcaption className="text-micro font-medium text-texto-3 uppercase">
        Horizonte temporal · {r.horizonte.inicio}–{r.horizonte.fim}
      </figcaption>
      <div className="flex gap-1">
        {fases.map((h, i) => (
          <div key={h.id} className="flex min-w-0 flex-col gap-1" style={{ flex: `${h.fim - h.inicio + 1} 1 0` }}>
            <span className="h-1.5 rounded-full" style={{ background: `color-mix(in srgb, var(--color-ouro) ${30 + (i * 50) / Math.max(1, fases.length - 1)}%, transparent)` }} />
            <span className="truncate text-micro text-texto-3">
              {h.nome} <span className="numeros font-dados">{h.inicio === h.fim ? h.inicio : `${h.inicio}–${h.fim}`}</span>
            </span>
          </div>
        ))}
      </div>
      <span className="sr-only">{total} anos</span>
    </figure>
  );
}

/** Comparação das trajetórias: cada fator em cada futuro, mais o impacto principal e o gatilho. */
function Comparacao() {
  const { r } = useResultado();
  const linhas = [
    { rotulo: "Impacto principal", valor: (c: Cenario) => c.impacto },
    ...r.variaveis.map((v) => ({ rotulo: v.nome, valor: (c: Cenario) => v.direcao[c.id] })),
    { rotulo: "Gatilho", valor: (c: Cenario) => c.gatilhos.join("; ") },
  ];
  return (
    <Subparte titulo="Comparação das trajetórias" nota="Como cada fator se move em cada futuro. Comparação qualitativa: sem notas nem pesos.">
      <TabelaComparativa linhas={linhas} legenda="Direção de cada fator em cada cenário" />
    </Subparte>
  );
}

/** As premissas comuns aos três futuros e as variáveis críticas: onde cada cenário fica em cada incerteza. */
function PremissasEVariaveis() {
  const { r } = useResultado();
  return (
    <Subparte titulo="Premissas e variáveis críticas" nota="As premissas valem para todos os cenários; as incertezas críticas são o que os separa.">
      {r.premissas.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-legenda leading-relaxed text-texto-2">
          {r.premissas.map((a, i) => (
            <Frase key={i} a={a} como="li" />
          ))}
        </ul>
      )}
      {r.incertezas.length > 0 && <MatrizDasIncertezas />}
    </Subparte>
  );
}

function Subparte({ titulo, nota, children }: { titulo: string; nota: string; children: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-4 border-t border-linha pt-6">
      <div className="flex flex-col gap-1">
        <h4 className="text-leitura font-medium text-texto">{titulo}</h4>
        <p className="text-legenda text-texto-3">{nota}</p>
      </div>
      {children}
    </div>
  );
}

function Bloco({ titulo, tom, children }: { titulo: string; tom?: "favor" | "contra" | "risco"; children: ReactNode }) {
  const marca = tom === "favor" ? "bg-ciano" : tom === "contra" ? "bg-texto-3" : tom === "risco" ? "bg-ambar" : "bg-linha-forte";
  return (
    <div className="flex flex-col gap-2">
      <h5 className="flex items-center gap-2 text-micro font-medium text-texto-3 uppercase">
        <span aria-hidden="true" className={`size-1.5 rounded-full ${marca}`} />
        {titulo}
      </h5>
      <div className="text-legenda leading-relaxed text-texto-2">{children}</div>
    </div>
  );
}

function Lista({ itens, vazio }: { itens: Afirmacao[]; vazio?: string }) {
  if (!itens.length) return vazio ? <p className="text-texto-3">{vazio}</p> : null;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {itens.map((a, i) => (
        <Frase key={i} a={a} como="li" />
      ))}
    </ul>
  );
}
