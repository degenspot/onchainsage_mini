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

## OnChain Sage — API (NestJS)

Backend service exposing REST + WebSocket for signals and prophecies. Currently wired to SQLite for instant local dev.

## Setup

1) Install deps
```bash
npm install
```

2) Initialize database (SQLite)
```bash
npm run db:setup
# runs: prisma generate → migrate → seed
```

## Run

```bash
# watch mode (recommended for dev)
npm run start:dev

# one-off
npm run start

# production (after build)
npm run start:prod
```

## Environment

The API auto-loads environment variables via dotenv. For SQLite, no env is required. Useful vars:
```
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
```

If you switch to Postgres later, set:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Then run `npm run prisma:generate && npm run prisma:migrate`.

## REST Endpoints

- GET `/signals/top?window=24h&limit=5` — top recent signals (DB-backed)
- GET `/signals/:chain/:address` — recent signals for a token
- GET `/prophecies/today` — today’s prophecies
- GET `/health` — service and DB status

## WebSocket

- Gateway: `signals.gateway.ts`
- Channel messages shaped as `{ type: 'signals:live', data: { tokenId, score, label, at } }`
- Next step: switch from mock ticker to Redis pub/sub feed from worker

## Prisma

- Schema at `prisma/schema.prisma`
- Commands:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## What’s Next (Plan)

1) Add Redis client to API, subscribe in `SignalsGateway` to `signals:live` channel.
2) In Worker: introduce BullMQ queues (`market`, `social`, `score`) and processors.
3) Implement `DexScreenerProvider` and persist `MarketSnapshot`; score via `SignalEngine` and write `Signal`.
4) On new high-score signals, Worker publishes to Redis → API WS relays to clients.

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

## Current Status (2025-09-04)

- DB schema and migrations are in place; `prisma generate` and `prisma migrate` are used for schema management.
- A convenience script `npm run db:sync` has been added to apply migrations non-interactively, regenerate the client, and run the seed.
- API serves REST endpoints and a WebSocket gateway; Redis pub/sub is optional in dev but recommended for full live updates.

Direction: stabilize developer DX by ensuring migrations + client are in sync at startup and add CI checks to run `db:sync` before tests.
