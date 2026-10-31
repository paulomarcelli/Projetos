import { useState } from "react";
import { GramaticaDeRelacoes, LegendaEpistemica } from "../../features/relacoes/components/Gramatica";
import { Aviso } from "../../components/feedback/Aviso";
import { Esqueleto } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/feedback/EstadoVazio";
import { Origem } from "../../components/ui/Origem";
import { LinhaHorizonte } from "../../features/consulta/components/LinhaHorizonte";
import { Marca, SimboloIris } from "../../components/ui/Marca";
import { Secao } from "../../components/ui/Secao";
import { CabecalhoDePagina } from "../../components/layout/CabecalhoDePagina";
import { SeloStatus } from "../../features/base-cientifica/components/StatusDocumento";
import { MARCA } from "../../config/marca";

/** Valores do tema escuro / claro. Os componentes usam só o token; o tema troca o valor. */
const CORES: { token: string; hex: string; papel: string }[] = [
  { token: "abismo", hex: "#080C12 / #F1F3F6", papel: "Fundo. O espaço cartográfico onde tudo se apoia." },
  { token: "institucional", hex: "#0F1620 / #FAFBFC", papel: "Cartões e painéis (separados pelo tom, não por contorno)." },
  { token: "grafite", hex: "#16202C / #E5E9EF", papel: "Superfícies elevadas, controles, estados ativos da navegação." },
  { token: "texto", hex: "#E3E8EF / #182234", papel: "Texto principal e fatos observados (sem branco ou preto puros)." },
  { token: "texto-2", hex: "#AAB5C5 / #3A4759", papel: "Texto secundário e inferências." },
  { token: "texto-3", hex: "#94A0B4 / #556276", papel: "Metadados, legendas, origem dos números." },
  { token: "ciano", hex: "#52C7E8 / #0A6F91", papel: "Interação, seleção, conexão, vínculo com fonte." },
  { token: "ambar", hex: "#E9B45B / #8A5600", papel: "Incerteza, hipótese, cenário, horizonte. Nunca seleção." },
  { token: "ouro", hex: "#F2C45A / #8A6A00", papel: "Acento de detalhe herdado da landing: traço do item ativo, aba selecionada, passo em leitura. Sem significado; nunca no lugar do âmbar." },
  { token: "positivo", hex: "#6CCB9A / #1B6F45", papel: "Só estados operacionais reais (ex.: sistema no ar)." },
  { token: "negativo", hex: "#EF8A7C / #A8352A", papel: "Só falhas reais (ex.: processamento falhou)." },
];

/** Tamanhos no padrão (16 px); "Confortável" e "Ampliada" multiplicam o texto por 1,125 e 1,25. */
const TIPOS: { classe: string; nome: string; uso: string; exemplo: string }[] = [
  { classe: "font-editorial text-manchete", nome: "Manchete · 40 Inter regular", uso: "Mensagem editorial do início", exemplo: "Entenda o presente." },
  { classe: "font-editorial text-titulo", nome: "Título · 30 Inter regular", uso: "Título de página e de seção da análise", exemplo: "Três futuros possíveis" },
  { classe: "font-editorial text-secao", nome: "Seção · 21 Inter", uso: "Síntese, títulos de painel e de cartão", exemplo: "Pragmatismo alinhado" },
  { classe: "text-leitura", nome: "Leitura · 17/1,65 Inter", uso: "Texto analítico e subtítulos", exemplo: "A política externa brasileira entre o multilateralismo e a autonomia." },
  { classe: "text-corpo", nome: "Corpo · 16/1,6 Inter", uso: "Interface, navegação, texto denso", exemplo: "Enviar documento" },
  { classe: "text-legenda text-texto-2", nome: "Legenda · 14/1,5 Inter", uso: "Metadados e textos de apoio", exemplo: "Revista Brasileira de Política Internacional · 2023" },
  { classe: "font-dados text-micro text-texto-3", nome: "Dados · 13 mono", uso: "Coordenadas, datas, origem dos dados", exemplo: "15°47′S 47°52′W · sha-256 3e8b…41cc" },
];

