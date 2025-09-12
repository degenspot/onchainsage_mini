/* eslint-disable no-console */
import 'dotenv/config';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const QUEUE_NAMES = ['market-ingest', 'social-ingest'];

async function monitorPipeline() {
  console.log('--- Pipeline Monitor ---');
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const queues = QUEUE_NAMES.map(name => new Queue(name, { connection: redis }));

  const printQueueStats = async () => {
    console.clear();
    console.log(`--- Pipeline Status @ ${new Date().toLocaleTimeString()} ---\n`);
    
    for (const queue of queues) {
      const [counts, isPaused] = await Promise.all([
        queue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
        queue.isPaused(),
      ]);
      
      console.log(`Queue: ${queue.name}`);
      console.log(`  Status: ${isPaused ? 'Paused' : 'Running'}`);
      console.log(`  Waiting: ${counts.wait}`);
      console.log(`  Active: ${counts.active}`);
      console.log(`  Completed: ${counts.completed}`);
      console.log(`  Failed: ${counts.failed}`);
      console.log(`  Delayed: ${counts.delayed}`);
      console.log('---');
    }
  };

  setInterval(printQueueStats, 2000); // Refresh every 2 seconds

  process.on('SIGINT', () => {
    console.log('\nExiting monitor...');
    redis.disconnect();
    process.exit(0);
  });
}

monitorPipeline();
