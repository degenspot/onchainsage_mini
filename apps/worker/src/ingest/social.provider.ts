import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export type SocialSnapshotLike = { tokenId: string; mentions1h: number; mentions24h: number; slope: number; at?: Date };

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
