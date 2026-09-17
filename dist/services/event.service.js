"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventService = exports.EventService = void 0;
const event_repository_1 = require("../repositories/event.repository");
const Category_1 = require("../models/Category");
const Template_1 = require("../models/Template");
const mongoose_1 = __importDefault(require("mongoose"));
class EventService {
    async createEvent(organizerId, eventData) {
        // Validate Category
        const categoryExists = await Category_1.Category.findById(eventData.categoryId);
        if (!categoryExists) {
            throw new Error('CATEGORY_NOT_FOUND');
        }
        // Validate Template if provided
        if (eventData.templateId) {
            const templateExists = await Template_1.Template.findById(eventData.templateId);
            if (!templateExists) {
                throw new Error('TEMPLATE_NOT_FOUND');
            }
        }
        // Force organizerId and default status to DRAFT
        const dataToCreate = {
            ...eventData,
            organizerId: new mongoose_1.default.Types.ObjectId(organizerId),
            status: 'DRAFT'
        };
        return await event_repository_1.eventRepository.create(dataToCreate);
    }
    async getEventsByOrganizer(organizerId, filter, pagination) {
        return await event_repository_1.eventRepository.findByOrganizer(organizerId, filter, pagination);
    }
    async getEventById(eventId, organizerId) {
        const event = await event_repository_1.eventRepository.findByIdAndOrganizer(eventId, organizerId);
        if (!event) {
            throw new Error('EVENT_NOT_FOUND');
        }
        return event;
    }
    async updateEvent(eventId, organizerId, updateData) {
        // Check if event exists
        const existingEvent = await this.getEventById(eventId, organizerId);
        // Validate references if they are being updated
        if (updateData.categoryId && updateData.categoryId !== existingEvent.categoryId.toString()) {
            const categoryExists = await Category_1.Category.findById(updateData.categoryId);
            if (!categoryExists)
                throw new Error('CATEGORY_NOT_FOUND');
        }
        if (updateData.templateId && updateData.templateId !== existingEvent.templateId?.toString()) {
            const templateExists = await Template_1.Template.findById(updateData.templateId);
            if (!templateExists)
                throw new Error('TEMPLATE_NOT_FOUND');
        }
        // Disallow updating organizerId, _id, createdAt
        delete updateData.organizerId;
        delete updateData._id;
        delete updateData.createdAt;
        const updatedEvent = await event_repository_1.eventRepository.updateByIdAndOrganizer(eventId, organizerId, updateData);
        if (!updatedEvent) {
            throw new Error('UPDATE_FAILED');
        }
        return updatedEvent;
    }
    async deactivateEvent(eventId, organizerId) {
        // Ensure it exists first
        await this.getEventById(eventId, organizerId);
        const deletedEvent = await event_repository_1.eventRepository.softDeleteByIdAndOrganizer(eventId, organizerId);
        if (!deletedEvent) {
            throw new Error('DELETION_FAILED');
        }
        return deletedEvent;
    }
}
exports.EventService = EventService;
exports.eventService = new EventService();
