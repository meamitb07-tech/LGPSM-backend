import { eventRepository, EventFilter, Pagination } from '../repositories/event.repository';
import { IEvent } from '../models/Event';
import { Category } from '../models/Category';
import { Template } from '../models/Template';
import mongoose from 'mongoose';

export class EventService {
  async createEvent(organizerId: string, eventData: any): Promise<IEvent> {
    // Resolve Category
    let categoryId = eventData.categoryId;
    let categoryExists = categoryId && mongoose.Types.ObjectId.isValid(categoryId) 
      ? await Category.findById(categoryId) 
      : null;

    if (!categoryExists) {
      let defaultCat = await Category.findOne({ name: 'General' });
      if (!defaultCat) {
        defaultCat = await Category.create({ name: 'General', isActive: true });
      }
      categoryId = defaultCat._id;
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

  async getEventsByOrganizer(organizerId: string, filter: EventFilter, pagination: Pagination) {
    return await eventRepository.findByOrganizer(organizerId, filter, pagination);
  }

  async getEventById(eventId: string, organizerId: string): Promise<IEvent> {
    const event = await eventRepository.findByIdAndOrganizer(eventId, organizerId);
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
}

export const eventService = new EventService();
