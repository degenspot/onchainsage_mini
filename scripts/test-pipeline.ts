/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { DexScreenerConnector } from '../apps/worker/src/connectors/dexscreener';
import { TwitterScraper } from '../packages/connectors/social/twitter-scraper';
import { SentimentAnalyzer } from '../packages/ai/sentiment-analyzer';
import { AIProviderFactory } from '../packages/ai';
import { Redis } from 'ioredis';

async function testPipeline() {
  console.log('--- Starting Pipeline Test ---');

  const prisma = new PrismaClient();
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    // 1. Environment Validation
    console.log('\n[1/6] Validating environment...');
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY is not set.');
    }
    await prisma.$connect();
    await redis.ping();
    console.log('Environment validation successful.');

    // 2. Component Testing
    console.log('\n[2/6] Testing components...');
    const dexscreener = new DexScreenerConnector();
    const trending = await dexscreener.getTrending(1);
    if (!trending.length) throw new Error('DexScreener trending fetch failed.');

    const twitter = new TwitterScraper();
    const tweets = await twitter.searchTweets('bitcoin', 10);
    if (!tweets.length) console.warn('Twitter search returned no results, but proceeding.');

    const sentiment = new SentimentAnalyzer(process.env.HUGGINGFACE_API_KEY);
    const scores = await sentiment.analyze(['gm world']);
    if (!scores.length) throw new Error('Sentiment analysis failed.');
    console.log('Component tests successful.');

    // 3. Market Data Flow
    console.log('\n[3/6] Testing market data flow...');
    const testToken = trending[0];
    const marketSnap = await prisma.marketSnapshot.create({
      data: {
        tokenId: testToken.symbol, // This assumes symbol is unique; in real app, use a proper ID.
        ...testToken,
        token: { connectOrCreate: { where: { id: testToken.symbol }, create: { id: testToken.symbol, chain: 'ethereum', address: testToken.address } } }
      },
    });
    if (!marketSnap) throw new Error('Market snapshot creation failed.');
    console.log('Market data flow successful.');

    // 4. Social Data Flow
    console.log('\n[4/6] Testing social data flow...');
    const testTweet = tweets[0] || { id: 'test', text: 'gm', author: 'tester', createdAt: new Date() };
    const tweetRecord = await prisma.tweet.create({
        data: {
            tokenId: testToken.symbol,
            tweetId: testTweet.id,
            text: testTweet.text,
            author: testTweet.author,
            createdAt: testTweet.createdAt,
            sentimentLabel: scores[0].label,
            sentimentScore: scores[0].score,
        }
    });
    if (!tweetRecord) throw new Error('Tweet record creation failed.');
    console.log('Social data flow successful.');

    // 5. Prophecy Generation
    console.log('\n[5/6] Testing prophecy generation...');
    const aiProvider = AIProviderFactory.getInstance().getDefaultProvider();
    const prophecy = await aiProvider.generateThesis(testToken, ['early-momentum'], { themes: ['test'], sentiment: 0.8, momentum: 0.9, coherence: 0.7 });
    if (!prophecy.thesis) throw new Error('Prophecy generation failed.');
    console.log('Prophecy generation successful.');

    // 6. WebSocket Broadcast (simulation)
    console.log('\n[6/6] Testing WebSocket broadcast...');
    const channel = 'prophecies:today';
    let messageReceived = false;
    const sub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await sub.subscribe(channel);
    sub.on('message', (ch, msg) => {
        if (ch === channel && msg) messageReceived = true;
    });
    await redis.publish(channel, JSON.stringify(prophecy));
    await new Promise(res => setTimeout(res, 100)); // wait for pub/sub
    if (!messageReceived) throw new Error('WebSocket broadcast failed.');
    sub.disconnect();
    console.log('WebSocket broadcast successful.');

    console.log('\n--- Pipeline Test Successful ---');
  } catch (error) {
    console.error('\n--- Pipeline Test Failed ---');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    redis.disconnect();
  }
}

testPipeline();
