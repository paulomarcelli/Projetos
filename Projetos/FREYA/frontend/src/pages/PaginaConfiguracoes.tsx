import { Moon, RotateCcw, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CabecalhoDaPagina } from "../components/layout";
import { PreviaTipografica } from "../components/settings";
import { useTrocaDeTema } from "../components/theme";
import { Botao, Dialogo, GrupoSegmentado, Interruptor, Pilula, cx } from "../components/ui";
import { ESCALAS, FONTES, usePreferencias, type EscalaDeTexto, type Fonte, type Tema } from "../contexts/Preferencias";
import { numero, useSaude } from "../hooks";
import { baseDaApi } from "../services";

function Bloco({ id, titulo, descricao, children }: { id: string; titulo: string; descricao?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-borda bg-superficie p-5 sm:p-6">
      <h2 id={id} className="text-xl font-semibold">
        {titulo}
      </h2>
      {descricao && <p className="mt-1 text-sm text-texto-suave">{descricao}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function PaginaConfiguracoes() {
  const prefs = usePreferencias();
  const { trocarPara } = useTrocaDeTema();
  const [fonte, setFonte] = useState<Fonte>(prefs.fonte);
  const [escala, setEscala] = useState<EscalaDeTexto>(prefs.escala);
  const [restaurar, setRestaurar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // se as preferências mudarem por fora (restaurar padrão), o rascunho acompanha
  useEffect(() => {
    setFonte(prefs.fonte);
    setEscala(prefs.escala);
  }, [prefs.fonte, prefs.escala]);

  const mudou = fonte !== prefs.fonte || escala !== prefs.escala;

  const aplicar = () => {
    prefs.definir({ fonte, escala });
    setAviso(`Aplicado: ${FONTES[fonte].nome}, ${ESCALAS.find((e) => e.valor === escala)?.nome.toLocaleLowerCase("pt-BR")}.`);
  };
  const cancelar = () => {
    setFonte(prefs.fonte);
    setEscala(prefs.escala);
    setAviso("Rascunho descartado.");
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      <CabecalhoDaPagina titulo="Configurações" subtitulo="Preferências desta interface, guardadas neste navegador." />

      <div className="flex flex-col gap-6">
        <Bloco id="tipografia" titulo="Tipografia" descricao="Escolha a fonte e o tamanho do texto. A prévia mostra o rascunho; nada muda no resto da F.R.E.Y.A. até você aplicar.">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Fonte</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(FONTES) as Fonte[]).map((f) => (
                    <label
                      key={f}
                      className={cx(
                        "relative flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition-[border-color,background-color] duration-150",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-escarlate",
                        fonte === f ? "border-escarlate bg-escarlate-tinta/40" : "border-borda passar:border-borda-forte",
                      )}
                    >
                      <input type="radio" name="fonte" value={f} checked={fonte === f} onChange={() => setFonte(f)} className="sr-only" />
                      <span style={{ fontFamily: FONTES[f].pilha }} className="flex items-baseline justify-between gap-2">
                        <span className="text-lg font-semibold">{FONTES[f].nome}</span>
                        <span className="text-2xl leading-none text-texto-suave" aria-hidden="true">
                          Aa
                        </span>
                      </span>
                      <span style={{ fontFamily: FONTES[f].pilha }} className="text-xs text-texto-suave">
                        {FONTES[f].descricao}
                      </span>
                      {f === prefs.fonte && (
                        <Pilula tamanho="pequeno" className="mt-1 self-start">
                          Em uso
                        </Pilula>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <p id="rotulo-escala" className="mb-3 text-sm font-medium">
                  Tamanho do texto
                </p>
                <GrupoSegmentado<string>
                  rotulo="Tamanho do texto"
                  larguraTotal
                  valor={String(escala)}
                  aoMudar={(v) => setEscala(Number(v) as EscalaDeTexto)}
                  opcoes={ESCALAS.map((e) => ({ valor: String(e.valor), rotulo: e.nome, rotuloAcessivel: `${e.nome} (${Math.round(e.valor * 100)}%)` }))}
                />
              </div>
            </div>

            <PreviaTipografica fonte={fonte} escala={escala} />
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-borda pt-5 sm:flex-row sm:items-center">
            <p className="text-sm text-texto-suave sm:mr-auto" aria-live="polite">
              {mudou ? <span className="font-medium text-texto">Rascunho ainda não aplicado.</span> : (aviso ?? "Sem mudanças pendentes.")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Botao variante="fantasma" icone={<RotateCcw />} onClick={() => setRestaurar(true)}>
                Restaurar padrão
              </Botao>
              <Botao onClick={cancelar} disabled={!mudou}>
                Cancelar
              </Botao>
              <Botao variante="primario" onClick={aplicar} disabled={!mudou}>
                Aplicar
              </Botao>
            </div>
          </div>
        </Bloco>

        <Bloco id="aparencia" titulo="Aparência e movimento" descricao="Estas valem na hora.">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Tema</p>
                <p className="text-sm text-texto-suave">Claro ou escuro, com a troca da Realidade Escarlate.</p>
              </div>
              <GrupoSegmentado<Tema>
                rotulo="Tema"
                valor={prefs.tema}
                aoMudar={(t, { origem }) => trocarPara(t, origem)}
                opcoes={[
                  { valor: "claro", rotulo: "Claro", icone: <Sun size={16} /> },
                  { valor: "escuro", rotulo: "Escuro", icone: <Moon size={16} /> },
                ]}
                className="sm:w-64"
              />
            </div>
            <div className="border-t border-borda pt-5">
              <Interruptor
                marcado={prefs.reduzirMovimento}
                aoMudar={(v) => prefs.definir({ reduzirMovimento: v })}
                rotulo="Reduzir movimento"
                descricao="Tira deslocamentos e a animação do grafo; cores e opacidade continuam. O ajuste do sistema também é respeitado."
              />
            </div>
            <div className="border-t border-borda pt-5">
              <Interruptor
                marcado={prefs.menuRecolhido}
                aoMudar={(v) => prefs.definir({ menuRecolhido: v })}
                rotulo="Menu lateral recolhido"
                descricao="Começa só com os ícones, para dar mais espaço às análises."
              />
            </div>
          </div>
        </Bloco>

        <SobreAApi />
      </div>

      <Dialogo
        aberto={restaurar}
        aoFechar={() => setRestaurar(false)}
        tipo="alerta"
        titulo="Restaurar as preferências padrão?"
        descricao="Volta a fonte Outfit, o tamanho padrão, o menu aberto e o movimento normal. O tema e o seu perfil ficam como estão."
        acoes={
          <>
            <Botao data-autofoco onClick={() => setRestaurar(false)}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              onClick={() => {
                prefs.restaurarPadrao();
                setRestaurar(false);
                setAviso("Preferências padrão restauradas.");
              }}
            >
              Restaurar
            </Botao>
          </>
        }
      />
    </div>
  );
}

function SobreAApi() {
  const { dados, erro, carregando, recarregar, atualizando } = useSaude();
  const base = baseDaApi() || "(mesma origem)";
  return (
    <Bloco id="sobre" titulo="Sobre e estado da API">
      <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-texto-fraco">Estado</dt>
          <dd className="mt-0.5 flex items-center gap-2">
            <span aria-hidden="true" className={cx("size-2 rounded-full", carregando ? "bg-texto-fraco" : erro ? "bg-perigo" : "bg-sucesso")} />
            {carregando ? "Verificando…" : erro ? `Sem resposta (${erro.message})` : dados?.status === "ok" ? "No ar" : (dados?.status ?? "—")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-texto-fraco">Endereço em uso</dt>
          <dd className="mt-0.5 font-mono text-xs break-all">{base}</dd>
        </div>
        <div>
          <dt className="text-xs text-texto-fraco">Motor</dt>
          <dd className="mt-0.5">
            {dados ? (dados.motor === "modelo" ? "Modelo de linguagem" : dados.motor === "deterministico" ? "Determinístico" : dados.motor) : "—"}
            {dados?.modelo && <span className="ml-2 font-mono text-xs text-texto-suave">{dados.modelo}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-texto-fraco">Grafo</dt>
          <dd className="mt-0.5">{dados?.grafo ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-texto-fraco">Base indexada</dt>
          <dd className="mt-0.5 fr-numeros">
            {dados?.base
              ? `${numero(dados.base.hybrid.documentos)} documentos · ${numero(dados.base.hybrid.chunks)} trechos · ${numero(dados.base.grafo.nos)} nós · ${numero(dados.base.grafo.arestas)} relações`
              : dados
                ? "A API não informou o tamanho da base."
                : "—"}
          </dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-borda pt-4">
        <Botao tamanho="pequeno" onClick={recarregar} carregando={atualizando || (carregando && !!erro)}>
          Verificar de novo
        </Botao>
        <p className="text-xs text-texto-fraco">A base cobre a continuidade cinematográfica do MCU (filmes e séries).</p>
      </div>
    </Bloco>
  );
}
