import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  type: z.string().min(1),
  title: z.string().min(1).max(150),
  message: z.string().min(1),
  entityType: z.string().optional(),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
});
