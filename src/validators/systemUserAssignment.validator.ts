import { z } from 'zod';

export const createAssignmentSchema = z.object({
  body: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    sessionIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID')).default([])
  })
});

export const updateAssignmentSchema = z.object({
  body: z.object({
    sessionIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID'))
  })
});
