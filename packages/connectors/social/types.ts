export type ChainId = string;

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
}

export interface TweetData {
  tweetId: string;
  text: string;
  author: string;
  authorDisplayName?: string;
  createdAt: string; // ISO string
  url?: string;
  metrics: TweetMetrics;
}

export type TimeWindow = '1h' | '24h' | '7d';

export interface SearchOptions {
  timeframe?: TimeWindow;
  maxResults?: number;
  includeReplies?: boolean;
}

export interface TwitterScraperConfig {
  rateLimit?: number;
  timeoutMs?: number;
  maxResults?: number;
}

export interface ScrapingResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface MentionAggregation {
  mentions1h: number;
  mentions24h: number;
  slope: number;
}
