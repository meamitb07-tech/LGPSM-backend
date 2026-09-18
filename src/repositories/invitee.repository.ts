import { Invitee, IInvitee } from '../models/Invitee';

export const inviteeRepository = {
  async create(data: Partial<IInvitee>): Promise<IInvitee> {
    const invitee = new Invitee(data);
    return await invitee.save();
  },

  async insertMany(data: Partial<IInvitee>[]): Promise<IInvitee[]> {
    return await Invitee.insertMany(data) as any;
  },

  async findByEventId(eventId: string, options: { 
    filter?: any, 
    sort?: any, 
    skip?: number, 
    limit?: number 
  } = {}): Promise<IInvitee[]> {
    const filter = { eventId, ...(options.filter || {}) };
    let query = Invitee.find(filter);
    
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

  async countByEventId(eventId: string, filter: any = {}): Promise<number> {
    return await Invitee.countDocuments({ eventId, ...filter });
  },

  async findById(inviteeId: string): Promise<IInvitee | null> {
    return await Invitee.findById(inviteeId);
  },

  async findByEmailOrMobile(eventId: string, email?: string, mobile?: string): Promise<IInvitee[]> {
    const orConditions: any[] = [];
    if (email) orConditions.push({ email: email.toLowerCase() });
    if (mobile) orConditions.push({ mobile });

    if (orConditions.length === 0) return [];

    return await Invitee.find({ eventId, $or: orConditions });
  },

  async update(inviteeId: string, data: Partial<IInvitee>): Promise<IInvitee | null> {
    return await Invitee.findByIdAndUpdate(inviteeId, data, { new: true, runValidators: true });
  },

  async bulkUpdateSessionAccess(inviteeIds: string[], sessionAccess: any[]): Promise<any> {
    return await Invitee.updateMany(
      { _id: { $in: inviteeIds } },
      { $set: { sessionAccess } },
      { runValidators: true }
    );
  },

  async delete(inviteeId: string): Promise<IInvitee | null> {
    return await Invitee.findByIdAndDelete(inviteeId);
  }
};
