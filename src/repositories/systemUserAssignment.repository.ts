import { SystemUserAssignment, ISystemUserAssignment } from '../models/SystemUserAssignment';

export const systemUserAssignmentRepository = {
  async create(data: Partial<ISystemUserAssignment>): Promise<ISystemUserAssignment> {
    const assignment = new SystemUserAssignment(data);
    return await assignment.save();
  },

  async findByEventId(eventId: string): Promise<ISystemUserAssignment[]> {
    return await SystemUserAssignment.find({ eventId }).populate('userId', 'fullName email phone');
  },

  async findByUserId(userId: string): Promise<ISystemUserAssignment[]> {
    return await SystemUserAssignment.find({ userId }).populate('eventId', 'title status schedule').populate('sessionIds', 'name schedule');
  },

  async findById(assignmentId: string): Promise<ISystemUserAssignment | null> {
    return await SystemUserAssignment.findById(assignmentId);
  },

  async findByUserAndEvent(userId: string, eventId: string): Promise<ISystemUserAssignment | null> {
    return await SystemUserAssignment.findOne({ userId, eventId });
  },

  async update(assignmentId: string, data: Partial<ISystemUserAssignment>): Promise<ISystemUserAssignment | null> {
    return await SystemUserAssignment.findByIdAndUpdate(assignmentId, data, { new: true, runValidators: true });
  },

  async delete(assignmentId: string): Promise<ISystemUserAssignment | null> {
    return await SystemUserAssignment.findByIdAndDelete(assignmentId);
  }
};
