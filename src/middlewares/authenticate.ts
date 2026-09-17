import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. Missing Bearer token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      return;
    }

    // Verify user still exists and is active
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, message: 'User no longer exists.' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'User account is inactive.' });
      return;
    }

    // Attach user payload
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};