export function PaginaSistemaDeDesign() {
  const [ficha, setFicha] = useState(true);
  return (
    <div className="flex flex-col gap-12">
      <CabecalhoDePagina rotulo="Referência" titulo="Design system">
        {MARCA.conceito} Cada elemento visual tem uma função; cada cor tem um significado fixo.
      </CabecalhoDePagina>

      <Secao id="ds-marca" titulo="Marca">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-8">
            <SimboloIris tamanho={72} />
            <Marca altura={40} />
            <span className="rounded-padrao bg-white p-3">
              <Marca altura={28} tom="claro" />
            </span>
          </div>
          <p className="max-w-[64ch] text-corpo text-texto-2">
            Uma íris que olha para fora do próprio círculo. O anel aberto é o sistema observado; a pupila,
            voltada para o vão, é o olhar analítico; o nó em ciano é o que se investiga: o outro ator, a
            relação, o futuro. Wordmark em Source Serif 4, convertido em curvas. Versões para fundo escuro e
            claro em <code className="font-dados text-micro">public/recursos/icones/marca/</code>; favicon em{" "}
            <code className="font-dados text-micro">public/favicon.svg</code>.
          </p>
        </div>
      </Secao>

      <Secao id="ds-cores" titulo="Cores" subtitulo="Paleta fechada. Verde e vermelho nunca decoram.">
        <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORES.map((c) => (
            <li key={c.token} className="grid grid-cols-[44px_minmax(0,1fr)] gap-3">
              <span className="size-11 rounded-padrao border border-linha-forte" style={{ background: `var(--color-${c.token})` }} aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-corpo text-texto">
                  {c.token} <code className="font-dados text-micro text-texto-3">{c.hex}</code>
                </span>
                <span className="block text-legenda text-texto-2">{c.papel}</span>
              </span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao id="ds-tipos" titulo="Tipografia" subtitulo="Inter em tudo (títulos em peso regular e espaçamento apertado, como na landing), IBM Plex Mono (dados). Números tabulares. Nada abaixo de 13 px.">
        <ul className="flex flex-col">
          {TIPOS.map((t) => (
            <li key={t.nome} className="grid gap-2 border-b border-linha py-4 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
              <span className="flex flex-col">
                <span className="text-legenda text-texto">{t.nome}</span>
                <span className="text-micro text-texto-3">{t.uso}</span>
              </span>
              <span className={`min-w-0 text-texto [overflow-wrap:anywhere] ${t.classe}`}>{t.exemplo}</span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao id="ds-epistemico" titulo="Linguagem epistêmica" subtitulo="Toda afirmação diz o que ela é. Forma + rótulo, nunca só cor.">
        <LegendaEpistemica />
      </Secao>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Secao id="ds-relacoes" titulo="Relações entre atores">
          <GramaticaDeRelacoes />
        </Secao>
        <Secao id="ds-horizonte" titulo="Horizonte temporal">
          <LinhaHorizonte anos={10} />
        </Secao>
      </div>

      <Secao id="ds-componentes" titulo="Componentes">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="rotulo">Botões</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="botao botao-primario">Primário</button>
              <button type="button" className="botao botao-secundario">Secundário</button>
              <button type="button" className="botao botao-fantasma">Fantasma</button>
              <button type="button" className="botao botao-perigo">Remover</button>
              <button type="button" className="botao botao-secundario" disabled>
                Indisponível
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="rotulo">Fichas</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ficha" aria-pressed={ficha} onClick={() => setFicha((x) => !x)}>
                Diplomacia
              </button>
              <button type="button" className="ficha" aria-pressed={false}>
                Segurança
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="rotulo">Estado do documento</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <SeloStatus status="pending" />
              <SeloStatus status="processing" />
              <SeloStatus status="completed" />
              <SeloStatus status="failed" />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="rotulo">Campo</p>
            <label htmlFor="ds-campo" className="text-legenda text-texto-2">
              Pergunta de investigação
            </label>
            <input id="ds-campo" className="campo" placeholder="Como a disputa por semicondutores…" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="rotulo">Avisos</p>
            <Aviso tom="neutro">Informação neutra.</Aviso>
            <Aviso tom="incerteza">Atenção analítica: evidências divergentes.</Aviso>
            <Aviso tom="atencao">Aviso do sistema: recurso ainda indisponível.</Aviso>
            <Aviso tom="erro">O processamento falhou.</Aviso>
            <Aviso tom="sucesso">Documento processado.</Aviso>
          </div>
          <div className="flex flex-col gap-3">
            <p className="rotulo">Carregamento, origem e vazio</p>
            <Esqueleto className="h-4 w-3/4" />
            <Esqueleto className="h-4 w-1/2" />
            <Origem>GET /documents → total</Origem>
            <EstadoVazio titulo="Nada aqui ainda" marcador={{ tipo: "limitacao" }}>
              Um estado vazio diz o que vai aparecer e por que ainda não apareceu.
            </EstadoVazio>
          </div>
        </div>
      </Secao>

      <Secao id="ds-movimento" titulo="Movimento">
        <ul className="grid gap-x-6 gap-y-4 text-legenda text-texto-2 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <span className="block text-corpo text-texto">140 ms · toque</span>Botões e fichas encolhem para 0,97: a interface ouviu.
          </li>
          <li>
            <span className="block text-corpo text-texto">180 ms · cor</span>Cores, bordas e foco, com curva suave.
          </li>
          <li>
            <span className="block text-corpo text-texto">240 ms · estado</span>O cone de incerteza abre e fecha com o horizonte escolhido.
          </li>
          <li>
            <span className="block text-corpo text-texto">400 / 200 ms · gaveta</span>Entra e sai pela mesma borda; a saída é mais rápida.
          </li>
          <li>
            <span className="block text-corpo text-texto">400 / 200 ms · notificação</span>Sobe de baixo e desce ao sair; pode ser interrompida.
          </li>
          <li>
            <span className="block text-corpo text-texto">1,1 s · uma vez</span>Na landing, as trajetórias se abrem do presente para o horizonte.
          </li>
        </ul>
        <p className="mt-3 max-w-[70ch] text-micro text-texto-3">
          Sem animação: busca aberta pelo teclado, troca de página no leitor e dados de gráficos (quem lê
          não deve ver números se mexendo). Com “reduzir movimento”, fica só a opacidade.
        </p>
      </Secao>
    </div>
  );
}
