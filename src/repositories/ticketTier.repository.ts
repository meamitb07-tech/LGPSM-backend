import { TicketTier, ITicketTier } from '../models/TicketTier';

export const ticketTierRepository = {
  async create(data: Partial<ITicketTier>): Promise<ITicketTier> {
    return await TicketTier.create(data);
  },

  async findByEventId(eventId: string, activeOnly: boolean = true): Promise<ITicketTier[]> {
    const query: any = { eventId };
    if (activeOnly) query.isActive = true;
    return await TicketTier.find(query).sort({ price: 1 });
  },

  async findById(id: string): Promise<ITicketTier | null> {
    return await TicketTier.findById(id);
  },

  async update(id: string, updateData: Partial<ITicketTier>): Promise<ITicketTier | null> {
    return await TicketTier.findByIdAndUpdate(id, updateData, { new: true });
  },

  async delete(id: string): Promise<ITicketTier | null> {
    return await TicketTier.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
};
