/**
 * Linha do tempo da investigação, dentro da área Cenários.
 *
 * O eixo é o HORIZONTE configurado na investigação: os períodos vêm de `r.horizontes` e o
 * divisor "Hoje" fica em `r.horizonte.inicio` (o primeiro ano projetado). Nenhuma data ou marco é
 * fixado no código. Antes do divisor, só eventos comuns a todos os futuros (passado documentado);
 * depois, os eventos comuns e os do cenário em vista. O futuro tem traço tracejado âmbar e texto
 * em itálico, para nunca parecer fato.
 *
 * Controles: um seletor de cenário (o mesmo estado do mapa e dos cartões) e um seletor de período
 * do horizonte. O período é estado local: só esta visualização é temporal.
 */
import { useState } from "react";
import type { CenarioId } from "../../types/cenario";
import type { EventoTempo, Horizonte } from "../../types/evento";
import { useResultado } from "../analysis/investigacao/contexto";
import { CATEGORIA, GlifoTempo, Letra } from "../analysis/investigacao/pecas";

const faixaDe = (inicio: number, fim: number) => (inicio === fim ? String(inicio) : `${inicio}–${fim}`);

function Evento({ ev, futuro }: { ev: EventoTempo; futuro: boolean }) {
  const { selecao, selecionar } = useResultado();
  const ativo = selecao?.tipo === "evento" && selecao.id === ev.id;
  return (
    <li className="relative pl-8">
      <span aria-hidden="true" className="absolute top-3 left-[7px] grid size-4 place-items-center rounded-full bg-abismo">
        <GlifoTempo c={ev.categoria} tamanho={14} />
      </span>
      <button
        type="button"
        onClick={() => selecionar({ tipo: "evento", id: ev.id })}
        aria-pressed={ativo}
        className={`flex w-full min-w-0 flex-col gap-0.5 rounded-padrao px-3 py-2 text-left transition-colors duration-150 ${
          ativo ? "bg-ciano-suave outline-1 outline-ciano/50" : "hover:bg-grafite"
        }`}
      >
        <span className="flex flex-wrap items-center gap-x-2 text-micro text-texto-3">
          <span className="font-dados text-texto-2">{ev.data}</span>
          <span className="sr-only">{CATEGORIA[ev.categoria].rotulo}.</span>
          {ev.inflexao && <span className="text-ambar">ponto de inflexão</span>}
          {ev.agendado && <span>agendado</span>}
        </span>
        <span className={`text-corpo ${futuro ? "text-texto-2 italic" : "text-texto"}`}>{ev.texto}</span>
      </button>
    </li>
  );
}

function Trecho({ titulo, faixa, eventos, futuro = false }: { titulo: string; faixa: string; eventos: EventoTempo[]; futuro?: boolean }) {
  if (eventos.length === 0) return null;
  return (
    <section aria-label={`${titulo}, ${faixa}`} className="flex flex-col gap-1">
      <p className="flex items-baseline gap-2 pl-8">
        <span className="rotulo">{titulo}</span>
        <span className="numeros font-dados text-micro text-texto-3">{faixa}</span>
      </p>
      <ol
        className={`relative m-0 flex list-none flex-col gap-0.5 p-0 before:absolute before:top-2 before:bottom-2 before:left-[14px] before:w-0 before:border-l ${
          futuro ? "before:border-dashed before:border-ambar/50" : "before:border-linha-forte"
        }`}
      >
        {eventos.map((ev) => (
          <Evento key={ev.id} ev={ev} futuro={futuro} />
        ))}
      </ol>
    </section>
  );
}

