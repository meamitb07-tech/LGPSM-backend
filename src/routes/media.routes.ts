import { Router, Request, Response, NextFunction } from 'express';
import { mediaController } from '../controllers/media.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { Role } from '../models/User';
import { presignMediaSchema } from '../validators/media.validator';
import { ZodSchema } from 'zod';

const router = Router();

const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body });
    next();
  } catch (err: any) {
    res.status(400).json({ error: 'Validation Error', message: 'Invalid input data', details: err.errors });
  }
};

// Media endpoints require authentication and ORGANIZER role
router.post('/presign', authenticate, authorizeRoles(Role.ORGANIZER), validate(presignMediaSchema), mediaController.presign);

export default router;
