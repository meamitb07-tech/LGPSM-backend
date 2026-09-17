import { Request, Response, NextFunction } from 'express';
import { mediaService } from '../services/media.service';

export const mediaController = {
  async presign(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName, fileType } = req.body;
      const result = await mediaService.generatePresignedUrl(fileName, fileType);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};
