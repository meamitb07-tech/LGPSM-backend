import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';

export const userController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw { statusCode: 401, message: 'Unauthorized' };
      const user = await userService.getProfile(req.user.userId);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw { statusCode: 401, message: 'Unauthorized' };
      const user = await userService.updateProfile(req.user.userId, req.body);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
};
