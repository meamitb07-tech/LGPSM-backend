"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRepository = exports.EventRepository = void 0;
const Event_1 = require("../models/Event");
class EventRepository {
    async create(data) {
        const event = new Event_1.Event(data);
        return await event.save();
    }
    async findByOrganizer(organizerId, filter, pagination) {
        const query = { organizerId };
        if (filter.status)
            query.status = filter.status;
        if (filter.categoryId)
            query.categoryId = filter.categoryId;
        const skip = (pagination.page - 1) * pagination.limit;
        const [events, total] = await Promise.all([
            Event_1.Event.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            Event_1.Event.countDocuments(query)
        ]);
        return { events, total };
    }
    async findByIdAndOrganizer(eventId, organizerId) {
        return await Event_1.Event.findOne({ _id: eventId, organizerId }).exec();
    }
    async updateByIdAndOrganizer(eventId, organizerId, updateData) {
        return await Event_1.Event.findOneAndUpdate({ _id: eventId, organizerId }, { $set: updateData }, { new: true, runValidators: true }).exec();
    }
    async softDeleteByIdAndOrganizer(eventId, organizerId) {
        return await Event_1.Event.findOneAndUpdate({ _id: eventId, organizerId }, { $set: { status: Event_1.EventStatus.CANCELLED } }, { new: true }).exec();
    }
}
exports.EventRepository = EventRepository;
exports.eventRepository = new EventRepository();
