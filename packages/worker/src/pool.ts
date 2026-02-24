export class ConcurrencyPool {
  private activeCount = 0;
  private inflightPromises: Set<Promise<void>> = new Set();
  private maxConcurrency: number;

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
  }

  hasCapacity(): boolean {
    return this.activeCount < this.maxConcurrency;
  }

  run(fn: () => Promise<void>): void {
    this.activeCount++;
    const p = fn()
      .catch(() => {}) // errors handled inside fn
      .finally(() => {
        this.activeCount--;
        this.inflightPromises.delete(p);
      });
    this.inflightPromises.add(p);
  }

  async drain(): Promise<void> {
    while (this.inflightPromises.size > 0) {
      await Promise.allSettled([...this.inflightPromises]);
    }
  }

  get active(): number {
    return this.activeCount;
  }

  get available(): number {
    return this.maxConcurrency - this.activeCount;
  }

  get max(): number {
    return this.maxConcurrency;
  }
}
