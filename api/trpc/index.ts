import { router } from "./init.ts";
import { paymentsRouter } from "./payments.ts";

/**
 * The main application router.
 */
export const appRouter = router({
	payments: paymentsRouter,
});

/**
 * Export type definition for use in the client.
 */
export type AppRouter = typeof appRouter;
