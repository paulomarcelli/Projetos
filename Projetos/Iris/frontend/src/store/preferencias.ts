/**
 * Preferências de leitura deste navegador: tema de cor, tamanho do texto e o menu lateral.
 *
 * Por que um armazenamento próprio (e não um useState em cada componente): antes, cada uso de
 * `useTema()` guardava a sua cópia do tema. O botão do menu e o seletor das Configurações podiam
 * discordar até a página recarregar. Aqui há UMA fonte de verdade em memória, espelhada no
 * localStorage, e os componentes a leem com `useSyncExternalStore`: quem muda o tema em um lugar
 * vê a mudança em todos, no mesmo quadro.
 *
 * Onde cada preferência age:
 *   - tema  → `data-tema="claro"` no <html>; o CSS troca só os VALORES dos tokens.
 *   - texto → `data-texto="confortavel|ampliada"` no <html>; o CSS muda `--escala-texto`, que
 *             multiplica os tokens de texto (e só eles: ícones, gráficos e espaçamentos ficam).
 *   - menu  → largura e estado recolhido, lidos pelo Shell (variável CSS na grade).
 * São preferências do navegador, não dados da conta. O index.html repete a leitura de tema e
 * texto num script inline, antes da primeira pintura, para a página não piscar no estado errado.
 */
import { useSyncExternalStore } from "react";

export type PreferenciaTema = "sistema" | "claro" | "escuro";
export type TamanhoTexto = "padrao" | "confortavel" | "ampliada";
export interface EstadoMenu {
  /** Largura do menu expandido, em px (limitada por MENU.min/max). */
  largura: number;
  recolhido: boolean;
}

/** Os três tamanhos oferecidos. `px` é o corpo de texto resultante (para o rótulo e a prévia). */
export const TAMANHOS: { id: TamanhoTexto; rotulo: string; px: number }[] = [
  { id: "padrao", rotulo: "Padrão", px: 16 },
  { id: "confortavel", rotulo: "Confortável", px: 18 },
  { id: "ampliada", rotulo: "Ampliada", px: 20 },
];

/**
 * Limites do menu. Abaixo de 224 px os títulos das investigações viram reticências; acima de
 * 360 px o menu disputa a largura com a leitura. Recolhido, sobra só a coluna dos ícones.
 */
export const MENU = { min: 224, max: 360, padrao: 272, recolhido: 68 } as const;

const CHAVES = { tema: "iris:tema", texto: "iris:texto", menu: "iris:menu" } as const;

interface Estado {
  tema: PreferenciaTema;
  /** O tema que está de fato na tela (resolve "sistema"). */
  temaEfetivo: "claro" | "escuro";
  texto: TamanhoTexto;
  menu: EstadoMenu;
}

// ------------------------------------------------------------------ leitura segura

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null; // armazenamento bloqueado (modo privado restrito): vale o padrão
  }
}
function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // Sem armazenamento, a escolha vale só nesta visita.
  }
}

const limitar = (n: number) => Math.round(Math.min(MENU.max, Math.max(MENU.min, n)));
const sistemaPedeClaro = () => (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches) || false;

/** Sem escolha guardada, segue o sistema operacional (e a escolha manual, quando há, prevalece). */
export function lerTema(): PreferenciaTema {
  const v = ler(CHAVES.tema);
  return v === "claro" || v === "escuro" || v === "sistema" ? v : "sistema";
}
function lerTexto(): TamanhoTexto {
  const v = ler(CHAVES.texto);
  return v === "confortavel" || v === "ampliada" ? v : "padrao";
}
function lerMenu(): EstadoMenu {
  try {
    const v = JSON.parse(ler(CHAVES.menu) ?? "null") as Partial<EstadoMenu> | null;
    return { largura: limitar(Number(v?.largura) || MENU.padrao), recolhido: v?.recolhido === true };
  } catch {
    return { largura: MENU.padrao, recolhido: false };
  }
}
const resolver = (t: PreferenciaTema) => (t === "claro" || (t === "sistema" && sistemaPedeClaro()) ? "claro" : "escuro");

// ------------------------------------------------------------------ aplicação no documento

function aplicarNoDocumento(e: Pick<Estado, "temaEfetivo" | "texto">) {
  const html = document.documentElement;
  if (e.temaEfetivo === "claro") html.dataset.tema = "claro";
  else delete html.dataset.tema;
  if (e.texto === "padrao") delete html.dataset.texto;
  else html.dataset.texto = e.texto;
}

// ------------------------------------------------------------------ armazenamento

