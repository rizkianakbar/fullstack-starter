import crypto from "node:crypto";
import { describe, expect } from "vitest";
import { apiKeys, payments, users } from "#api/databases/schema.ts";
import { defineTestAppContext, serverTest } from "#api/lib/testing/utils.ts";
import { getPaymentById } from "#api/services/payments.ts";

/**
 * Helper to create a user in the test database.
 */
async function createUser(
	db: Parameters<typeof defineTestAppContext>[0]["db"],
) {
	const [user] = await db
		.insert(users)
		.values({ email: "test@example.com", name: "Test User" })
		.returning();

	return user;
}

/**
 * Helper to create an API key for a user.
 */
async function createApiKey(
	db: Parameters<typeof defineTestAppContext>[0]["db"],
	userId: string,
) {
	const rawKey = `test_${crypto.randomBytes(16).toString("hex")}`;
	const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
	const [apiKey] = await db
		.insert(apiKeys)
		.values({
			name: "Test Key",
			keyHash,
			prefix: rawKey.slice(0, 8),
			userId,
		})
		.returning();

	return { apiKey, rawKey };
}

/**
 * Helper to create a payment.
 */
async function createPayment(
	db: Parameters<typeof defineTestAppContext>[0]["db"],
	userId: string,
	overrides: Partial<typeof payments.$inferInsert> = {},
) {
	const [payment] = await db
		.insert(payments)
		.values({
			amount: 1000,
			currency: "USD",
			recipientEmail: "recipient@example.com",
			createdBy: userId,
			...overrides,
		})
		.returning();

	return payment;
}

/**
 * Simulates OpenAPI GET /v1/payments/:id handler logic for testing.
 * This follows the same pattern as the actual endpoint handler.
 */
async function callGetPaymentEndpoint(
	ctx: ReturnType<typeof defineTestAppContext>,
	params: { id: string },
) {
	if (!ctx.apiKey) {
		return { status: 401 as const, data: { error: "API key required" } };
	}

	const payment = await getPaymentById(ctx, params.id);
	if (!payment) {
		return { status: 404 as const, data: { error: "Payment not found" } };
	}

	if (payment.createdBy !== ctx.apiKey.userId) {
		return { status: 404 as const, data: { error: "Payment not found" } };
	}

	return { status: 200 as const, data: payment };
}

describe("GET /v1/payments/:id", () => {
	serverTest("should return payment for owner", async ({ container }) => {
		const user = await createUser(container.db);
		const { apiKey } = await createApiKey(container.db, user.id);
		const payment = await createPayment(container.db, user.id, {
			amount: 5000,
			description: "Test payment",
		});
		const ctx = defineTestAppContext(container, {
			apiKey: { id: apiKey.id, name: apiKey.name, userId: user.id },
		});
		const result = await callGetPaymentEndpoint(ctx, { id: payment.id });

		expect(result.status).toBe(200);
		if (result.status === 200) {
			expect(result.data.id).toBe(payment.id);
			expect(result.data.amount).toBe(5000);
			expect(result.data.description).toBe("Test payment");
		}
	});

	serverTest("should return 404 for non-owner", async ({ container }) => {
		const owner = await createUser(container.db);
		const payment = await createPayment(container.db, owner.id);
		const [otherUser] = await container.db
			.insert(users)
			.values({ email: "other@example.com", name: "Other User" })
			.returning();
		const { apiKey } = await createApiKey(container.db, otherUser.id);
		const ctx = defineTestAppContext(container, {
			apiKey: { id: apiKey.id, name: apiKey.name, userId: otherUser.id },
		});
		const result = await callGetPaymentEndpoint(ctx, { id: payment.id });

		expect(result.status).toBe(404);
		if (result.status === 404) {
			expect(result.data.error).toBe("Payment not found");
		}
	});

	serverTest("should return 401 without API key", async ({ container }) => {
		const user = await createUser(container.db);
		const payment = await createPayment(container.db, user.id);
		const ctx = defineTestAppContext(container);
		const result = await callGetPaymentEndpoint(ctx, { id: payment.id });

		expect(result.status).toBe(401);
		if (result.status === 401) {
			expect(result.data.error).toBe("API key required");
		}
	});

	serverTest(
		"should return 404 for non-existent payment",
		async ({ container }) => {
			const user = await createUser(container.db);
			const { apiKey } = await createApiKey(container.db, user.id);
			const ctx = defineTestAppContext(container, {
				apiKey: { id: apiKey.id, name: apiKey.name, userId: user.id },
			});
			const result = await callGetPaymentEndpoint(ctx, {
				id: "00000000-0000-0000-0000-000000000000",
			});

			expect(result.status).toBe(404);
			if (result.status === 404) {
				expect(result.data.error).toBe("Payment not found");
			}
		},
	);
});
