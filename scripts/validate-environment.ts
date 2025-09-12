/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import axios from 'axios';

async function validateEnvironment() {
  console.log('--- Starting Environment Validation ---');
  const errors: string[] = [];

  // 1. Check Core Environment Variables
  console.log('Checking core environment variables...');
  if (!process.env.DATABASE_URL) errors.push('DATABASE_URL is not set.');
  if (!process.env.REDIS_URL) errors.push('REDIS_URL is not set.');

  // 2. Test Database Connection
  console.log('Testing database connection...');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Database connection successful.');
  } catch (error) {
    errors.push(`Database connection failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // 3. Test Redis Connection
  console.log('Testing Redis connection...');
  const redis = new Redis(process.env.REDIS_URL || '');
  try {
    await redis.ping();
    console.log('Redis connection successful.');
  } catch (error) {
    errors.push(`Redis connection failed: ${error.message}`);
  } finally {
    redis.disconnect();
  }

  // 4. Validate API Keys
  console.log('Validating API keys...');
  if (!process.env.HUGGINGFACE_API_KEY) {
    errors.push('HUGGINGFACE_API_KEY is not set.');
  } else {
    try {
        const hfUrl = `https://api-inference.huggingface.co/models/${process.env.HUGGINGFACE_MODEL || 'distilbert-base-uncased-finetuned-sst-2-english'}`;
        await axios.post(hfUrl, { inputs: 'test' }, { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } });
        console.log('Hugging Face API key is valid.');
    } catch (error) {
        errors.push(`Hugging Face API key is invalid or model is unavailable: ${error.message}`);
    }
  }

  if (process.env.AI_PROVIDER === 'openai' && !process.env.OPENAI_API_KEY) {
    errors.push('AI_PROVIDER is set to "openai", but OPENAI_API_KEY is not set.');
  }

  if (process.env.AI_PROVIDER === 'aimlapi' && !process.env.AIMLAPI_API_KEY) {
      errors.push('AI_PROVIDER is set to "aimlapi", but AIMLAPI_API_KEY is not set.');
  }

  // Final Report
  console.log('\n--- Validation Report ---');
  if (errors.length > 0) {
    console.error('Environment validation failed with the following errors:');
    errors.forEach(err => console.error(`- ${err}`));
    process.exit(1);
  } else {
    console.log('Environment validation successful. All checks passed.');
  }
}

validateEnvironment();
