import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { TwitterScraper, TweetData } from '@onchainsage/connectors/social';

export type SocialSnapshotLike = { tokenId: string; mentions1h: number; mentions24h: number; slope: number; at?: Date; tweets?: TweetData[] };

export interface SocialProvider {
  fetch(tokenId: string): Promise<SocialSnapshotLike>;
}

@Injectable()
export class MockSocialProvider implements SocialProvider {
  private readonly logger = new Logger('MockSocialProvider');
  async fetch(tokenId: string) {
    const h = [...tokenId].reduce((a, c) => a + c.charCodeAt(0), 0);
    const mentions1h = (h % 120) + 10;
    const mentions24h = mentions1h * 10 + (h % 50);
    const slope = ((h % 20) - 10) / 10;
    this.logger.debug(`Mock social for ${tokenId}: ${mentions24h} mentions`);
    return { tokenId, mentions1h, mentions24h, slope, at: new Date() };
  }
}

@Injectable()
export class HttpSocialProvider implements SocialProvider {
  private readonly logger = new Logger('HttpSocialProvider');
  private readonly endpoint = process.env.SOCIAL_ENDPOINT || '';

  async fetch(tokenId: string) {
    if (!this.endpoint) throw new Error('SOCIAL_ENDPOINT not configured');
    const url = `${this.endpoint}?tokenId=${encodeURIComponent(tokenId)}`;
    const res = await axios.get(url, { timeout: 5000 });
    const data = res.data;
    // Expecting { mentions1h, mentions24h, slope }
    return { tokenId, mentions1h: data.mentions1h ?? 0, mentions24h: data.mentions24h ?? 0, slope: data.slope ?? 0, at: new Date() };
  }
}

@Injectable()
export class TwitterSocialProvider implements SocialProvider {
  private readonly logger = new Logger('TwitterSocialProvider');
  private readonly scraper: TwitterScraper;

  constructor() {
    this.scraper = new TwitterScraper();
  }
  // tokenId expected format chain:address; extract symbol heuristically from Token table later
  async fetch(tokenId: string) {
    // derive a simple fallback symbol from tokenId and delegate to fetchBySymbol
    const parts = tokenId.split(':');
    const symbol = parts[0] || 'TOKEN';
    return this.fetchBySymbol(tokenId, symbol);
  }

  async fetchBySymbol(tokenId: string, symbol: string): Promise<SocialSnapshotLike> {
    try {
      const s = `$${String(symbol).toUpperCase()}`;
      const tweets = await this.scraper.searchTweetsBySymbol(s, { timeframe: '24h', maxResults: 100 });

      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const dayAgo = now - 24 * 60 * 60 * 1000;
      let mentions1h = 0;
      let mentions24h = 0;
      for (const t of tweets) {
        const ts = Date.parse(t.createdAt);
        if (!Number.isFinite(ts)) continue;
        if (ts >= dayAgo) {
          mentions24h++;
          if (ts >= oneHourAgo) mentions1h++;
        }
      }
      const slope = mentions24h ? ((mentions1h * 24 - mentions24h) / mentions24h) : 0;
      return { tokenId, mentions1h, mentions24h, slope, at: new Date(), tweets };
    } catch (e) {
      this.logger.warn('Twitter fetch failed', String(e));
      return { tokenId, mentions1h: 0, mentions24h: 0, slope: 0, at: new Date(), tweets: [] };
    }
  }
}

export function providerForEnv(): string {
  return (process.env.SOCIAL_PROVIDER || 'mock').toLowerCase();
}
