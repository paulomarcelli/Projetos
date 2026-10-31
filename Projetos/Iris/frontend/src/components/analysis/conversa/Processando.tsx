/**
 * O que a Iris está fazendo agora, num painel: as etapas reais emitidas pelo serviço, na ordem em que chegam, ligadas
 * por um fio. A feita fica marcada em ouro, a atual pulsa e traz uma linha do que está sendo feito, as seguintes
 * esperam. Em cima, a barra mostra quantas etapas já passaram (não é estimativa de tempo) e o relógio, há quanto
 * tempo a pergunta foi enviada. Leitores de tela ouvem só a etapa atual.
 */
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { Etapa } from "../../../types/conversa";

const ETAPAS: Record<Etapa, { nome: string; detalhe: string }> = {
  pergunta: { nome: "Lendo a pergunta e delimitando o escopo", detalhe: "Região, atores centrais e o horizonte escolhido" },
  evidencias: { nome: "Reunindo evidências e fontes", detalhe: "Documentos e dados que sustentam cada afirmação" },
  atores: { nome: "Mapeando atores e relações", detalhe: "Quem participa, com que interesses e de que lado" },
  cenarios: { nome: "Construindo os cenários prospectivos", detalhe: "Trajetórias possíveis, com premissas e sinais a observar" },
};
const ORDEM: Etapa[] = ["pergunta", "evidencias", "atores", "cenarios"];

/** segundos desde que o painel apareceu (a pergunta acabou de ser enviada) */
function useRelogio() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => setS(Math.floor((performance.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}

export function Processando({ etapas, complementar = false }: { etapas: Etapa[]; complementar?: boolean }) {
  const atual = etapas.at(-1);
  const segundos = useRelogio();
  const relogio = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

  if (complementar)
    return (
      <div className="flex items-center gap-3 rounded-painel border border-linha bg-institucional/60 px-4 py-3">
        <p role="status" aria-live="polite" className="flex items-center gap-2.5 text-legenda text-texto">
          <Pulso />
          <span className="texto-brilho">Consultando a investigação aberta</span>
        </p>
        <span className="numeros ml-auto font-dados text-micro text-texto-3" aria-hidden="true">{relogio}</span>
      </div>
    );

  const feitas = atual ? ORDEM.indexOf(atual) : 0;
  return (
    <section aria-label="Análise em andamento" className="overflow-hidden rounded-painel border border-linha bg-institucional/60">
      <p role="status" aria-live="polite" className="sr-only">
        {atual ? ETAPAS[atual].nome : "Iniciando a análise"}
      </p>
      <header className="flex items-center gap-3 px-5 pt-4 pb-3" aria-hidden="true">
        <span className="flex items-center gap-2.5 text-legenda font-medium text-texto">
          <Pulso />
          Investigando
        </span>
        <span className="numeros ml-auto font-dados text-micro text-texto-3">
          etapa {Math.min(feitas + 1, ORDEM.length)} de {ORDEM.length} · {relogio}
        </span>
      </header>
      {/* barra: as etapas que já passaram (e meia etapa da atual), só em transform */}
      <div className="mx-5 h-[3px] overflow-hidden rounded-full bg-linha" aria-hidden="true">
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-ouro/70 to-ouro transition-transform duration-700 ease-[var(--ease-saida)]"
          style={{ transform: `scaleX(${atual ? (feitas + 0.5) / ORDEM.length : 0.04})` }}
        />
      </div>

      <ol aria-hidden="true" className="relative m-0 flex list-none flex-col p-0 px-5 pt-4 pb-5">
        {ORDEM.map((e, i) => {
          const agora = e === atual;
          const feita = etapas.includes(e) && !agora;
          return (
            <li key={e} className="relative flex gap-3.5 pb-4 last:pb-0">
              {/* o fio até a próxima etapa: em ouro quando esta já passou */}
              {i < ORDEM.length - 1 && (
                <span className={`absolute top-6 bottom-0 left-[9px] w-px transition-colors duration-500 ${feita ? "bg-ouro/60" : "bg-linha"}`} />
              )}
              <span
                className={`relative z-[1] mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                  feita ? "border-ouro bg-ouro text-abismo" : agora ? "border-ouro/70 bg-abismo" : "border-linha-forte bg-abismo"
                }`}
              >
                {feita ? <Check size={12} strokeWidth={3} /> : agora ? <span className="pulso-iris size-2 rounded-full bg-ouro" /> : null}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={`text-legenda transition-colors duration-300 ${agora ? "texto-brilho font-medium text-texto" : feita ? "text-texto-2" : "text-texto-3"}`}>
                  {ETAPAS[e].nome}
                </span>
                {agora && <span className="aparecer text-micro text-texto-3">{ETAPAS[e].detalhe}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Pulso() {
  return <span className="pulso-iris size-2 rounded-full bg-ouro" />;
}
