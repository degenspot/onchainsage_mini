# Troubleshooting Guide

This guide provides solutions to common issues you might encounter while setting up and running the OnChainSage application.

## 1. Environment and Configuration Issues

#### Issue: `FATAL: database "onchainsage" does not exist`

-   **Solution**: Ensure your PostgreSQL server is running and you have created the database specified in your `DATABASE_URL`. You can create it with `createdb onchainsage`.

#### Issue: Missing API Keys

-   **Solution**: Run the environment validation script (`pnpm validate:env`) to check for missing API keys. Refer to `docs/ENVIRONMENT_SETUP.md` for instructions on how to obtain and set them.

#### Issue: Rate Limit Errors from APIs

-   **Solution**: You may have exceeded the free tier limits of an API. Check the `*_RATE_LIMIT` variables in your `.env` file and adjust them if necessary. For production, consider upgrading to a paid plan for the respective service.

## 2. API Integration Problems

#### Issue: DexScreener is not finding any pairs.

-   **Solution**: The DexScreener API can sometimes be unreliable. Check their official status page. Also, ensure your search queries in the code are valid. Enable `DEBUG_DEX=1` for more detailed logs.

#### Issue: Twitter scraper fails or returns no data.

-   **Solution**: Twitter scraping can be fragile. The underlying library might need an update, or your IP could be temporarily blocked. Try again after some time.

#### Issue: Hugging Face API returns errors.

-   **Solution**: This could be due to an invalid API key, the model being currently unavailable, or exceeding your quota. Verify your key and check the Hugging Face status page.

## 3. Queue and Processing Issues

#### Issue: Jobs are stuck in the queue and not being processed.

-   **Solution**:
    1.  Use the monitor script (`pnpm monitor:pipeline`) to check the status of the queues.
    2.  Ensure the worker application is running (`pnpm -F worker start:dev`).
    3.  Check the worker logs for any errors that might be causing jobs to fail and get stuck.
    4.  Verify that your Redis server is running and accessible.

## 4. Data Quality and Performance

#### Issue: Sentiment scores are inaccurate or missing.

-   **Solution**: Check the Hugging Face model you are using. Some models are better suited for financial text than others. Also, ensure that the tweets being analyzed are in English and of sufficient length.

#### Issue: The pipeline is running slowly.

-   **Solution**: Performance depends heavily on the rate limits of the external APIs. You can try to increase the rate limits in your `.env` file if your API plan allows. Also, monitor the database for slow queries.

## 5. WebSocket and Frontend Issues

#### Issue: Real-time updates are not appearing on the frontend.

-   **Solution**:
    1.  Check the browser's developer console for any WebSocket connection errors.
    2.  Ensure the `FRONTEND_ORIGIN` in your `.env` file matches the URL of your frontend application.
    3.  Verify that the API gateway is running and connected to Redis.
    4.  Check the Redis pub/sub channels (`prophecies:today`, `signals:live`) to see if messages are being published.

## 6. General Debugging Steps

1.  **Check the logs**: Each application (`api`, `worker`) produces logs. They are the first place to look for errors.
2.  **Validate your environment**: Run `pnpm validate:env` to catch common configuration issues.
3.  **Run the E2E test**: `pnpm test:pipeline` can help pinpoint which part of the pipeline is failing.
4.  **Isolate the problem**: Try to run components in isolation to identify the source of the issue.
