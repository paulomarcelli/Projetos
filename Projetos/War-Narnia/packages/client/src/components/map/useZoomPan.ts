/**
 * Zoom e arraste do mapa: roda do mouse (no cursor), pinça (2 dedos),
 * arrastar (1 ponteiro, com limiar para não confundir com clique),
 * teclado (setas, + e −) e botões. Só usa transform (sem relayout).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';

export interface ViewBox {
  /** Escala (px de tela por px da arte). */
  s: number;
  /** Deslocamento em px de tela. */
  tx: number;
  ty: number;
}

interface Size {
  w: number;
  h: number;
}

const MAX_SCALE = 3;
/** Abaixo disso os marcadores se sobrepõem demais: o enquadramento inicial nunca fica menor. */
const MIN_READABLE_SCALE = 0.5;
const DRAG_THRESHOLD = 5;

export function useZoomPan(art: { width: number; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [vb, setVb] = useState<ViewBox>({ s: 1, tx: 0, ty: 0 });
  const vbRef = useRef(vb);
  vbRef.current = vb;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const initialized = useRef(false);
  const dragged = useRef(false);

  const limits = useCallback(
    (sz: Size) => {
      const contain = Math.min(sz.w / art.width, sz.h / art.height);
      const cover = Math.max(sz.w / art.width, sz.h / art.height);
      return { min: Math.min(contain, 1), contain, cover, max: Math.max(MAX_SCALE, cover) };
    },
    [art.width, art.height],
  );

  const clamp = useCallback(
    (v: ViewBox, sz: Size = sizeRef.current): ViewBox => {
      const lim = limits(sz);
      const s = Math.min(lim.max, Math.max(lim.min, v.s));
      const mw = art.width * s;
      const mh = art.height * s;
      const tx = mw <= sz.w ? (sz.w - mw) / 2 : Math.min(0, Math.max(sz.w - mw, v.tx));
      const ty = mh <= sz.h ? (sz.h - mh) / 2 : Math.min(0, Math.max(sz.h - mh, v.ty));
      return { s, tx, ty };
    },
    [art.width, art.height, limits],
  );

  const initialView = useCallback(
    (sz: Size): ViewBox => {
      const lim = limits(sz);
      const s = Math.min(lim.cover, Math.max(lim.contain, MIN_READABLE_SCALE));
      return clamp({ s, tx: (sz.w - art.width * s) / 2, ty: (sz.h - art.height * s) / 2 }, sz);
    },
    [art.width, art.height, clamp, limits],
  );

  // Mede o contêiner e reage a mudanças de tamanho.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const sz = { w: Math.round(r.width), h: Math.round(r.height) };
      if (sz.w === 0 || sz.h === 0) return;
      setSize(sz);
      if (!initialized.current) {
        initialized.current = true;
        setVb(initialView(sz));
      } else {
        setVb((v) => clamp(v, sz));
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [clamp, initialView]);

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      setVb((v) => {
        const sz = sizeRef.current;
        const px = cx ?? sz.w / 2;
        const py = cy ?? sz.h / 2;
        const lim = limits(sz);
        const s = Math.min(lim.max, Math.max(lim.min, v.s * factor));
        const k = s / v.s;
        return clamp({ s, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k });
      });
    },
    [clamp, limits],
  );

  const panBy = useCallback((dx: number, dy: number) => setVb((v) => clamp({ ...v, tx: v.tx + dx, ty: v.ty + dy })), [clamp]);

  const reset = useCallback(() => setVb(initialView(sizeRef.current)), [initialView]);

  /** Garante que um ponto da arte esteja visível (ex.: marcador recebeu foco pelo Tab). */
  const ensureVisible = useCallback(
    (x: number, y: number, margin = 48) => {
      setVb((v) => {
        const sz = sizeRef.current;
        const sx = x * v.s + v.tx;
        const sy = y * v.s + v.ty;
        let { tx, ty } = v;
        if (sx < margin) tx += margin - sx;
        if (sx > sz.w - margin) tx -= sx - (sz.w - margin);
        if (sy < margin) ty += margin - sy;
        if (sy > sz.h - margin) ty -= sy - (sz.h - margin);
        return tx === v.tx && ty === v.ty ? v : clamp({ ...v, tx, ty });
      });
    },
    [clamp],
  );

  // Roda do mouse: precisa de listener não passivo para impedir a rolagem da página.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(Math.exp(-delta * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Arrastar e pinça com Pointer Events.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startX: number; startY: number; lastX: number; lastY: number; pinchDist: number; active: boolean } | null>(null);

  const onPointerDown = useCallback((e: RPointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      dragged.current = false;
      gesture.current = { startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, pinchDist: 0, active: false };
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      gesture.current = {
        startX: 0,
        startY: 0,
        lastX: (a!.x + b!.x) / 2,
        lastY: (a!.y + b!.y) / 2,
        pinchDist: Math.hypot(a!.x - b!.x, a!.y - b!.y),
        active: true,
      };
      dragged.current = true;
    }
  }, []);

  const onPointerMove = useCallback(
    (e: RPointerEvent) => {
      if (!pointers.current.has(e.pointerId) || !gesture.current) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gesture.current;
      const el = containerRef.current;
      if (pointers.current.size >= 2 && el) {
        const [a, b] = Array.from(pointers.current.values());
        const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        const mx = (a!.x + b!.x) / 2;
        const my = (a!.y + b!.y) / 2;
        const r = el.getBoundingClientRect();
        if (g.pinchDist > 0) zoomAt(dist / g.pinchDist, mx - r.left, my - r.top);
        panBy(mx - g.lastX, my - g.lastY);
        g.pinchDist = dist;
        g.lastX = mx;
        g.lastY = my;
        return;
      }
      if (!g.active) {
        if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < DRAG_THRESHOLD) return;
        g.active = true;
        dragged.current = true;
        // Só captura depois do limiar: assim um toque simples ainda vira clique no marcador.
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      }
      panBy(e.clientX - g.lastX, e.clientY - g.lastY);
      g.lastX = e.clientX;
      g.lastY = e.clientY;
    },
    [panBy, zoomAt],
  );

  const onPointerUp = useCallback((e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
    else if (pointers.current.size === 1 && gesture.current) {
      const [p] = Array.from(pointers.current.values());
      gesture.current = { startX: p!.x, startY: p!.y, lastX: p!.x, lastY: p!.y, pinchDist: 0, active: true };
    }
  }, []);

  /** true se o último gesto foi arraste/pinça (o clique que vem depois deve ser ignorado). */
  const consumeDrag = useCallback(() => {
    const d = dragged.current;
    dragged.current = false;
    return d;
  }, []);

  const lim = limits(size);
  return {
    containerRef,
    size,
    vb,
    zoomIn: () => zoomAt(1.35),
    zoomOut: () => zoomAt(1 / 1.35),
    reset,
    panBy,
    ensureVisible,
    consumeDrag,
    canZoomIn: vb.s < lim.max - 1e-3,
    canZoomOut: vb.s > lim.min + 1e-3,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
