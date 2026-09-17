import { z } from 'zod';
import { EventFormat, EventStatus } from '../models/Event';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
    description: z.string().min(1, 'Description is required'),
    categoryId: objectIdSchema,
    subcategoryId: objectIdSchema.optional(),
    format: z.nativeEnum(EventFormat),
    location: z.object({
      address: z.string().optional(),
      coordinates: z.tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90)
      ]).optional()
    }).optional(),
    contactNumber: z.string().optional(),
    schedule: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }).refine(data => new Date(data.start) < new Date(data.end), {
      message: "End time must be after start time",
      path: ["end"]
    }),
    rsvp: z.object({
      enabled: z.boolean(),
      acceptanceLastDate: z.string().datetime().optional(),
      allowAllInvited: z.boolean(),
      allowNotResponded: z.boolean(),
      allowDeclined: z.boolean()
    }).optional(),
    attendeeSettings: z.object({
      thresholdLimit: z.number().positive().optional()
    }).optional(),
    dietaryPreference: z.object({
      enabled: z.boolean(),
      title: z.string().optional(),
      options: z.array(z.any()).optional()
    }).optional(),
    templateId: objectIdSchema.optional(),
    media: z.object({
      logoKey: z.string().optional(),
      bannerKey: z.string().optional()
    }).optional()
  }).superRefine((data, ctx) => {
    if (data.format === EventFormat.PHYSICAL && !data.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Location is required for physical events",
        path: ["location"]
      });
    }
  })
});

export const updateEventSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().min(1).optional(),
    categoryId: objectIdSchema.optional(),
    subcategoryId: objectIdSchema.optional(),
    format: z.nativeEnum(EventFormat).optional(),
    location: z.object({
      address: z.string().optional(),
      coordinates: z.tuple([
        z.number().min(-180).max(180),
        z.number().min(-90).max(90)
      ]).optional()
    }).optional(),
    contactNumber: z.string().optional(),
    schedule: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }).refine(data => new Date(data.start) < new Date(data.end), {
      message: "End time must be after start time",
      path: ["end"]
    }).optional(),
    rsvp: z.object({
      enabled: z.boolean(),
      acceptanceLastDate: z.string().datetime().optional(),
      allowAllInvited: z.boolean(),
      allowNotResponded: z.boolean(),
      allowDeclined: z.boolean()
    }).optional(),
    attendeeSettings: z.object({
      thresholdLimit: z.number().positive().optional()
    }).optional(),
    dietaryPreference: z.object({
      enabled: z.boolean(),
      title: z.string().optional(),
      options: z.array(z.any()).optional()
    }).optional(),
    templateId: objectIdSchema.optional(),
    media: z.object({
      logoKey: z.string().optional(),
      bannerKey: z.string().optional()
    }).optional(),
    status: z.nativeEnum(EventStatus).optional()
  })
});
