"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = exports.MediaService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3_config_1 = __importDefault(require("../config/s3.config"));
const env_1 = require("../config/env");
const crypto_1 = __importDefault(require("crypto"));
class MediaService {
    async generatePresignedUrl(fileName, fileType) {
        const bucket = env_1.env.AWS_S3_BUCKET;
        if (!bucket) {
            throw new Error('S3_NOT_CONFIGURED');
        }
        // Generate unique key
        const uniqueId = crypto_1.default.randomBytes(16).toString('hex');
        const extension = fileType === 'image/jpeg' ? 'jpg' : 'png';
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileKey = `events/${uniqueId}/${sanitizedFileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucket,
            Key: fileKey,
            ContentType: fileType,
        });
        // 15 minutes expiration
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_config_1.default, command, { expiresIn: 900 });
        return { uploadUrl, fileKey };
    }
}
exports.MediaService = MediaService;
exports.mediaService = new MediaService();
