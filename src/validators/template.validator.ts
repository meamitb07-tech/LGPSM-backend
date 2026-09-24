import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  subcategoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  previewImageKey: z.string().optional(),
  templateData: z.record(z.string(), z.any()).optional(),
  isSystemTemplate: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export const updateTemplateSchema = createTemplateSchema.partial();
