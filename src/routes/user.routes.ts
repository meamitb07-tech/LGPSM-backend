import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { updateProfileSchema } from '../validators/user.validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();

const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, errors: result.error.format() });
  }
  req.body = result.data;
  next();
};

// All user routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);

export default router;
