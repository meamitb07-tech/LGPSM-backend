"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventController = void 0;
const event_service_1 = require("../services/event.service");
exports.eventController = {
    async createEvent(req, res, next) {
        try {
            const organizerId = req.user.userId;
            const event = await event_service_1.eventService.createEvent(organizerId, req.body);
            res.status(201).json({
                success: true,
                data: {
                    eventId: event._id.toString(),
                    status: event.status.toLowerCase(),
                    createdAt: event.createdAt
                }
            });
        }
        catch (error) {
            next(error);
        }
    },
    async getEvents(req, res, next) {
        try {
            const organizerId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filter = {
                status: req.query.status,
                categoryId: req.query.categoryId
            };
            const result = await event_service_1.eventService.getEventsByOrganizer(organizerId, filter, { page, limit });
            res.status(200).json({
                success: true,
                data: result.events,
                meta: {
                    page,
                    limit,
                    total: result.total
                }
            });
        }
        catch (error) {
            next(error);
        }
    },
    async getEventById(req, res, next) {
        try {
            const organizerId = req.user.userId;
            const eventId = req.params.eventId;
            const event = await event_service_1.eventService.getEventById(eventId, organizerId);
            res.status(200).json({ success: true, data: event });
        }
        catch (error) {
            if (error.message === 'EVENT_NOT_FOUND') {
                res.status(404).json({ error: 'Not Found', message: 'Event not found or inaccessible', details: [] });
            }
            else {
                next(error);
            }
        }
    },
    async updateEvent(req, res, next) {
        try {
            const organizerId = req.user.userId;
            const eventId = req.params.eventId;
            const event = await event_service_1.eventService.updateEvent(eventId, organizerId, req.body);
            res.status(200).json({ success: true, data: event });
        }
        catch (error) {
            if (error.message === 'EVENT_NOT_FOUND') {
                res.status(404).json({ error: 'Not Found', message: 'Event not found or inaccessible', details: [] });
            }
            else {
                next(error);
            }
        }
    },
    async deleteEvent(req, res, next) {
        try {
            const organizerId = req.user.userId;
            const eventId = req.params.eventId;
            const event = await event_service_1.eventService.deactivateEvent(eventId, organizerId);
            res.status(200).json({ success: true, data: { eventId: event._id, status: event.status } });
        }
        catch (error) {
            if (error.message === 'EVENT_NOT_FOUND') {
                res.status(404).json({ error: 'Not Found', message: 'Event not found or inaccessible', details: [] });
            }
            else {
                next(error);
            }
        }
    }
};
