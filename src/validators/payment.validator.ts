import { z } from 'zod';

export const createOrderSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  ticketTierId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  quantity: z.number().int().positive()
});

export const verifyPaymentSchema = z.object({
  providerOrderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  signature: z.string().optional()
});
