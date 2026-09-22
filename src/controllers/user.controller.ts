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
  },

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw { statusCode: 401, message: 'Unauthorized' };
      const user = await userService.createUser(req.user.role, req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw { statusCode: 401, message: 'Unauthorized' };
      const roleFilter = req.query.role as string | undefined;
      const users = await userService.getUsers(roleFilter);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
};
