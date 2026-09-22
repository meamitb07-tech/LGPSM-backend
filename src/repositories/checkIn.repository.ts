import { CheckIn, ICheckIn } from '../models/CheckIn';
import mongoose from 'mongoose';

export const checkInRepository = {
  async create(data: Partial<ICheckIn>): Promise<ICheckIn> {
    const checkIn = new CheckIn(data);
    return await checkIn.save();
  },

  async findByInviteeAndSession(inviteeId: string, sessionId: string): Promise<ICheckIn | null> {
    return await CheckIn.findOne({
      inviteeId: new mongoose.Types.ObjectId(inviteeId),
      sessionId: new mongoose.Types.ObjectId(sessionId)
    });
  },

  async findEventWideCheckIn(inviteeId: string, eventId: string): Promise<ICheckIn | null> {
    return await CheckIn.findOne({
      inviteeId: new mongoose.Types.ObjectId(inviteeId),
      eventId: new mongoose.Types.ObjectId(eventId),
      sessionId: null
    });
  },

  async findOtherSessionCheckIns(inviteeId: string, eventId: string, currentSessionId?: string): Promise<ICheckIn[]> {
    const filter: any = {
      inviteeId: new mongoose.Types.ObjectId(inviteeId),
      eventId: new mongoose.Types.ObjectId(eventId),
      sessionId: { $ne: null }
    };
    if (currentSessionId) {
      filter.sessionId = { $ne: new mongoose.Types.ObjectId(currentSessionId) };
    }
    return await CheckIn.find(filter);
  },

  async findByInviteeAndEvent(inviteeId: string, eventId: string): Promise<ICheckIn[]> {
    return await CheckIn.find({
      inviteeId: new mongoose.Types.ObjectId(inviteeId),
      eventId: new mongoose.Types.ObjectId(eventId)
    });
  },

  async findEventCheckIns(
    eventId: string,
    options: {
      sessionId?: string;
      checkInMethod?: string;
      allowedSessionIds?: string[];
      skip?: number;
      limit?: number;
    } = {}
  ): Promise<ICheckIn[]> {
    const filter: any = { eventId: new mongoose.Types.ObjectId(eventId) };

    if (options.sessionId) {
      filter.sessionId = new mongoose.Types.ObjectId(options.sessionId);
    } else if (options.allowedSessionIds && options.allowedSessionIds.length > 0) {
      filter.sessionId = { $in: options.allowedSessionIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (options.checkInMethod) {
      filter.checkInMethod = options.checkInMethod;
    }

    let query = CheckIn.find(filter)
      .populate('inviteeId', 'name email mobile dietaryPreference rsvpStatus')
      .populate('sessionId', 'name schedule')
      .populate('checkedInBy', 'fullName email role')
      .sort({ checkInAt: -1 });

    if (options.skip !== undefined) {
      query = query.skip(options.skip);
    }
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }

    return await query.exec();
  },

  async countEventCheckIns(
    eventId: string,
    options: {
      sessionId?: string;
      checkInMethod?: string;
      allowedSessionIds?: string[];
    } = {}
  ): Promise<number> {
    const filter: any = { eventId: new mongoose.Types.ObjectId(eventId) };

    if (options.sessionId) {
      filter.sessionId = new mongoose.Types.ObjectId(options.sessionId);
    } else if (options.allowedSessionIds && options.allowedSessionIds.length > 0) {
      filter.sessionId = { $in: options.allowedSessionIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (options.checkInMethod) {
      filter.checkInMethod = options.checkInMethod;
    }

    return await CheckIn.countDocuments(filter);
  }
};
