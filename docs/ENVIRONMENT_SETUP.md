# Environment Setup Guide

This guide provides comprehensive instructions for setting up the local development and production environments for the OnChainSage application.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js**: Version 18.0 or higher.
-   **pnpm**: As the package manager for this monorepo.
-   **Docker**: For running external services like Redis and PostgreSQL.
-   **Git**: For version control.

## 2. External Services

The application relies on the following external services:

-   **Redis**: Used for BullMQ queues and WebSocket pub/sub. A local instance can be run via Docker.
-   **Database**: The application is configured to use SQLite by default for local development. For production, PostgreSQL is recommended.

## 3. API Key Setup

You will need to obtain API keys for several services.

### Hugging Face

1.  Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
2.  Create a new API token with `read` access.
3.  Copy the token and set it as `HUGGINGFACE_API_KEY` in your `.env` file.

### OpenAI (Optional)

1.  Visit [platform.openai.com](https://platform.openai.com) and create an account.
2.  Navigate to the API keys section and generate a new secret key.
3.  Set this key as `OPENAI_API_KEY` in your `.env` file if you plan to use the OpenAI provider.

### AimlAPI (Optional)

1.  Register at [aimlapi.com](https://aimlapi.com).
2.  Find your API key in your account dashboard.
3.  Set it as `AIMLAPI_API_KEY` in your `.env` file to use the AimlAPI provider.

## 4. Local Development Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd onchainsage_mini
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Set up environment variables**:
    -   Create a `.env` file in the `apps/worker` directory.
    -   Copy the contents from the `.env.example` template (or the variables listed in the main README).
    -   Fill in the required API keys. `HUGGINGFACE_API_KEY` is the most critical one for the full pipeline to work.

4.  **Run database migrations**:
    ```bash
    pnpm -F api prisma migrate deploy
    ```

5.  **Start the application stack**:
    ```bash
    pnpm dev:full
    ```
    This will start the API, worker, and frontend in development mode.

## 5. Production Deployment

For production, it is crucial to manage your environment variables securely.

-   Use a secret management tool provided by your cloud provider (e.g., AWS Secrets Manager, Google Secret Manager).
-   Inject environment variables into your containers or serverless functions at runtime.
-   Adjust rate limits in your environment configuration to levels suitable for production traffic.
-   Set up monitoring and alerting for all external services and APIs.

## 6. Testing Configuration

For running tests, especially in a CI/CD environment:

-   Use a separate test database.
-   You can use mock API keys for unit and integration tests.
-   For live API tests, use the `*_LIVE_TEST=1` flags with caution. Ensure you have sufficient API credits and are aware of the costs.

## 7. Troubleshooting

-   **API Key Errors**: Double-check that your API keys are correct and have the necessary permissions.
-   **Database Connection**: Ensure your `DATABASE_URL` is correct and the database server is running.
-   **Rate Limiting**: If you encounter rate limit errors, check the configured `*_RATE_LIMIT` values and consider upgrading your API plan if necessary.
-   **Missing Dependencies**: Run `pnpm install` again to ensure all packages are correctly installed.
