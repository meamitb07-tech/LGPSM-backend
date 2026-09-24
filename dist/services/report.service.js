"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Event_1 = require("../models/Event");
const Invitee_1 = require("../models/Invitee");
const CheckIn_1 = require("../models/CheckIn");
const Session_1 = require("../models/Session");
exports.reportService = {
    async getDashboardStats(user) {
        const isOrganizer = user.role !== 'ADMIN';
        const eventQuery = isOrganizer ? { organizerId: new mongoose_1.default.Types.ObjectId(user.userId) } : {};
        const totalEvents = await Event_1.Event.countDocuments(eventQuery);
        // Get all matching event IDs
        const events = await Event_1.Event.find(eventQuery, '_id');
        const eventIds = events.map(e => e._id);
        const totalInvitees = await Invitee_1.Invitee.countDocuments({ eventId: { $in: eventIds } });
        const totalCheckIns = await CheckIn_1.CheckIn.countDocuments({ eventId: { $in: eventIds }, status: 'CHECKED_IN' });
        const rsvpStats = await Invitee_1.Invitee.aggregate([
            { $match: { eventId: { $in: eventIds } } },
            { $group: { _id: '$rsvpStatus', count: { $sum: 1 } } }
        ]);
        const rsvpSummary = {
            ACCEPTED: 0,
            DECLINED: 0,
            PENDING: 0
        };
        rsvpStats.forEach((stat) => {
            if (stat._id in rsvpSummary) {
                rsvpSummary[stat._id] = stat.count;
            }
        });
        return {
            totalEvents,
            totalInvitees,
            totalCheckIns,
            rsvpSummary
        };
    },
    async getEventReport(eventId, user) {
        const isOrganizer = user.role !== 'ADMIN';
        const eventQuery = { _id: eventId };
        if (isOrganizer) {
            eventQuery.organizerId = user.userId;
        }
        const event = await Event_1.Event.findOne(eventQuery);
        if (!event)
            throw new Error('EVENT_NOT_FOUND');
        const eventObjId = new mongoose_1.default.Types.ObjectId(eventId);
        const totalInvitees = await Invitee_1.Invitee.countDocuments({ eventId: eventObjId });
        const totalCheckIns = await CheckIn_1.CheckIn.countDocuments({ eventId: eventObjId, status: 'CHECKED_IN' });
        // RSVP breakdown
        const rsvpStats = await Invitee_1.Invitee.aggregate([
            { $match: { eventId: eventObjId } },
            { $group: { _id: '$rsvpStatus', count: { $sum: 1 } } }
        ]);
        const rsvpSummary = { ACCEPTED: 0, DECLINED: 0, PENDING: 0 };
        rsvpStats.forEach((stat) => {
            if (stat._id in rsvpSummary) {
                rsvpSummary[stat._id] = stat.count;
            }
        });
        // Invitation Delivery Status breakdown
        const deliveryStats = await Invitee_1.Invitee.aggregate([
            { $match: { eventId: eventObjId } },
            { $group: { _id: '$invitationStatus', count: { $sum: 1 } } }
        ]);
        const deliverySummary = { SENT: 0, PENDING: 0, FAILED: 0 };
        deliveryStats.forEach((stat) => {
            if (stat._id in deliverySummary) {
                deliverySummary[stat._id] = stat.count;
            }
        });
        // Check-in Method breakdown (QR vs MANUAL)
        const methodStats = await CheckIn_1.CheckIn.aggregate([
            { $match: { eventId: eventObjId, status: 'CHECKED_IN' } },
            { $group: { _id: '$method', count: { $sum: 1 } } }
        ]);
        const checkInMethods = { QR: 0, MANUAL: 0 };
        methodStats.forEach((stat) => {
            if (stat._id in checkInMethods) {
                checkInMethods[stat._id] = stat.count;
            }
        });
        // Sessions breakdown
        const sessions = await Session_1.Session.find({ eventId: eventObjId });
        const sessionReports = await Promise.all(sessions.map(async (sess) => {
            const count = await CheckIn_1.CheckIn.countDocuments({ eventId: eventObjId, sessionId: sess._id, status: 'CHECKED_IN' });
            return {
                sessionId: sess._id,
                name: sess.name,
                checkInCount: count,
                schedule: sess.schedule
            };
        }));
        const attendanceRate = totalInvitees > 0 ? ((totalCheckIns / totalInvitees) * 100).toFixed(2) + '%' : '0.00%';
        return {
            event: {
                id: event._id,
                title: event.title,
                schedule: event.schedule,
                format: event.format
            },
            attendanceRate,
            totalInvitees,
            totalCheckIns,
            rsvpSummary,
            deliverySummary,
            checkInMethods,
            sessionReports
        };
    }
};