let estado: Estado = (() => {
  const tema = lerTema();
  return { tema, temaEfetivo: resolver(tema), texto: lerTexto(), menu: lerMenu() };
})();
const ouvintes = new Set<() => void>();

function atualizar(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  for (const f of ouvintes) f();
}
function assinar(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

/** Ponto da tela (em px, coordenadas da janela) de onde a troca de tema parte: o centro do botão clicado. */
export interface OrigemDaTroca {
  x: number;
  y: number;
}

/**
 * Troca de tema sem clarão (View Transitions API: o navegador congela a tela antiga e anima para a nova de uma vez,
 * em vez de cada superfície mudar no seu tempo).
 *   - Com `origem` (o botão de sol e lua): o tema novo se espalha em círculo a partir do botão até cobrir a tela,
 *     560 ms com saída exponencial. O gesto e a mudança ficam ligados: a cor nasce de onde o clique aconteceu.
 *   - Sem origem (Configurações, mudança do sistema): um esmaecimento curto da tela inteira.
 * Sem a API, ou com "reduzir movimento", a troca é direta.
 */
function trocarComTransicao(aplicar: () => void, origem?: OrigemDaTroca) {
  type Transicao = { ready: Promise<void>; finished: Promise<void> };
  const doc = document as Document & { startViewTransition?: (f: () => void) => Transicao };
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduzir) return aplicar();
  const raiz = document.documentElement;
  raiz.dataset.trocaTema = origem ? "circulo" : "suave";
  const t = doc.startViewTransition(aplicar);
  if (origem) {
    const raio = Math.hypot(Math.max(origem.x, window.innerWidth - origem.x), Math.max(origem.y, window.innerHeight - origem.y));
    t.ready
      .then(() =>
        raiz.animate(
          { clipPath: [`circle(0px at ${origem.x}px ${origem.y}px)`, `circle(${raio}px at ${origem.x}px ${origem.y}px)`] },
          { duration: 560, easing: "cubic-bezier(0.23, 1, 0.32, 1)", pseudoElement: "::view-transition-new(root)" },
        ),
      )
      .catch(() => {});
  }
  t.finished.finally(() => delete raiz.dataset.trocaTema).catch(() => {});
}

export function escolherTema(tema: PreferenciaTema, origem?: OrigemDaTroca) {
  gravar(CHAVES.tema, tema);
  const temaEfetivo = resolver(tema);
  trocarComTransicao(() => aplicarNoDocumento({ temaEfetivo, texto: estado.texto }), origem);
  atualizar({ tema, temaEfetivo });
}

export function escolherTexto(texto: TamanhoTexto) {
  gravar(CHAVES.texto, texto);
  aplicarNoDocumento({ temaEfetivo: estado.temaEfetivo, texto });
  atualizar({ texto });
}

/** `persistir: false` durante o arraste (atualiza a tela a cada quadro, grava só ao soltar). */
export function ajustarMenu(m: Partial<EstadoMenu>, persistir = true) {
  const menu = { largura: limitar(m.largura ?? estado.menu.largura), recolhido: m.recolhido ?? estado.menu.recolhido };
  if (menu.largura === estado.menu.largura && menu.recolhido === estado.menu.recolhido) {
    if (persistir) gravar(CHAVES.menu, JSON.stringify(menu));
    return;
  }
  if (persistir) gravar(CHAVES.menu, JSON.stringify(menu));
  atualizar({ menu });
}

/**
 * Chamado uma vez na entrada (main.tsx): reaplica o que o index.html já aplicou (cobre a prévia e
 * os testes) e passa a acompanhar o sistema operacional quando o tema é "sistema".
 */
export function iniciarPreferencias() {
  aplicarNoDocumento(estado);
  const mq = window.matchMedia?.("(prefers-color-scheme: light)");
  mq?.addEventListener?.("change", () => {
    if (estado.tema !== "sistema") return;
    const temaEfetivo = resolver("sistema");
    trocarComTransicao(() => aplicarNoDocumento({ temaEfetivo, texto: estado.texto }));
    atualizar({ temaEfetivo });
  });
}

// ------------------------------------------------------------------ ganchos

const obter = () => estado;

/** Todas as preferências; o componente renderiza de novo só quando alguma muda. */
export function usePreferencias() {
  return useSyncExternalStore(assinar, obter, obter);
}

/** Atalho com a mesma forma do antigo `useTema()`. */
export function useTema() {
  const { tema, temaEfetivo } = usePreferencias();
  return { preferencia: tema, efetivo: temaEfetivo, escolher: escolherTema };
}
