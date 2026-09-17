import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/User';

export const authorizeRoles = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
      return;
    }

    next();
  };
};
