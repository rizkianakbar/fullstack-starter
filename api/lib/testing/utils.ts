import type { Request } from 'ultimate-express';
import { test } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { relations } from '#api/databases/relations.ts';
import * as schema from '#api/databases/schema.ts';
import type { AppContext } from '#api/primitives/app-context.ts';
import { defineAuth } from '#api/primitives/auth.ts';
import { defineConfig } from '#api/primitives/config.ts';
import { defineTestDatabase } from '#api/primitives/database.ts';
import type { Logger } from '#api/primitives/logger.ts';

/**
 * The mock container type.
 */
export type MockContainer = Awaited<ReturnType<typeof defineMockContainer>>['container'];

/**
 * Defines a mock container with isolated test database for testing.
 *
 * @returns Container with test database and cleanup function.
 *
 * @example
 * ```typescript
 * const { container, cleanUp } = await defineMockContainer();
 * await container.db.insert(users).values({...});
 * await cleanUp();
 * ```
 */
export async function defineMockContainer() {
  const config = defineConfig();
  const logger = mock<Logger>();
  const { db, cleanUp: dbCleanUp } = await defineTestDatabase({
    connectionString: config.DATABASE_URL,
    logger,
    name: 'fullstack-starter',
    relations,
    schema,
  });
  const auth = defineAuth({
    config,
    db,
    logger,
  });

  return {
    container: {
      auth,
      config,
      db,
      logger,
    },
    cleanUp: async () => {
      await dbCleanUp();
    },
  };
}

/**
 * Server-side test that provides an isolated test database with automatic
 * cleanup. Each test gets its own PostgreSQL database for complete isolation.
 *
 * @example
 * ```typescript
 * import { serverTest } from "#api/lib/testing/utils.ts";
 * import { users, payments } from "#api/databases/schema.ts";
 *
 * serverTest("creates payment", async ({ container }) => {
 *   // Create a test user
 *   const [user] = await container.db
 *     .insert(users)
 *     .values({ email: "test@example.com", name: "Test" })
 *     .returning();
 *
 *   // Create a payment
 *   const [payment] = await container.db
 *     .insert(payments)
 *     .values({
 *       amount: 1000,
 *       recipientEmail: "recipient@example.com",
 *       createdBy: user.id,
 *     })
 *     .returning();
 *
 *   expect(payment.amount).toBe(1000);
 * });
 * ```
 */
export const serverTest = test.extend<{
  container: MockContainer;
}>({
  async container({}, use) {
    const { container, cleanUp } = await defineMockContainer();
    await use(container);
    await cleanUp();
  },
});

/**
 * Creates a properly typed AppContext for testing.
 * Uses mock<Request>() to avoid type assertion issues.
 *
 * @example
 * ```typescript
 * const ctx = defineTestAppContext(container, {
 *   apiKey: { id: "key-id", name: "Test Key", userId: user.id },
 * });
 * ```
 */
export function defineTestAppContext(
  container: MockContainer,
  overrides: {
    apiKey?: AppContext['apiKey'];
    session?: AppContext['session'];
    user?: AppContext['user'];
  } = {},
): AppContext {
  return {
    apiKey: overrides.apiKey ?? null,
    container,
    request: mock<Request>(),
    session: overrides.session ?? null,
    user: overrides.user ?? null,
  };
}
