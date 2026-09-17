import { mediaService } from '../src/services/media.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock the AWS SDK
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn()
}));
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn()
}));

// Mock env
jest.mock('../src/config/env', () => ({
  env: {
    AWS_S3_BUCKET: 'test-bucket'
  }
}));

describe('Media Service', () => {
  it('should generate a presigned URL', async () => {
    (getSignedUrl as jest.Mock).mockResolvedValue('https://mocked-url.com');

    const result = await mediaService.generatePresignedUrl('test-image.png', 'image/png');

    expect(result).toHaveProperty('uploadUrl', 'https://mocked-url.com');
    expect(result).toHaveProperty('fileKey');
    expect(result.fileKey).toContain('test-image.png');
    expect(result.fileKey).toContain('events/');
  });

  it('should sanitize file names', async () => {
    (getSignedUrl as jest.Mock).mockResolvedValue('https://mocked-url.com');
    
    const result = await mediaService.generatePresignedUrl('invalid @ name!.png', 'image/png');
    expect(result.fileKey).toContain('invalid___name_.png');
  });
});
