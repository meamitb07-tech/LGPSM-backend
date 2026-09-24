import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../src/app';
import { User, Role } from '../src/models/User';
import { Event } from '../src/models/Event';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generateAccessToken } from '../src/utils/token';

const request = supertest(app);

describe('New Modules (Category, Template, Notification, AuditLog, Report, TicketTier, Payment)', () => {
  jest.setTimeout(60000);

  let mongoServer: MongoMemoryServer;
  let adminToken: string;
  let adminId: string;
  let organizerToken: string;
  let organizerId: string;
  let eventId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});

    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: Role.ADMIN,
      passwordHash: 'hash'
    });
    adminId = (admin._id as any).toString();
    adminToken = generateAccessToken(adminId, Role.ADMIN);

    const organizer = await User.create({
      fullName: 'Organizer User',
      email: 'organizer@example.com',
      role: Role.ORGANIZER,
      passwordHash: 'hash'
    });
    organizerId = (organizer._id as any).toString();
    organizerToken = generateAccessToken(organizerId, Role.ORGANIZER);

    const event = await Event.create({
      organizerId: new mongoose.Types.ObjectId(organizerId),
      title: 'Report Test Event',
      description: 'Test Desc',
      categoryId: new mongoose.Types.ObjectId(),
      format: 'PHYSICAL' as any,
      schedule: { start: new Date(), end: new Date() }
    });
    eventId = (event._id as any).toString();
  });

  it('Category API: should create and retrieve categories', async () => {
    const createRes = await request
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Technology',
        description: 'Tech conferences & workshops',
        subcategories: [{ name: 'AI & ML' }, { name: 'Web Dev' }]
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Technology');

    const getRes = await request.get('/api/v1/categories');
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].subcategories.length).toBe(2);
  });

  it('Template API: should create and list templates', async () => {
    const createRes = await request
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Modern Dark Invitation',
        isSystemTemplate: true,
        templateData: { theme: 'dark', font: 'Inter' }
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe('Modern Dark Invitation');

    const getRes = await request
      .get('/api/v1/templates')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(1);
  });

  it('Notification API: should list and mark notifications as read', async () => {
    const getRes = await request
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);

    const markAllRes = await request
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(markAllRes.status).toBe(200);
  });

  it('AuditLog API: should retrieve audit logs', async () => {
    const getRes = await request
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body.data)).toBe(true);
  });

  it('Report API: should return dashboard and event analytics', async () => {
    const dashRes = await request
      .get('/api/v1/reports/dashboard')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.totalEvents).toBe(1);

    const eventRepRes = await request
      .get(`/api/v1/reports/events/${eventId}`)
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(eventRepRes.status).toBe(200);
    expect(eventRepRes.body.data.event.title).toBe('Report Test Event');
  });

  it('TicketTier & Payment API: should create ticket tier, order tickets and verify payment', async () => {
    // 1. Create Ticket Tier
    const tierRes = await request
      .post(`/api/v1/events/${eventId}/tickets`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'VIP Pass',
        price: 1500,
        capacity: 100
      });

    expect(tierRes.status).toBe(201);
    const tierId = tierRes.body.data._id;

    // 2. Create Ticket Order
    const orderRes = await request
      .post('/api/v1/payments/order')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        eventId,
        ticketTierId: tierId,
        quantity: 2
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.order.amount).toBe(3000);
    const providerOrderId = orderRes.body.data.payment.providerOrderId;

    // 3. Verify Payment & Generate Invoice
    const verifyRes = await request
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        providerOrderId,
        providerPaymentId: 'pay_rzp_mock123'
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.order.status).toBe('PAID');
    expect(verifyRes.body.data.invoice.invoiceNumber).toContain('INV-');
  });
});
