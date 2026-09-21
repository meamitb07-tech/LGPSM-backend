import mongoose from 'mongoose';
import { invitationService } from '../src/services/invitation.service';
import { Event } from '../src/models/Event';
import { Invitee, InvitationStatus, RsvpStatus } from '../src/models/Invitee';
import { Invitation, DeliveryChannel, InvitationDeliveryStatus } from '../src/models/Invitation';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Mock email provider
jest.mock('../src/utils/email.provider', () => ({
  sendEmail: jest.fn()
}));
import { sendEmail } from '../src/utils/email.provider';

describe('Invitation Service', () => {
  jest.setTimeout(60000); // Increase timeout for MongoMemoryServer download/startup

  let mongoServer: MongoMemoryServer;
  let organizerId: mongoose.Types.ObjectId;
  let eventId: mongoose.Types.ObjectId;
  let inviteeId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await Event.deleteMany({});
    await Invitee.deleteMany({});
    await Invitation.deleteMany({});

    organizerId = new mongoose.Types.ObjectId();
    
    const event = await Event.create({
      organizerId,
      title: 'Test Event',
      description: 'Test Event Desc',
      categoryId: new mongoose.Types.ObjectId(),
      format: 'PHYSICAL' as any,
      location: { type: 'Point', address: '123 Test St', coordinates: [0, 0] } as any,
      schedule: { start: new Date(), end: new Date() }
    });
    eventId = (event as any)._id as mongoose.Types.ObjectId;

    const invitee = await Invitee.create({
      eventId,
      name: 'Test User',
      email: 'test@example.com',
      invitationStatus: InvitationStatus.PENDING,
      rsvpStatus: RsvpStatus.PENDING
    });
    inviteeId = invitee._id as mongoose.Types.ObjectId;
  });

  it('should send invitations successfully and update statuses', async () => {
    (sendEmail as jest.Mock).mockResolvedValue(true);

    const results = await invitationService.sendInvitations(eventId.toString(), organizerId.toString(), [inviteeId.toString()], DeliveryChannel.EMAIL);

    expect(results[0].status).toBe(InvitationDeliveryStatus.SENT);
    
    const invitee = await Invitee.findById(inviteeId);
    expect(invitee?.invitationStatus).toBe(InvitationStatus.SENT);
    expect(invitee?.qrTokenHash).toBeDefined();

    const invitation = await Invitation.findOne({ inviteeId });
    expect(invitation?.status).toBe(InvitationDeliveryStatus.SENT);
    expect(invitation?.tokenHash).toEqual(invitee?.qrTokenHash);
  });

  it('should not update Invitee token if provider fails', async () => {
    (sendEmail as jest.Mock).mockRejectedValue(new Error('PROVIDER_NOT_CONFIGURED'));

    const results = await invitationService.sendInvitations(eventId.toString(), organizerId.toString(), [inviteeId.toString()], DeliveryChannel.EMAIL);

    expect(results[0].status).toBe(InvitationDeliveryStatus.FAILED);
    expect(results[0].failureReason).toBe('Email provider not configured');
    
    const invitee = await Invitee.findById(inviteeId);
    expect(invitee?.invitationStatus).toBe(InvitationStatus.FAILED);
    expect(invitee?.qrTokenHash).toBeUndefined(); // Should not have set the token

    const invitation = await Invitation.findOne({ inviteeId });
    expect(invitation?.status).toBe(InvitationDeliveryStatus.FAILED);
    expect(invitation?.tokenHash).toBeDefined(); // Still recorded the token we tried to send
  });

  it('resend should create a new history record and keep old token valid on failure', async () => {
    // 1. Successful first send
    (sendEmail as jest.Mock).mockResolvedValueOnce(true);
    await invitationService.sendInvitations(eventId.toString(), organizerId.toString(), [inviteeId.toString()], DeliveryChannel.EMAIL);
    
    const invitee = await Invitee.findById(inviteeId);
    const oldTokenHash = invitee?.qrTokenHash;
    const oldInvitation = await Invitation.findOne({ inviteeId });

    // 2. Failed resend
    (sendEmail as jest.Mock).mockRejectedValueOnce(new Error('SMTP_ERROR'));
    await invitationService.resendInvitations(eventId.toString(), organizerId.toString(), [oldInvitation!._id.toString()]);

    const inviteeAfterFail = await Invitee.findById(inviteeId);
    expect(inviteeAfterFail?.qrTokenHash).toBe(oldTokenHash); // Token unchanged!

    const history = await Invitation.find({ inviteeId }).sort({ createdAt: 1 });
    expect(history.length).toBe(2);
    expect(history[0].status).toBe(InvitationDeliveryStatus.SENT);
    expect(history[1].status).toBe(InvitationDeliveryStatus.FAILED);
  });
  
  it('should strictly verify event ownership', async () => {
    const wrongOrganizer = new mongoose.Types.ObjectId().toString();
    await expect(
      invitationService.sendInvitations(eventId.toString(), wrongOrganizer, [inviteeId.toString()], DeliveryChannel.EMAIL)
    ).rejects.toThrow('EVENT_NOT_FOUND');
  });
});
