import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tokenId = 'base:0xabc123';
  await prisma.token.upsert({
    where: { id: tokenId },
    update: {},
    create: {
      id: tokenId,
      chain: 'base',
      address: '0xabc123',
      symbol: 'DEMO',
    },
  });
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    await prisma.signal.create({
      data: {
        tokenId,
        score: 1 + Math.random() * 2,
        label: ['HYPE_BUILDING','FAKE_PUMP','DEAD_ZONE','WHALE_PLAY'][i % 4],
        reasons: ['seed'],
        at: new Date(now.getTime() - i * 60_000),
      },
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});


