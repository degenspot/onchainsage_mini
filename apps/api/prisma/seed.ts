import { PrismaClient, Prisma } from '@prisma/client';

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
    const labels = [
      'HYPE_BUILDING',
      'FAKE_PUMP',
      'DEAD_ZONE',
      'WHALE_PLAY',
    ];
    await prisma.signal.create({
      data: {
        tokenId,
        score: 1 + Math.random() * 2,
        label: labels[i % labels.length] as any,
        reasons: ['seed'],
        at: new Date(now.getTime() - i * 60_000),
      },
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});


