import "@testing-library/jest-dom/vitest";

// O jsdom não implementa IntersectionObserver, que o Motion usa para `whileInView` (revelar ao
// rolar). Este dublê nunca dispara: nos testes, o conteúdo existe no DOM desde o início e a
// revelação é só apresentação, então nada depende dela.
if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverDeTeste {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.assign(globalThis, { IntersectionObserver: IntersectionObserverDeTeste });
}
