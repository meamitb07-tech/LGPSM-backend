import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3.config';
import { env } from '../config/env';
import crypto from 'crypto';

export class MediaService {
  async generatePresignedUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileKey: string }> {
    const bucket = env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error('S3_NOT_CONFIGURED');
    }

    // Generate unique key
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const extension = fileType === 'image/jpeg' ? 'jpg' : 'png';
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const fileKey = `events/${uniqueId}/${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: fileType,
    });

    // 15 minutes expiration
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return { uploadUrl, fileKey };
  }
}

export const mediaService = new MediaService();
