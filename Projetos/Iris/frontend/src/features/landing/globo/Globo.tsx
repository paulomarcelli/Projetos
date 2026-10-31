/**
 * O globo do herói. Só desenha enquanto está na tela e a aba está visível (o requestAnimationFrame já pausa em
 * abas escondidas); com "reduzir movimento", desenha um quadro parado, com as rotas acesas. Resolução limitada a
 * 1,5× para o canvas não pesar em telas densas.
 */
import { useEffect, useRef } from "react";
import { desenharGlobo } from "./desenhar";

const GIRO_POR_SEGUNDO = 0.07;
const DPR_MAXIMO = 1.5;

export function Globo({ className = "", enquadramento = "inteiro" }: { className?: string; enquadramento?: "inteiro" | "horizonte" }) {
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = tela.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let largura = 0;
    let altura = 0;
    let quadro = 0;
    let visivel = true;
    const inicio = performance.now();

    const desenhar = (agora = performance.now()) => {
      const t = (agora - inicio) / 1000;
      desenharGlobo({ ctx, largura, altura, tempo: t, giro: reduzir ? 0.6 : 0.6 + t * GIRO_POR_SEGUNDO, estatico: reduzir, enquadramento });
    };
    const laco = (agora: number) => {
      desenhar(agora);
      quadro = requestAnimationFrame(laco);
    };
    const iniciar = () => {
      cancelAnimationFrame(quadro);
      if (reduzir) desenhar();
      else if (visivel) quadro = requestAnimationFrame(laco);
    };

    const medir = () => {
      const caixa = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAXIMO);
      largura = caixa.width;
      altura = caixa.height;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      desenhar();
    };
    const tamanho = new ResizeObserver(medir);
    tamanho.observe(canvas);
    const presenca = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel) iniciar();
      else cancelAnimationFrame(quadro);
    });
    presenca.observe(canvas);
    medir();
    iniciar();
    return () => {
      cancelAnimationFrame(quadro);
      tamanho.disconnect();
      presenca.disconnect();
    };
  }, [enquadramento]);

  return <canvas ref={tela} aria-hidden="true" className={`block h-full w-full ${className}`} />;
}
