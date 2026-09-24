import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  subcategories: z.array(z.object({
    name: z.string().min(1),
    isActive: z.boolean().optional()
  })).optional(),
  isActive: z.boolean().optional()
});

export const updateCategorySchema = createCategorySchema.partial();
