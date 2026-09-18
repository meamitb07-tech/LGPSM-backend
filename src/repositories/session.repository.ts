import { Session, ISession } from '../models/Session';

export const sessionRepository = {
  async create(data: Partial<ISession>): Promise<ISession> {
    const session = new Session(data);
    return await session.save();
  },

  async findByEventId(eventId: string, options: { sort?: any; skip?: number; limit?: number } = {}): Promise<ISession[]> {
    let query = Session.find({ eventId });
    if (options.sort) {
      query = query.sort(options.sort);
    }
    if (options.skip !== undefined) {
      query = query.skip(options.skip);
    }
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    return await query.exec();
  },

  async countByEventId(eventId: string): Promise<number> {
    return await Session.countDocuments({ eventId });
  },

  async findById(sessionId: string): Promise<ISession | null> {
    return await Session.findById(sessionId);
  },

  async update(sessionId: string, data: Partial<ISession>): Promise<ISession | null> {
    return await Session.findByIdAndUpdate(sessionId, data, { new: true, runValidators: true });
  },

  async delete(sessionId: string): Promise<ISession | null> {
    return await Session.findByIdAndDelete(sessionId);
  }
};
