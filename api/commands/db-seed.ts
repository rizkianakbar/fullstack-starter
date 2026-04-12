import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { reset } from "drizzle-seed";
import * as schema from "#api/databases/schema.ts";
import { defineCommand } from "#api/primitives/cli.ts";

function generateApiKey(): { key: string; prefix: string; hash: string } {
	const prefix = "pk_test";
	const random = randomBytes(24).toString("hex");
	const key = `${prefix}_${random}`;
	const hash = createHash("sha256").update(key).digest("hex");
	return { key, prefix, hash };
}

export const dbSeed = defineCommand({
	name: "db:seed",
	description: "Seed database with test data",
	async run(_args, container) {
		const db = container.db;

		await reset(db, schema);

		const [user] = await db
			.insert(schema.users)
			.values({
				email: "test@example.com",
				name: "Test User",
				emailVerified: true,
			})
			.returning();

		await db.insert(schema.accounts).values({
			userId: user.id,
			accountId: user.id,
			providerId: "credential",
			password: await hashPassword("password123"),
		});

		const { key, prefix, hash } = generateApiKey();
		await db.insert(schema.apiKeys).values({
			name: "Test API Key",
			keyHash: hash,
			prefix,
			userId: user.id,
		});

		await db.insert(schema.payments).values([
			{
				amount: 10000,
				currency: "USD",
				status: "completed",
				recipientEmail: "alice@example.com",
				description: "Invoice #001",
				createdBy: user.id,
			},
			{
				amount: 25000,
				currency: "USD",
				status: "processing",
				recipientEmail: "bob@example.com",
				description: "Invoice #002",
				createdBy: user.id,
			},
			{
				amount: 5000,
				currency: "USD",
				status: "pending",
				recipientEmail: "charlie@example.com",
				description: "Refund",
				createdBy: user.id,
			},
			{
				amount: 15000,
				currency: "USD",
				status: "failed",
				recipientEmail: "diana@example.com",
				description: "Invoice #003",
				createdBy: user.id,
			},
			{
				amount: 8500,
				currency: "USD",
				status: "completed",
				recipientEmail: "eve@example.com",
				description: "Subscription payment",
				createdBy: user.id,
			},
		]);

		console.log(
			`Seeded: user=test@example.com pass=password123 api_key=${key} payments=5`,
		);

		await db.$client.end();
	},
});
