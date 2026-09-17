"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaController = void 0;
const media_service_1 = require("../services/media.service");
exports.mediaController = {
    async presign(req, res, next) {
        try {
            const { fileName, fileType } = req.body;
            const result = await media_service_1.mediaService.generatePresignedUrl(fileName, fileType);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
};
