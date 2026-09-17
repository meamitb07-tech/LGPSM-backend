import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  process.env.JWT_SECRET = 'test_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Authentication Flow', () => {
  let userToken: string;
  let refreshToken: string;

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
    // Ensure password hash is NOT returned
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('should reject duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should login and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    
    userToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should access protected profile route with token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('should refresh the access token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });
});
