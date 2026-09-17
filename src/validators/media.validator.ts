import { z } from 'zod';

export const presignMediaSchema = z.object({
  body: z.object({
    fileName: z.string().min(1, 'File name is required').regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid file name characters'),
    fileType: z.enum(['image/jpeg', 'image/png'], {
      message: 'Only image/jpeg and image/png are supported'
    })
  })
});
