import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

type Rota = { metodo?: string; caminho: RegExp; resposta: unknown; status?: number };

/** Substitui fetch por respostas fixas e registra as chamadas. */
export function mockFetch(rotas: Rota[]) {
  const chamadas: { url: string; metodo: string; corpo?: unknown }[] = [];
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url), metodo = init?.method ?? "GET";
    chamadas.push({ url: u, metodo, corpo: init?.body ? JSON.parse(String(init.body)) : undefined });
    const r = rotas.find((x) => (x.metodo ?? "GET") === metodo && x.caminho.test(u));
    if (!r) return new Response(JSON.stringify({ detail: "não mockado" }), { status: 404 });
    const corpo = typeof r.resposta === "function" ? (r.resposta as () => unknown)() : r.resposta;
    return new Response(r.status === 204 ? null : JSON.stringify(corpo), { status: r.status ?? 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return chamadas;
}

export function renderEm(rota: string, padrao: string, elemento: ReactElement, extras: { caminho: string; elemento: ReactElement }[] = []) {
  return render(
    <MemoryRouter initialEntries={[rota]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path={padrao} element={elemento} />
        {extras.map((e) => <Route key={e.caminho} path={e.caminho} element={e.elemento} />)}
      </Routes>
    </MemoryRouter>,
  );
}
