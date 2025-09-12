<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## DexScreener trending discovery (custom)

This worker contains a custom trending discovery pipeline for DexScreener since the API does not provide a public "trending" endpoint. Key points:

- Multi-strategy discovery: token profiles endpoint + targeted search terms.
- Trending algorithm ranks pairs by volume growth, liquidity, age bonus, and activity.
- Rate limiting: a token-bucket limiter is used with default 300 req/min (configurable via `DEXSCREENER_RATE_LIMIT`).
- Job types: `search` (backwards compatible) and `trending`.

Environment variables (new):

- `DEXSCREENER_RATE_LIMIT` (default 300) - requests per minute to DexScreener.
- `DEXSCREENER_RETRY_ATTEMPTS` (default 2) - retry attempts for 5xx/timeouts.
- `DEXSCREENER_TIMEOUT_MS` (default 10000) - request timeout in ms.
- `TRENDING_JOB_FREQUENCY_MS` (default 120000) - how often to enqueue trending jobs.
- `TRENDING_TIMEFRAME` (default '24h') - timeframe passed to trending discovery.
- `ENABLE_TRENDING` (default '1') - disable trending scheduler by setting to '0'.
- `DEX_LIVE_TEST` - enable live integration tests against the real API.

## Sentiment analysis (Hugging Face)

This worker integrates tweet-level sentiment analysis using the Hugging Face Inference API (default model: `distilbert-base-uncased-finetuned-sst-2-english`). Tweets scraped by the Twitter provider are analyzed in batches and sentiment is stored on both `SocialSnapshot` and individual `Tweet` records.

Environment variables:

- `HUGGINGFACE_API_KEY` (required for sentiment) - your Hugging Face Inference API key
- `HUGGINGFACE_RATE_LIMIT` (default: 1000) - requests per minute for the HF client
- `HUGGINGFACE_REQUEST_TIMEOUT` (default: 10000) - per-request timeout in ms
- `HUGGINGFACE_MODEL` (default: `distilbert-base-uncased-finetuned-sst-2-english`) - model to use
- `HUGGINGFACE_BATCH_SIZE` (default: 32) - batch size for inference requests
- `HUGGINGFACE_LIVE_TEST` - enable live API tests when present

Behavior:

- Tweets shorter than 10 characters are skipped for sentiment analysis.
- Sentiment analysis is rate-limited and retried with exponential backoff on transient failures.
- Aggregated sentiment fields are stored on `SocialSnapshot`: `sentimentScore`, `positiveRatio`, `negativeRatio`, `sentimentAnalyzed`.
- Individual tweets get `sentimentLabel`, `sentimentScore`, and `sentimentAnalyzedAt` when analyzed.


Testing

- Unit tests for the connector include mocked responses and rate-limiter tests.
- Integration tests can be enabled by setting `DEX_LIVE_TEST=1` and running the test suite.

If you change behavior, update the scheduler and processor intervals accordingly.

## AI Provider System

This worker includes an advanced AI Provider system for generating investment theses for prophecies. It supports multiple AI backends and provides a clear upgrade path from a simple rule-based system to sophisticated AI models.

### Architecture

The system is designed around an `AIProviderFactory` that dynamically selects an AI provider based on environment configuration. It supports graceful fallback to a `RuleBasedProvider` if a configured AI provider fails, ensuring high availability.

Supported providers:
- **Rule-Based**: A reliable, fast, and cost-effective default provider.
- **Hugging Face**: Utilizes the Hugging Face Inference API for advanced models.
- **AimlAPI**: Integrates with AimlAPI for access to powerful language models.
- **OpenAI**: Uses the OpenAI API for state-of-the-art thesis generation.

### Configuration

The AI provider is configured via environment variables.

**Core Configuration:**
- `AI_PROVIDER`: (default: 'rule-based') - Selects the provider. Options: `rule-based`, `huggingface`, `aimlapi`, `openai`.
- `AI_FALLBACK_ENABLED`: (default: true) - Enables fallback to the rule-based provider on failure.
- `AI_HEALTH_CHECK_INTERVAL`: (default: 300000ms) - Interval for checking the health of AI providers.

**Provider-Specific Configuration:**

- **Hugging Face:**
  - `HUGGINGFACE_API_KEY`: Your Hugging Face API key.
  - `HUGGINGFACE_MODEL`: (default: `meta-llama/Meta-Llama-3.1-8B-Instruct`) - The model to use.
  - `HUGGINGFACE_RATE_LIMIT`: (default: 1000) - Requests per minute.

- **AimlAPI:**
  - `AIMLAPI_API_KEY`: Your AimlAPI key.
  - `AIMLAPI_MODEL`: (default: `aiml/meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo`) - The model to use.
  - `AIMLAPI_RATE_LIMIT`: (default: 500) - Requests per minute.

- **OpenAI:**
  - `OPENAI_API_KEY`: Your OpenAI API key.
  - `OPENAI_MODEL`: (default: `gpt-3.5-turbo`) - The model to use.
  - `OPENAI_RATE_LIMIT`: (default: 3000) - Requests per minute.

### Upgrade Path

To upgrade from the default rule-based provider to an AI provider:
1.  Set the `AI_PROVIDER` environment variable to your desired provider (e.g., `openai`).
2.  Provide the necessary API key and configuration for that provider (e.g., `OPENAI_API_KEY`).
3.  Restart the worker application.

The system will automatically switch to the new provider. If the provider fails, it will fall back to the rule-based provider, ensuring prophecies are still generated.
