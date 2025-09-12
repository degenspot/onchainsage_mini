# Comprehensive Testing Guide

This document outlines the testing strategy for the OnChainSage application, covering everything from unit tests to end-to-end pipeline validation.

## 1. Testing Strategy Overview

Our testing approach is multi-layered to ensure reliability and correctness at every level of the application:
-   **Unit Tests**: Focus on individual components (e.g., a single provider, a utility function) in isolation.
-   **Integration Tests**: Verify the interaction between components (e.g., a service and the database).
-   **End-to-End (E2E) Tests**: Validate the entire data pipeline from data ingestion to WebSocket broadcast.

## 2. Unit Testing

-   **Location**: Tests are co-located with the source code in `*.test.ts` files.
-   **Execution**: Run with `pnpm test` within a specific package (e.g., `pnpm -F ai test`).
-   **Mocking**: Dependencies like external APIs and databases should be mocked to ensure tests are fast and deterministic.

## 3. Integration Testing

-   **Objective**: To test the flow of data between services, queues, and the database.
-   **Setup**: Requires a running database and Redis instance. The `docker-compose.test.yml` can be used to set up a test environment.
-   **Execution**: Integration tests are typically part of the E2E test suite.

## 4. End-to-End Testing

The `scripts/test-pipeline.ts` script provides a comprehensive E2E test of the entire data pipeline.

-   **Prerequisites**:
    -   A fully configured `.env` file with valid API keys.
    -   Running database and Redis instances.
-   **Execution**:
    ```bash
    pnpm test:pipeline
    ```
-   **Validation**: The script checks each stage of the pipeline, from data fetching to prophecy generation, and reports success or failure.

## 5. Live API Testing

Testing against live APIs is crucial for ensuring the connectors work correctly, but it should be done with caution.

-   **Enabling Live Tests**: Set the `*_LIVE_TEST=1` environment variables (e.g., `DEX_LIVE_TEST=1`).
-   **Convenience Script**:
    ```bash
    pnpm test:live
    ```
-   **Considerations**:
    -   Live tests will consume API quotas and may incur costs.
    -   They are not deterministic and can fail due to network issues or API changes.
    -   Run them sparingly, for example, before a release or when making changes to a connector.

## 6. Error Scenario Testing

-   **Objective**: To ensure the system is resilient to failures.
-   **Methods**:
    -   Manually introduce failures (e.g., stop the database, provide an invalid API key).
    -   Observe the system's behavior. Check if fallbacks are triggered and if errors are logged correctly.
    -   The `test:pipeline` script includes some basic error handling checks.

## 7. Performance Testing

-   **Objective**: To ensure the pipeline can handle the expected load.
-   **Tools**: While no dedicated performance testing tools are integrated yet, the monitoring script (`scripts/monitor-pipeline.ts`) can be used to observe queue performance under load.
-   **Metrics**: Monitor job processing times, queue lengths, and resource (CPU/memory) usage.

## 8. Test Automation in CI/CD

-   The `validate:env` script should be run at the beginning of a CI pipeline to fail fast if the environment is misconfigured.
-   Unit tests should be run on every commit.
-   E2E tests (with mocked APIs) can be run on a schedule or before merging to the main branch.
-   Live API tests should generally not be run in automated CI pipelines unless carefully managed.