export function LinhaDoTempo() {
  const { r, vista, setVista } = useResultado();
  const [periodo, setPeriodo] = useState<string | null>(null);
  const cenario: CenarioId = vista === "presente" ? r.cenarios[0].id : vista;
  const c = r.cenarios.find((x) => x.id === cenario)!;
  const inicioFuturo = r.horizonte.inicio;

  const passado = r.linhaDoTempo.filter((e) => e.ano < inicioFuturo && !e.cenarios);
  const futuro = r.linhaDoTempo.filter((e) => e.ano >= inicioFuturo && (!e.cenarios || e.cenarios.includes(cenario)));
  const periodosPassados = r.horizontes.filter((h) => h.fim < inicioFuturo);
  const periodosFuturos = r.horizontes.filter((h) => h.inicio >= inicioFuturo);
  // Eventos passados fora de qualquer período declarado não somem: vão para um grupo cuja faixa
  // é calculada a partir dos próprios anos.
  const soltos = passado.filter((e) => !periodosPassados.some((h) => e.ano >= h.inicio && e.ano <= h.fim));
  const anosSoltos = soltos.map((e) => e.ano);
  const selecionado: Horizonte | undefined = periodosFuturos.find((h) => h.id === periodo);
  const visiveis = selecionado ? [selecionado] : periodosFuturos;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <div role="group" aria-label="Cenário projetado no futuro" className="flex flex-wrap items-center gap-1.5">
          <span className="text-micro text-texto-3">Futuro no cenário</span>
          {r.cenarios.map((x) => (
            <button key={x.id} type="button" className="ficha min-h-9" aria-pressed={cenario === x.id} onClick={() => setVista(x.id)} title={x.nome}>
              <span className="font-dados">{x.id}</span>
              <span className="hidden sm:inline">{x.nome}</span>
              <span className="sr-only sm:hidden">: {x.nome}</span>
            </button>
          ))}
        </div>
        {periodosFuturos.length > 1 && (
          <div role="radiogroup" aria-label="Período do horizonte" className="flex flex-wrap items-center gap-1.5">
            <span className="text-micro text-texto-3">Período</span>
            <button type="button" role="radio" aria-checked={!selecionado} className="ficha min-h-9" onClick={() => setPeriodo(null)}>
              <span className="numeros font-dados">{faixaDe(r.horizonte.inicio, r.horizonte.fim)}</span>
            </button>
            {periodosFuturos.map((h) => (
              <button key={h.id} type="button" role="radio" aria-checked={selecionado?.id === h.id} className="ficha min-h-9" onClick={() => setPeriodo(h.id)} title={h.nome}>
                <span className="numeros font-dados">{faixaDe(h.inicio, h.fim)}</span>
                <span className="sr-only">{h.nome}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0" aria-label="Legenda">
        {(["observado", "condicional", "projetado"] as const).map((k) => (
          <li key={k} className="flex items-center gap-1.5 text-micro text-texto-2" title={CATEGORIA[k].descricao}>
            <GlifoTempo c={k} tamanho={12} /> {CATEGORIA[k].rotulo}
          </li>
        ))}
      </ul>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {/* Com um período futuro escolhido, o passado recolhe: o foco passa a ser aquele trecho. */}
        {!selecionado && (
          <>
            {soltos.length > 0 && <Trecho titulo="Antecedentes" faixa={faixaDe(Math.min(...anosSoltos), Math.max(...anosSoltos))} eventos={soltos} />}
            {periodosPassados.map((h) => (
              <Trecho key={h.id} titulo={h.nome} faixa={faixaDe(h.inicio, h.fim)} eventos={passado.filter((e) => e.ano >= h.inicio && e.ano <= h.fim)} />
            ))}
          </>
        )}

        {/* divisor: daqui em diante, tudo é hipótese condicional */}
        <div className="flex items-center gap-3 pl-1" role="separator" aria-label="Hoje. A partir daqui, futuro hipotético.">
          <span aria-hidden="true" className="size-3 rounded-full border-2 border-ambar bg-abismo" />
          <span className="text-micro font-medium tracking-[0.08em] text-ambar uppercase">Hoje</span>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-ambar/50 to-transparent" />
          <span className="flex items-center gap-1.5 text-micro text-texto-3">
            futuro hipotético · <Letra id={c.id} ativa /> {c.nome}
          </span>
        </div>

        {visiveis.map((h) => (
          <Trecho key={h.id} titulo={h.nome} faixa={faixaDe(h.inicio, h.fim)} eventos={futuro.filter((e) => e.ano >= h.inicio && e.ano <= h.fim)} futuro />
        ))}
        {selecionado && futuro.every((e) => e.ano < selecionado.inicio || e.ano > selecionado.fim) && (
          <p className="pl-8 text-legenda text-texto-2">Nenhum evento registrado neste período para o cenário {c.id}.</p>
        )}
      </div>
    </div>
  );
}
