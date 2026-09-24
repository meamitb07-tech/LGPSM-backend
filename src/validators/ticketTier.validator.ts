import { z } from 'zod';

export const createTicketTierSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  currency: z.string().optional(),
  capacity: z.number().int().positive(),
  isActive: z.boolean().optional()
});

export const updateTicketTierSchema = createTicketTierSchema.partial();
