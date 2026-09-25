import { eventRepository, EventFilter, Pagination } from '../repositories/event.repository';
import { IEvent, Event, EventStatus } from '../models/Event';
import { Category } from '../models/Category';
import { Template } from '../models/Template';
import { Session } from '../models/Session';
import { Invitee } from '../models/Invitee';
import { Invitation } from '../models/Invitation';
import { CheckIn } from '../models/CheckIn';
import { SystemUserAssignment } from '../models/SystemUserAssignment';
import { Role } from '../models/User';
import mongoose from 'mongoose';

export class EventService {
  async createEvent(organizerId: string, eventData: any): Promise<IEvent> {
    // Resolve Category
    let categoryId = eventData.categoryId;
    let categoryExists = categoryId && mongoose.Types.ObjectId.isValid(categoryId) 
      ? await Category.findById(categoryId) 
      : null;

    if (categoryId && !categoryExists) {
      const err: any = new Error('CATEGORY_NOT_FOUND');
      err.statusCode = 400;
      throw err;
    }

    if (!categoryExists) {
      let defaultCat = await Category.findOne({ name: 'General' });
      if (!defaultCat) {
        defaultCat = await Category.create({ name: 'General', isActive: true });
      }
      categoryId = defaultCat?._id;
    }

    // Validate Template if provided
    if (eventData.templateId && mongoose.Types.ObjectId.isValid(eventData.templateId)) {
      const templateExists = await Template.findById(eventData.templateId);
      if (!templateExists) {
        delete eventData.templateId;
      }
    } else {
      delete eventData.templateId;
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);

    const startVal = eventData.schedule?.start || eventData.startDate || now;
    const endVal = eventData.schedule?.end || eventData.endDate || tomorrow;

    // Force organizerId and default status to PUBLISHED so it shows on event listing
    const dataToCreate = {
      ...eventData,
      categoryId,
      description: eventData.description || eventData.title || 'Event Description',
      format: eventData.format || 'PHYSICAL',
      schedule: {
        start: new Date(startVal),
        end: new Date(endVal)
      },
      organizerId: new mongoose.Types.ObjectId(organizerId),
      status: 'PUBLISHED'
    };

    return await eventRepository.create(dataToCreate);
  }

  async getEventsByOrganizer(organizerId: string, filter: EventFilter & { organizerId?: string }, pagination: Pagination, role?: Role) {
    // Admins can review every organizer's events (read-only); organizers only see their own
    if (role === Role.ADMIN) {
      return await eventRepository.findAll(filter, pagination);
    }
    return await eventRepository.findByOrganizer(organizerId, filter, pagination);
  }

  async getEventById(eventId: string, organizerId: string, role?: Role): Promise<IEvent> {
    const event = role === Role.ADMIN
      ? await Event.findById(eventId).populate('organizerId', 'fullName email')
      : await eventRepository.findByIdAndOrganizer(eventId, organizerId);
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }
    return event;
  }

  async updateEvent(eventId: string, organizerId: string, updateData: any): Promise<IEvent> {
    // Check if event exists
    const existingEvent = await this.getEventById(eventId, organizerId);

    // Validate references if they are being updated
    if (updateData.categoryId && updateData.categoryId !== existingEvent.categoryId.toString()) {
      const categoryExists = await Category.findById(updateData.categoryId);
      if (!categoryExists) throw new Error('CATEGORY_NOT_FOUND');
    }

    if (updateData.templateId && updateData.templateId !== existingEvent.templateId?.toString()) {
      const templateExists = await Template.findById(updateData.templateId);
      if (!templateExists) throw new Error('TEMPLATE_NOT_FOUND');
    }

    // Disallow updating organizerId, _id, createdAt
    delete updateData.organizerId;
    delete updateData._id;
    delete updateData.createdAt;

    const updatedEvent = await eventRepository.updateByIdAndOrganizer(eventId, organizerId, updateData);
    if (!updatedEvent) {
      throw new Error('UPDATE_FAILED');
    }
    
    return updatedEvent;
  }

  async deactivateEvent(eventId: string, organizerId: string): Promise<IEvent> {
    // Ensure it exists first
    await this.getEventById(eventId, organizerId);
    
    const deletedEvent = await eventRepository.softDeleteByIdAndOrganizer(eventId, organizerId);
    if (!deletedEvent) {
      throw new Error('DELETION_FAILED');
    }
    return deletedEvent;
  }

  async cleanupEventOperationalData(eventId: string, actor: { userId: string; role: Role }): Promise<any> {
    // 1. Authorization: Only ADMIN
    if (actor.role !== Role.ADMIN) {
      throw new Error('FORBIDDEN_CLEANUP');
    }

    // 2. Fetch Event
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // 3. Idempotency: If already cleared
    if (event.operationalDataCleared) {
      return {
        event,
        alreadyCleared: true,
        cleanedCounts: { sessions: 0, invitees: 0, invitations: 0, checkIns: 0, assignments: 0 }
      };
    }

    // 4. Validate Event Has Ended
    const now = new Date();
    const endDate = event.schedule?.end ? new Date(event.schedule.end) : null;
    const isEnded = (endDate && now > endDate) || event.status === EventStatus.COMPLETED;

    if (!isEnded) {
      throw new Error('EVENT_NOT_ENDED');
    }

    // 5. Atomic Deletion of Event-Specific Operational Data
    // DO NOT DELETE GLOBAL USERS (User model)!
    const eventObjId = new mongoose.Types.ObjectId(eventId);

    const [sessionRes, inviteeRes, invitationRes, checkInRes, assignmentRes] = await Promise.all([
      Session.deleteMany({ eventId: eventObjId }),
      Invitee.deleteMany({ eventId: eventObjId }),
      Invitation.deleteMany({ eventId: eventObjId }),
      CheckIn.deleteMany({ eventId: eventObjId }),
      SystemUserAssignment.deleteMany({ eventId: eventObjId }),
    ]);

    event.operationalDataCleared = true;
    event.status = EventStatus.COMPLETED;
    await event.save();

    return {
      event,
      alreadyCleared: false,
      cleanedCounts: {
        sessions: sessionRes.deletedCount || 0,
        invitees: inviteeRes.deletedCount || 0,
        invitations: invitationRes.deletedCount || 0,
        checkIns: checkInRes.deletedCount || 0,
        assignments: assignmentRes.deletedCount || 0,
      }
    };
  }
}

export const eventService = new EventService();
