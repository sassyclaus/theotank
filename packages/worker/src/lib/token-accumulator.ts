export interface TokenUsageByModel {
  calls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenUsageSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  byModel: Record<string, TokenUsageByModel>;
}

export class TokenAccumulator {
  private byModel = new Map<string, TokenUsageByModel>();

  record(
    model: string,
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
  ): void {
    if (!usage) return;
    const existing = this.byModel.get(model) ?? {
      calls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    existing.calls++;
    existing.promptTokens += usage.prompt_tokens ?? 0;
    existing.completionTokens += usage.completion_tokens ?? 0;
    existing.totalTokens += usage.total_tokens ?? 0;
    this.byModel.set(model, existing);
  }

  toJSON(): TokenUsageSummary {
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    const byModel: Record<string, TokenUsageByModel> = {};

    for (const [model, stats] of this.byModel) {
      totalPromptTokens += stats.promptTokens;
      totalCompletionTokens += stats.completionTokens;
      totalTokens += stats.totalTokens;
      byModel[model] = { ...stats };
    }

    return { totalPromptTokens, totalCompletionTokens, totalTokens, byModel };
  }
}
