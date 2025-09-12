import axios from 'axios';
import { RateLimiterSingleton } from '@onchainsage/connectors';

export type SentimentLabel = 'POSITIVE' | 'NEGATIVE';
export interface SentimentResult {
  label: SentimentLabel;
  score: number; // normalized -1..1 (POSITIVE -> positive, NEGATIVE -> negative)
  confidence: number; // raw confidence from model (0..1)
}

export interface AggregatedSentiment {
  averageScore: number; // -1 .. 1
  positiveRatio: number; // 0..1
  negativeRatio: number; // 0..1
  totalAnalyzed: number;
}

export interface SentimentAnalyzerConfig {
  apiKey?: string;
  model?: string;
  rateLimit?: number;
  timeoutMs?: number;
  batchSize?: number;
}

export class SentimentAnalyzer {
  private apiKey: string | undefined;
  private model: string;
  private limiter = RateLimiterSingleton(Number(process.env.HUGGINGFACE_RATE_LIMIT || '1000'), 10, 'huggingface');
  private timeoutMs = Number(process.env.HUGGINGFACE_REQUEST_TIMEOUT || '10000');
  private batchSize = Number(process.env.HUGGINGFACE_BATCH_SIZE || '32');

  constructor(config?: SentimentAnalyzerConfig) {
    this.apiKey = config?.apiKey ?? process.env.HUGGINGFACE_API_KEY;
    this.model = config?.model ?? process.env.HUGGINGFACE_MODEL ?? 'distilbert-base-uncased-finetuned-sst-2-english';
    if (config?.rateLimit) this.limiter = RateLimiterSingleton(config.rateLimit, 10, 'huggingface');
    if (config?.timeoutMs) this.timeoutMs = config.timeoutMs;
    if (config?.batchSize) this.batchSize = config.batchSize;
  }

  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    let id: NodeJS.Timeout;
    const timeout = new Promise<never>((_, rej) => { id = setTimeout(() => rej(new Error('HuggingFace request timed out')), ms); });
    return Promise.race([p, timeout]).finally(() => clearTimeout(id!));
  }

  private async postInference(inputs: string[]): Promise<any> {
    if (!this.apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');
    const url = `https://api-inference.huggingface.co/models/${this.model}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'onchainsage/ai-sentiment/1.0',
    };
    return this.withTimeout(axios.post(url, { inputs }, { headers }), this.timeoutMs).then((r) => r.data);
  }

  private async inferWithRetry(inputs: string[], attempt = 0): Promise<any> {
    try {
      return await this.limiter.schedule(() => this.postInference(inputs), this.timeoutMs);
    } catch (e: any) {
      const isAxios = !!e.isAxiosError;
      const status = isAxios ? e.response?.status : undefined;
      const code = e.code as string | undefined;
      const transient = status === 429 || (status && status >= 500) || /(ECONN|ETIMEDOUT|ENET|EAI_AGAIN)/.test(code || '');
      if (attempt < 3 && transient) {
        const backoff = Math.min(1000 * 2 ** attempt, 10000);
        await new Promise((r) => setTimeout(r, backoff));
        return this.inferWithRetry(inputs, attempt + 1);
      }
      throw e;
    }
  }

  public async analyzeSentiment(text: string): Promise<SentimentResult> {
    const results = await this.analyzeBatch([text]);
    return results[0];
  }

  public async analyzeBatch(texts: string[]): Promise<SentimentResult[]> {
    const inputs = texts.map((t) => (t ?? '').trim());
    const idxs = inputs.map((t, i) => (t.length >= 10 ? i : -1)).filter((i) => i >= 0);
    const nonEmpty = idxs.map((i) => inputs[i]);

    const batches: string[][] = [];
    for (let i = 0; i < nonEmpty.length; i += this.batchSize) batches.push(nonEmpty.slice(i, i + this.batchSize));

    const respAll: any[] = [];
    for (const batch of batches) {
      if (batch.length === 0) continue;
      try {
        const resp = await this.inferWithRetry(batch);
        respAll.push(...resp);
      } catch (e) {
        for (const _ of batch) respAll.push(undefined);
      }
    }

    // Reconstruct results for all inputs
    const results: SentimentResult[] = inputs.map(() => ({ label: 'NEGATIVE', score: 0, confidence: 0 }));
    let k = 0;
    for (const i of idxs) {
      const item = respAll[k];
      if (!item) {
        results[i] = { label: 'NEGATIVE', score: 0, confidence: 0 };
        k++;
        continue;
      }
      const arr = Array.isArray(item) ? item : [item];
      const top = arr.slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0] || { label: 'NEGATIVE', score: 0 };
      const label: SentimentLabel = (top.label || '').toUpperCase().includes('POS') ? 'POSITIVE' : 'NEGATIVE';
      const confidence = Number(top.score ?? 0) || 0;
      const score = label === 'POSITIVE' ? confidence : -confidence;
      results[i] = { label, score, confidence };
      k++;
    }
    return results;
  }

  public aggregateSentiments(results: SentimentResult[]): AggregatedSentiment {
    const total = results.length;
    if (total === 0) return { averageScore: 0, positiveRatio: 0, negativeRatio: 0, totalAnalyzed: 0 };
    const analyzed = results.filter((r) => r.confidence > 0);
    const totalAnalyzed = analyzed.length;
    const sum = analyzed.reduce((s, r) => s + (r.score ?? 0), 0);
    const avg = totalAnalyzed ? sum / totalAnalyzed : 0;
    const positives = analyzed.filter((r) => r.score > 0).length;
    const negatives = analyzed.filter((r) => r.score < 0).length;
    return { averageScore: avg, positiveRatio: positives / totalAnalyzed, negativeRatio: negatives / totalAnalyzed, totalAnalyzed };
  }
}

export default SentimentAnalyzer;
