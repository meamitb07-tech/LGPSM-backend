import { z } from 'zod';

import { Role } from '../models/User';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  profile: z.record(z.string(), z.any()).optional()
}).strict();

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum([Role.ADMIN, Role.ORGANIZER, Role.SYSTEM_USER])
}).strict();
