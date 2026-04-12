import { sql } from "drizzle-orm";
import { index, pgTable } from "drizzle-orm/pg-core";

/**
 * Users table for authentication.
 */
export const users = pgTable("users", (t) => ({
	id: t.text("id").primaryKey().default(sql`uuidv7()`),
	email: t.text("email").notNull().unique(),
	emailVerified: t.boolean("email_verified").notNull().default(false),
	name: t.text("name").notNull(),
	image: t.text("image"),
	createdAt: t
		.timestamp("created_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: t
		.timestamp("updated_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
}));

/**
 * Sessions table for Better Auth.
 */
export const sessions = pgTable("sessions", (t) => ({
	id: t.text("id").primaryKey().default(sql`uuidv7()`),
	userId: t
		.text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	token: t.text("token").notNull().unique(),
	expiresAt: t
		.timestamp("expires_at", { withTimezone: true, mode: "string" })
		.notNull(),
	ipAddress: t.text("ip_address"),
	userAgent: t.text("user_agent"),
	createdAt: t
		.timestamp("created_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: t
		.timestamp("updated_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
}));

/**
 * Accounts table for Better Auth.
 */
export const accounts = pgTable("accounts", (t) => ({
	id: t.text("id").primaryKey().default(sql`uuidv7()`),
	userId: t
		.text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	accountId: t.text("account_id").notNull(),
	providerId: t.text("provider_id").notNull(),
	accessToken: t.text("access_token"),
	refreshToken: t.text("refresh_token"),
	accessTokenExpiresAt: t.timestamp("access_token_expires_at", {
		withTimezone: true,
		mode: "string",
	}),
	refreshTokenExpiresAt: t.timestamp("refresh_token_expires_at", {
		withTimezone: true,
		mode: "string",
	}),
	scope: t.text("scope"),
	password: t.text("password"),
	createdAt: t
		.timestamp("created_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: t
		.timestamp("updated_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
}));

/**
 * Verifications table for Better Auth.
 */
export const verifications = pgTable("verifications", (t) => ({
	id: t.text("id").primaryKey().default(sql`uuidv7()`),
	identifier: t.text("identifier").notNull(),
	value: t.text("value").notNull(),
	expiresAt: t
		.timestamp("expires_at", { withTimezone: true, mode: "string" })
		.notNull(),
	createdAt: t
		.timestamp("created_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
	updatedAt: t
		.timestamp("updated_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
}));

/**
 * API keys table for external API authentication.
 */
export const apiKeys = pgTable(
	"api_keys",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`uuidv7()`),
		name: t.text("name").notNull(),
		keyHash: t.text("key_hash").notNull(),
		prefix: t.text("prefix").notNull(),
		userId: t
			.text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expiresAt: t.timestamp("expires_at", {
			withTimezone: true,
			mode: "string",
		}),
		createdAt: t
			.timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	}),
	(t) => [
		index("api_keys_user_id_idx").on(t.userId),
		index("api_keys_prefix_idx").on(t.prefix),
	],
);

/**
 * Payment status enum values.
 */
export const paymentStatuses = [
	"pending",
	"processing",
	"completed",
	"failed",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

/**
 * Payments table
 */
export const payments = pgTable(
	"payments",
	(t) => ({
		id: t.text("id").primaryKey().default(sql`uuidv7()`),
		amount: t.integer("amount").notNull(),
		currency: t.text("currency").notNull().default("USD"),
		status: t
			.text("status")
			.notNull()
			.default("pending")
			.$type<PaymentStatus>(),
		recipientEmail: t.text("recipient_email").notNull(),
		description: t.text("description"),
		lastWebhookId: t.text("last_webhook_id"),
		createdBy: t
			.text("created_by")
			.notNull()
			.references(() => users.id),
		createdAt: t
			.timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: t
			.timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	}),
	(t) => [
		index("payments_created_by_idx").on(t.createdBy),
		index("payments_status_idx").on(t.status),
	],
);
