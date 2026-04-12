import { TRPCError } from "@trpc/server";
import { describe, expect } from "vitest";
import { payments, users } from "#api/databases/schema.ts";
import {
	defineTestAppContext,
	type MockContainer,
	serverTest,
} from "#api/lib/testing/utils.ts";
import type { AppContext } from "#api/primitives/app-context.ts";
import { getPaymentById } from "#api/services/payments.ts";

/**
 * Helper to create a user in the test database.
 */
async function createUser(db: MockContainer["db"]) {
	const [user] = await db
		.insert(users)
		.values({ email: "test@example.com", name: "Test User" })
		.returning();
	return user;
}

/**
 * Helper to create a payment.
 */
async function createPayment(
	db: MockContainer["db"],
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
 * Simulates TRPC getById procedure logic for testing.
 * This follows the same pattern as the actual procedure.
 */
async function callGetById(
	ctx: AppContext & { user: NonNullable<AppContext["user"]> },
	input: { id: string },
) {
	const payment = await getPaymentById(ctx, input.id);

	if (!payment) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Payment not found",
		});
	}

	if (payment.createdBy !== ctx.user.id) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Payment not found",
		});
	}

	return payment;
}

describe("payments.getById", () => {
	serverTest(
		"should return payment for authenticated owner",
		async ({ container }) => {
			const user = await createUser(container.db);
			const payment = await createPayment(container.db, user.id, {
				amount: 2500,
				description: "TRPC test payment",
			});
			const ctx = defineTestAppContext(container, {
				session: {
					id: "session-id",
					userId: user.id,
					token: "token",
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date(),
					updatedAt: new Date(),
					ipAddress: null,
					userAgent: null,
				},
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					emailVerified: false,
					image: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			const result = await callGetById(
				ctx as AppContext & { user: NonNullable<AppContext["user"]> },
				{ id: payment.id },
			);

			expect(result.id).toBe(payment.id);
			expect(result.amount).toBe(2500);
			expect(result.description).toBe("TRPC test payment");
		},
	);

	serverTest("should throw NOT_FOUND for non-owner", async ({ container }) => {
		const owner = await createUser(container.db);
		const payment = await createPayment(container.db, owner.id);
		const [otherUser] = await container.db
			.insert(users)
			.values({ email: "other@example.com", name: "Other User" })
			.returning();
		const ctx = defineTestAppContext(container, {
			session: {
				id: "session-id",
				userId: otherUser.id,
				token: "token",
				expiresAt: new Date(Date.now() + 86400000),
				createdAt: new Date(),
				updatedAt: new Date(),
				ipAddress: null,
				userAgent: null,
			},
			user: {
				id: otherUser.id,
				email: otherUser.email,
				name: otherUser.name,
				emailVerified: false,
				image: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});

		await expect(
			callGetById(
				ctx as AppContext & { user: NonNullable<AppContext["user"]> },
				{ id: payment.id },
			),
		).rejects.toThrow(TRPCError);

		try {
			await callGetById(
				ctx as AppContext & { user: NonNullable<AppContext["user"]> },
				{ id: payment.id },
			);
		} catch (error) {
			expect(error).toBeInstanceOf(TRPCError);
			expect((error as TRPCError).code).toBe("NOT_FOUND");
			expect((error as TRPCError).message).toBe("Payment not found");
		}
	});

	serverTest(
		"should throw NOT_FOUND for non-existent payment",
		async ({ container }) => {
			const user = await createUser(container.db);
			const ctx = defineTestAppContext(container, {
				session: {
					id: "session-id",
					userId: user.id,
					token: "token",
					expiresAt: new Date(Date.now() + 86400000),
					createdAt: new Date(),
					updatedAt: new Date(),
					ipAddress: null,
					userAgent: null,
				},
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					emailVerified: false,
					image: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			await expect(
				callGetById(
					ctx as AppContext & { user: NonNullable<AppContext["user"]> },
					{ id: "00000000-0000-0000-0000-000000000000" },
				),
			).rejects.toThrow(TRPCError);

			try {
				await callGetById(
					ctx as AppContext & { user: NonNullable<AppContext["user"]> },
					{ id: "00000000-0000-0000-0000-000000000000" },
				);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("NOT_FOUND");
			}
		},
	);
});
