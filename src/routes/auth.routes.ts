import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { 
  registerSchema, loginSchema, googleAuthSchema, 
  refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema 
} from '../validators/auth.validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Middleware to validate body using Zod
const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, errors: result.error.format() });
  }
  req.body = result.data;
  next();
};

router.use(authRateLimiter);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleAuthSchema), authController.googleAuth);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout); // logout might not need strict validation if token is missing it just does nothing
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
