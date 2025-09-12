import { Test, TestingModule } from '@nestjs/testing';
import { SocialProcessor } from './social.processor';
import { PrismaService } from '../prisma/prisma.service';
import { SentimentAnalyzer } from '@onchainsage/ai';

jest.mock('@onchainsage/ai');
jest.mock('bullmq', () => ({
  Worker: jest.fn(),
}));


describe('SocialProcessor', () => {
  let processor: SocialProcessor;
  let prisma: PrismaService;
  let sentimentAnalyzer: SentimentAnalyzer;

  const mockPrisma = {
    token: {
      findUnique: jest.fn(),
    },
    socialSnapshot: {
      create: jest.fn(),
    },
    tweet: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
  };

  const mockSentimentAnalyzer = {
    analyzeBatch: jest.fn(),
    aggregateSentiments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialProcessor,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    processor = module.get<SocialProcessor>(SocialProcessor);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Manually inject mocked sentiment analyzer
    (processor as any).sentimentAnalyzer = mockSentimentAnalyzer;
    sentimentAnalyzer = (processor as any).sentimentAnalyzer;
  });

  it('should process social data, handle invalid tweets, and persist correctly', async () => {
    const job = { data: { tokenId: 'token-1' } };
    const tweets = [
      { tweetId: '1', text: 'Valid tweet one' },
      { tweetId: '', text: 'Invalid tweet, no ID' },
      { tweetId: '2', text: 'Valid tweet two' },
      { tweetId: null, text: 'Another invalid one' },
    ];
    
    const sentimentResults = [
        { label: 'POSITIVE', confidence: 0.9 },
        { label: 'NEGATIVE', confidence: 0 },
        { label: 'NEGATIVE', confidence: 0.8 },
        { label: 'NEGATIVE', confidence: 0 },
    ];

    const aggregated = { averageScore: 0.1, positiveRatio: 0.5, negativeRatio: 0.5, totalAnalyzed: 2 };

    mockPrisma.token.findUnique.mockResolvedValue({ symbol: 'TKN' });
    (processor as any).provider = { fetch: jest.fn().mockResolvedValue({ tokenId: 'token-1', tweets, mentions1h: 10, mentions24h: 100, slope: 0.5 }) };
    mockSentimentAnalyzer.analyzeBatch.mockResolvedValue(sentimentResults);
    mockSentimentAnalyzer.aggregateSentiments.mockResolvedValue(aggregated);

    // This is not ideal, but Worker is autorun on init. We need to get the callback.
    // In a real scenario, we might want to inject the worker or connection.
    // For now, let's grab the callback passed to the mocked worker.
    const WorkerMock = require('bullmq').Worker;
    await processor.onModuleInit();
    const workerCallback = WorkerMock.mock.calls[0][1];
    
    await workerCallback(job);

    expect(mockSentimentAnalyzer.analyzeBatch).toHaveBeenCalledWith(tweets.map(t => t.text));
    
    // Check that social snapshot is created with aggregated data
    expect(prisma.socialSnapshot.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            tokenId: 'token-1',
            sentimentScore: aggregated.averageScore,
            totalAnalyzed: aggregated.totalAnalyzed
        })
    }));

    // Check that upsert is called only for valid tweets
    expect(prisma.tweet.upsert).toHaveBeenCalledTimes(2);

    // Check first valid tweet
    expect(prisma.tweet.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { tweetId: '1' },
      create: expect.objectContaining({ sentimentLabel: 'POSITIVE', sentimentScore: 0.9 }),
      update: expect.objectContaining({ sentimentLabel: 'POSITIVE', sentimentScore: 0.9 }),
    }));
    
    // Check second valid tweet, ensuring correct sentiment mapping
    expect(prisma.tweet.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { tweetId: '2' },
        create: expect.objectContaining({ sentimentLabel: 'NEGATIVE', sentimentScore: 0.8 }),
        update: expect.objectContaining({ sentimentLabel: 'NEGATIVE', sentimentScore: 0.8 }),
    }));
  });
});
