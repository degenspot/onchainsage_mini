type ResolveFn = (value?: any) => void;

class TokenBucketLimiter {
  private capacity: number;
  private tokens: number;
  private refillIntervalMs: number;
  private refillAmount: number;
  private queue: { fn: () => Promise<any>; resolve: ResolveFn; reject: (e: any) => void; timeout?: NodeJS.Timeout }[] = [];
  private timer?: NodeJS.Timeout;

  constructor(reqPerMin: number, bucketSize = 10) {
    this.capacity = bucketSize;
    this.tokens = bucketSize;
    this.refillIntervalMs = 60000 / reqPerMin; // add one token every interval
    this.refillAmount = 1;
    this.startRefill();
  }

  private startRefill() {
    if (this.timer) return;
    this.timer = setInterval(() => this.refill(), this.refillIntervalMs);
  }

  private refill() {
    this.tokens = Math.min(this.capacity, this.tokens + this.refillAmount);
    this.drainQueue();
  }

  private drainQueue() {
    while (this.tokens > 0 && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.tokens -= 1;
      if (item.timeout) clearTimeout(item.timeout);
      item.fn().then(item.resolve).catch(item.reject);
    }
  }

  public async schedule<T>(fn: () => Promise<T>, timeoutMs = 60000): Promise<T> {
    if (this.tokens > 0) {
      this.tokens -= 1;
      return fn();
    }
    return new Promise<T>((resolve, reject) => {
      const entry = { fn, resolve, reject, timeout: undefined as any };
      entry.timeout = setTimeout(() => {
        // remove from queue if still present
        const idx = this.queue.indexOf(entry);
        if (idx >= 0) this.queue.splice(idx, 1);
        reject(new Error('RateLimiter queue timeout'));
      }, timeoutMs);
      this.queue.push(entry);
    });
  }
}

const instances = new Map<string, TokenBucketLimiter>();
export function RateLimiterSingleton(reqPerMin = 300, bucketSize = 10, key = 'default') {
  let inst = instances.get(key);
  if (!inst) {
    inst = new TokenBucketLimiter(reqPerMin, bucketSize);
    instances.set(key, inst);
  }
  return inst;
}

export default RateLimiterSingleton;
