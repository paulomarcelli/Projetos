import { useState } from "react";
import { GramaticaDeRelacoes, LegendaEpistemica } from "../components/Diagramas";
import { Aviso, Esqueleto, EstadoVazio, Origem } from "../components/Estados";
import { LinhaHorizonte } from "../components/LinhaHorizonte";
import { SimboloIris } from "../components/Marca";
import { Secao } from "../components/Secao";
import { CabecalhoDePagina } from "../components/Shell";
import { SeloStatus } from "../components/StatusDocumento";
import { MARCA } from "../lib/marca";

const CORES: { token: string; hex: string; papel: string }[] = [
  { token: "abismo", hex: "#0B1220", papel: "Fundo. O espaço cartográfico onde tudo se apoia." },
  { token: "institucional", hex: "#14243A", papel: "Painéis que precisam se destacar." },
  { token: "grafite", hex: "#1C293B", papel: "Superfícies elevadas, controles, estados ativos da navegação." },
  { token: "texto", hex: "#F3F6FA", papel: "Texto principal e fatos observados." },
  { token: "texto-2", hex: "#9AAAC0", papel: "Texto secundário, metadados, inferências." },
  { token: "ciano", hex: "#52C7E8", papel: "Interação, conexão, elemento ativo, vínculo com fonte." },
  { token: "ambar", hex: "#E9B45B", papel: "Incerteza, hipótese, horizonte, atenção analítica." },
  { token: "positivo", hex: "#6CCB9A", papel: "Só estados operacionais reais (ex.: sistema no ar)." },
  { token: "negativo", hex: "#EF8A7C", papel: "Só falhas reais (ex.: processamento falhou)." },
];

const TIPOS: { classe: string; nome: string; uso: string; exemplo: string }[] = [
  { classe: "font-editorial text-manchete", nome: "Manchete · 40/46 serifada", uso: "Mensagem editorial do início", exemplo: "Entenda o presente." },
  { classe: "font-editorial text-titulo", nome: "Título · 28/34 serifada", uso: "Título de página e de documento", exemplo: "Base científica" },
  { classe: "font-editorial text-secao", nome: "Seção · 20/28 serifada", uso: "Títulos de seção e de painel", exemplo: "Investigações recentes" },
  { classe: "font-editorial text-leitura", nome: "Leitura · 17/28 serifada", uso: "Texto analítico e páginas de documentos", exemplo: "A política externa brasileira entre o multilateralismo e a autonomia." },
  { classe: "text-corpo", nome: "Corpo · 15/24 sans", uso: "Interface, navegação, rótulos", exemplo: "Enviar documento" },
  { classe: "text-legenda text-texto-2", nome: "Legenda · 13/18 sans", uso: "Metadados e textos de apoio", exemplo: "Revista Brasileira de Política Internacional · 2023" },
  { classe: "font-dados text-micro text-texto-3", nome: "Dados · 12/16 mono", uso: "Coordenadas, hashes, origem dos dados", exemplo: "15°47′S 47°52′W · sha-256 3e8b…41cc" },
];

export function DesignSystem() {
  const [ficha, setFicha] = useState(true);
  return (
    <div className="flex flex-col gap-12">
      <CabecalhoDePagina rotulo="Referência" titulo="Design system">
        {MARCA.conceito} Cada elemento visual tem uma função; cada cor tem um significado fixo.
      </CabecalhoDePagina>

      <Secao id="ds-marca" titulo="Símbolo">
        <div className="flex flex-wrap items-center gap-8">
          <SimboloIris tamanho={72} />
          <p className="max-w-[60ch] text-corpo text-texto-2">
            Um globo visto como íris. Meridiano e equador formam o sistema de coordenadas — o presente
            mapeado. O arco ciano é a abertura do diafragma: o olhar que se projeta adiante, para os
            futuros possíveis.
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

      <Secao id="ds-tipos" titulo="Tipografia" subtitulo="Source Serif 4 (editorial), IBM Plex Sans (interface), IBM Plex Mono (dados). Números tabulares.">
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
            <Aviso tom="atencao">Atenção analítica: evidências divergentes.</Aviso>
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
        <ul className="grid gap-3 text-legenda text-texto-2 sm:grid-cols-3">
          <li>
            <span className="block text-corpo text-texto">140 ms</span>Toque em botões e fichas (escala 0,97)
          </li>
          <li>
            <span className="block text-corpo text-texto">180 ms</span>Cores, bordas e foco
          </li>
          <li>
            <span className="block text-corpo text-texto">240 ms</span>Entrada de conteúdo e notificações (saída mais rápida)
          </li>
        </ul>
        <p className="mt-3 text-micro text-texto-3">Curva de saída forte; ações de teclado sem animação; “reduzir movimento” respeitado.</p>
      </Secao>
    </div>
  );
}
