import { RateLimiterSingleton } from './limiter';
import { TweetData, SearchOptions, TwitterScraperConfig } from './types';
import { Scraper, SearchMode } from '@the-convocation/twitter-scraper';

export class TwitterScraper {
  private limiter = RateLimiterSingleton(Number(process.env.TWITTER_RATE_LIMIT || '150'), 10, 'twitter');
  private timeoutMs = Number(process.env.TWITTER_REQUEST_TIMEOUT || '15000');
  private maxResults = Number(process.env.TWITTER_MAX_RESULTS || '100');
  private scraper: Scraper;

  constructor(private config?: TwitterScraperConfig) {
    if (config?.rateLimit) this.limiter = RateLimiterSingleton(config.rateLimit);
    if (config?.timeoutMs) this.timeoutMs = config.timeoutMs;
    if (config?.maxResults) this.maxResults = config.maxResults;
    this.scraper = new Scraper();
  }

  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    let id: NodeJS.Timeout;
    const timeout = new Promise<never>((_, rej) => { id = setTimeout(() => rej(new Error('Twitter request timed out')), ms); });
    return Promise.race([p, timeout]).finally(() => clearTimeout(id!));
  }

  private async searchWithRetry(q: string, max: number, mode: SearchMode, attempt = 0): Promise<any> {
    try {
      return await this.limiter.schedule(() => this.withTimeout(this.scraper.fetchSearchTweets(q, max, mode), this.timeoutMs), this.timeoutMs);
    } catch (e) {
      const msg = String(e);
      if (attempt < 3 && /(429|rate|timeout|network|ECONN|ETIMEDOUT|ENET)/i.test(msg)) {
        const backoff = Math.min(1000 * 2 ** attempt, 10000);
        await new Promise(r => setTimeout(r, backoff));
        return this.searchWithRetry(q, max, mode, attempt + 1);
      }
      throw e;
    }
  }

  async searchTweetsBySymbol(symbol: string, options?: SearchOptions): Promise<TweetData[]> {
    const includeReplies = options?.includeReplies === true;
    const q = `${symbol} -is:retweet${includeReplies ? '' : ' -is:reply'}`;
    const mode = SearchMode.Latest; // prioritize recency for mentions
    const max = options?.maxResults ?? this.maxResults;
    try {
      const page = await this.searchWithRetry(q, max, mode);

      if (!page || !page.tweets) return [];

      return page.tweets.map((t: any) => ({
        tweetId: String(t.id || t.id_str || t.rest_id || ''),
        text: t.text || t.full_text || t.fullText || '',
        author: t.username || t.userId || (t.user && (t.user.username || t.user.screen_name)) || 'unknown',
        authorDisplayName: t.name || (t.user && t.user.name) || undefined,
        createdAt: new Date(t.timeParsed || t.created_at || t.time || Date.now()).toISOString(),
        url: t.permanentUrl || t.url || undefined,
        metrics: {
          likes: Number(t.likes ?? t.favorite_count ?? t.public_metrics?.like_count ?? 0),
          retweets: Number(t.retweets ?? t.retweet_count ?? t.public_metrics?.retweet_count ?? 0),
          replies: Number(t.replies ?? t.reply_count ?? t.public_metrics?.reply_count ?? 0),
        },
      }));
    } catch (e) {
      console.warn('[twitter-scraper] search failed', String(e));
      return [];
    }
  }
}

export default TwitterScraper;
