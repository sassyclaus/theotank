export interface CronJobResult {
  affected: number;
  details?: Record<string, unknown>;
}

export interface CronJob {
  name: string;
  intervalMs: number;
  run: () => Promise<CronJobResult>;
}
