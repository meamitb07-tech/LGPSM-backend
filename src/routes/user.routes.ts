import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { updateProfileSchema, createUserSchema } from '../validators/user.validator';
import { Request, Response, NextFunction } from 'express';
import { authorizeRoles } from '../middlewares/authorizeRoles';
import { Role } from '../models/User';

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

// Endpoint for Admins and Organizers to create sub-users
router.post(
  '/', 
  authorizeRoles(Role.ADMIN, Role.ORGANIZER), 
  validate(createUserSchema), 
  userController.createUser
);

export default router;
