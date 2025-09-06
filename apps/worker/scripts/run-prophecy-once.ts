require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
// Use absolute paths to load built package JS outputs so ts-node can resolve modules reliably
const path = require('path');
const criteriaPath = path.resolve(process.cwd(), '../../packages/scoring/criteria-engine.js');
const narrativePath = path.resolve(process.cwd(), '../../packages/narrative/narrative-analyzer.js');
const aiPath = path.resolve(process.cwd(), '../../packages/ai/ai-provider.js');
const { CriteriaEngine } = require(criteriaPath);
const { NarrativeAnalyzer } = require(narrativePath);
const { getAIProvider } = require(aiPath);

async function runOnce() {
  const prisma = new PrismaClient();
  const criteriaEngine = new CriteriaEngine();
  const narrativeAnalyzer = new NarrativeAnalyzer();
  const aiProvider = getAIProvider();

  try {
    await prisma.$connect();

    console.log('Standalone: fetching top signals (last 24h)');
    const end = Date.now();
    const startMs = end - 24 * 60 * 60 * 1000;

    const topSignals = await prisma.signal.findMany({
      where: { at: { gte: new Date(startMs) } },
      orderBy: [{ score: 'desc' }],
      take: 50,
      include: { token: true },
    });

    const created: any[] = [];

    for (const signal of topSignals) {
      const marketSnap = await prisma.marketSnapshot.findFirst({ where: { tokenId: signal.tokenId }, orderBy: { at: 'desc' } });
      const socialSnap = await prisma.socialSnapshot.findFirst({ where: { tokenId: signal.tokenId }, orderBy: { at: 'desc' } });
      if (!marketSnap || !socialSnap) continue;

      const criteriaResult = criteriaEngine.evaluate({ volume24h: marketSnap.volume24h, liquidity: marketSnap.liquidity, price: marketSnap.price, ageMin: marketSnap.ageMin }, { mentions24h: socialSnap.mentions24h, slope: socialSnap.slope });
      if (!criteriaResult.passed) continue;

      const narrativeResult = narrativeAnalyzer.analyze({ mentions24h: socialSnap.mentions24h, slope: socialSnap.slope }, { symbol: signal.token.symbol });
      const thesis = await aiProvider.generateThesis({ symbol: signal.token.symbol, price: marketSnap.price, liquidity: marketSnap.liquidity, volume24h: marketSnap.volume24h }, criteriaResult.matched, narrativeResult);

      const payload = { tokenId: signal.tokenId, score: signal.score, rank: created.length + 1 };
      const signalHash = simpleHash(JSON.stringify(payload));
      const existing = await prisma.prophecy.findFirst({ where: { signalHash } });
      if (existing) continue;

      const prophecyData: any = {
        tokenId: signal.tokenId,
        signalHash,
        score: signal.score,
        rank: created.length + 1,
        criteria: criteriaResult as any,
        thesis,
        narrativeScore: (narrativeResult as any).coherence ?? 0,
        criteriaMatched: criteriaResult.matched as any,
        socialSignals: narrativeResult as any,
      };

      const row = await prisma.prophecy.create({ data: prophecyData });
      created.push(row);
      if (created.length >= 3) break;
    }

    console.log(`Standalone: created ${created.length} prophecies.`);
    if (created.length) {
      try {
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
          // publish to redis if available (use require to avoid TS constructor typing issues)
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const IORedis = require('ioredis');
          const client = new IORedis(redisUrl);
          await client.publish('prophecies:today', JSON.stringify(created));
          client.disconnect();
          console.log('Standalone: published to prophecies:today');
        }
      } catch (e) {
        console.error('Standalone: failed to publish to redis', e);
      }
    }
  } catch (e) {
    console.error('Standalone run failed', e);
  } finally {
    await prisma.$disconnect();
  }
}

function simpleHash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return `hash_${(h >>> 0).toString(16)}`;
}

runOnce().catch((e) => { console.error(e); process.exit(1); });
