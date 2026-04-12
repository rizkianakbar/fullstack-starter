import { z } from "zod";
import {
	defineOpenAPI,
	defineOpenAPIEndpoint,
} from "#api/primitives/openapi.ts";

const WebhookEventSchema = z.object({
	id: z.string(),
	type: z.literal("payment.status_changed"),
	data: z.object({
		paymentId: z.string(),
		newStatus: z.enum(["processing", "completed", "failed"]),
		previousStatus: z.enum(["pending", "processing"]),
	}),
});

/**
 * Webhook handler for payment status updates from external provider.
 */
export default defineOpenAPI({
	POST: defineOpenAPIEndpoint({
		summary: "Handle payment status webhook",
		requestBody: WebhookEventSchema,
		responses: {
			200: {
				description: "Webhook processed",
				schema: z.object({ received: z.boolean() }),
			},
			401: {
				description: "Invalid signature",
				schema: z.object({ error: z.string() }),
			},
		},
		async handler({ ctx, body, request, response }) {
			return response.ok({ received: true });
		},
	}),
});
