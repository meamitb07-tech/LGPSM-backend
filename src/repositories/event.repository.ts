import { Event, IEvent, EventStatus } from '../models/Event';
import mongoose from 'mongoose';

export interface EventFilter {
  status?: EventStatus;
  categoryId?: string;
}

export interface Pagination {
  page: number;
  limit: number;
}

export class EventRepository {
  async create(data: Partial<IEvent>): Promise<IEvent> {
    const event = new Event(data);
    return await event.save();
  }

  async findByOrganizer(
    organizerId: string | mongoose.Types.ObjectId,
    filter: EventFilter,
    pagination: Pagination
  ): Promise<{ events: IEvent[]; total: number }> {
    const query: any = { organizerId };
    
    if (filter.status) query.status = filter.status;
    if (filter.categoryId) query.categoryId = filter.categoryId;

    const skip = (pagination.page - 1) * pagination.limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .exec(),
      Event.countDocuments(query)
    ]);

    return { events, total };
  }

  // Admin-wide listing, optionally narrowed to one organizer
  async findAll(
    filter: EventFilter & { organizerId?: string },
    pagination: Pagination
  ): Promise<{ events: IEvent[]; total: number }> {
    const query: any = {};
    if (filter.organizerId) query.organizerId = filter.organizerId;
    if (filter.status) query.status = filter.status;
    if (filter.categoryId) query.categoryId = filter.categoryId;

    const skip = (pagination.page - 1) * pagination.limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizerId', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .exec(),
      Event.countDocuments(query)
    ]);

    return { events, total };
  }

  async findByIdAndOrganizer(eventId: string, organizerId: string | mongoose.Types.ObjectId): Promise<IEvent | null> {
    return await Event.findOne({ _id: eventId, organizerId }).exec();
  }

  async updateByIdAndOrganizer(eventId: string, organizerId: string | mongoose.Types.ObjectId, updateData: Partial<IEvent>): Promise<IEvent | null> {
    return await Event.findOneAndUpdate(
      { _id: eventId, organizerId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  async softDeleteByIdAndOrganizer(eventId: string, organizerId: string | mongoose.Types.ObjectId): Promise<IEvent | null> {
    return await Event.findOneAndUpdate(
      { _id: eventId, organizerId },
      { $set: { status: EventStatus.CANCELLED } },
      { new: true }
    ).exec();
  }
}

export const eventRepository = new EventRepository();
