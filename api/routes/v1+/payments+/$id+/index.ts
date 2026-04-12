import { z } from "zod";
import {
	defineOpenAPI,
	defineOpenAPIEndpoint,
} from "#api/primitives/openapi.ts";
import { getPaymentById } from "#api/services/payments.ts";

const PaymentSchema = z.object({
	id: z.string(),
	amount: z.number(),
	currency: z.string(),
	status: z.enum(["pending", "processing", "completed", "failed"]),
	recipientEmail: z.string().email(),
	description: z.string().nullable(),
	createdAt: z.string(),
});

/**
 * Single payment endpoint.
 */
export default defineOpenAPI({
	GET: defineOpenAPIEndpoint({
		summary: "Get payment by ID",
		params: z.object({ id: z.string().uuid() }),
		responses: {
			200: { description: "Payment found", schema: PaymentSchema },
			401: {
				description: "Unauthorized",
				schema: z.object({ error: z.string() }),
			},
			404: {
				description: "Payment not found",
				schema: z.object({ error: z.string() }),
			},
		},
		async handler({ ctx, params, response }) {
			if (!ctx.apiKey) {
				return response.unauthorized({ error: "API key required" });
			}

			const payment = await getPaymentById(ctx, params.id);

			if (!payment) {
				return response.notFound({ error: "Payment not found" });
			}

			// Ensure user owns this payment.
			if (payment.createdBy !== ctx.apiKey.userId) {
				return response.notFound({ error: "Payment not found" });
			}

			return response.ok(payment);
		},
	}),
});
