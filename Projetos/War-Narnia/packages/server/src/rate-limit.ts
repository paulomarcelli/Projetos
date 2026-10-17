// Limite de taxa por janela deslizante de 1 segundo.
export class RateLimiter {
  private hits: number[] = [];
  constructor(
    private readonly maxPerSecond: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Registra uma tentativa; devolve false se excedeu o limite. */
  take(): boolean {
    if (this.maxPerSecond <= 0) return true; // 0 = sem limite
    const t = this.now();
    while (this.hits.length && this.hits[0]! <= t - 1000) this.hits.shift();
    if (this.hits.length >= this.maxPerSecond) return false;
    this.hits.push(t);
    return true;
  }
}
