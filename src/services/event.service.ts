import { eventRepository, EventFilter, Pagination } from '../repositories/event.repository';
import { IEvent } from '../models/Event';
import { Category } from '../models/Category';
import { Template } from '../models/Template';
import mongoose from 'mongoose';

export class EventService {
  async createEvent(organizerId: string, eventData: any): Promise<IEvent> {
    // Validate Category
    const categoryExists = await Category.findById(eventData.categoryId);
    if (!categoryExists) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    // Validate Template if provided
    if (eventData.templateId) {
      const templateExists = await Template.findById(eventData.templateId);
      if (!templateExists) {
        throw new Error('TEMPLATE_NOT_FOUND');
      }
    }

    // Force organizerId and default status to DRAFT
    const dataToCreate = {
      ...eventData,
      organizerId: new mongoose.Types.ObjectId(organizerId),
      status: 'DRAFT'
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
