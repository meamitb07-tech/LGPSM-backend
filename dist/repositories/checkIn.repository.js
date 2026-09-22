"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInRepository = void 0;
const CheckIn_1 = require("../models/CheckIn");
const mongoose_1 = __importDefault(require("mongoose"));
exports.checkInRepository = {
    async create(data) {
        const checkIn = new CheckIn_1.CheckIn(data);
        return await checkIn.save();
    },
    async findByInviteeAndSession(inviteeId, sessionId) {
        return await CheckIn_1.CheckIn.findOne({
            inviteeId: new mongoose_1.default.Types.ObjectId(inviteeId),
            sessionId: new mongoose_1.default.Types.ObjectId(sessionId)
        });
    },
    async findEventWideCheckIn(inviteeId, eventId) {
        return await CheckIn_1.CheckIn.findOne({
            inviteeId: new mongoose_1.default.Types.ObjectId(inviteeId),
            eventId: new mongoose_1.default.Types.ObjectId(eventId),
            sessionId: null
        });
    },
    async findOtherSessionCheckIns(inviteeId, eventId, currentSessionId) {
        const filter = {
            inviteeId: new mongoose_1.default.Types.ObjectId(inviteeId),
            eventId: new mongoose_1.default.Types.ObjectId(eventId),
            sessionId: { $ne: null }
        };
        if (currentSessionId) {
            filter.sessionId = { $ne: new mongoose_1.default.Types.ObjectId(currentSessionId) };
        }
        return await CheckIn_1.CheckIn.find(filter);
    },
    async findByInviteeAndEvent(inviteeId, eventId) {
        return await CheckIn_1.CheckIn.find({
            inviteeId: new mongoose_1.default.Types.ObjectId(inviteeId),
            eventId: new mongoose_1.default.Types.ObjectId(eventId)
        });
    },
    async findEventCheckIns(eventId, options = {}) {
        const filter = { eventId: new mongoose_1.default.Types.ObjectId(eventId) };
        if (options.sessionId) {
            filter.sessionId = new mongoose_1.default.Types.ObjectId(options.sessionId);
        }
        else if (options.allowedSessionIds && options.allowedSessionIds.length > 0) {
            filter.sessionId = { $in: options.allowedSessionIds.map(id => new mongoose_1.default.Types.ObjectId(id)) };
        }
        if (options.checkInMethod) {
            filter.checkInMethod = options.checkInMethod;
        }
        let query = CheckIn_1.CheckIn.find(filter)
            .populate('inviteeId', 'name email mobile dietaryPreference rsvpStatus')
            .populate('sessionId', 'name schedule')
            .populate('checkedInBy', 'fullName email role')
            .sort({ checkInAt: -1 });
        if (options.skip !== undefined) {
            query = query.skip(options.skip);
        }
        if (options.limit !== undefined) {
            query = query.limit(options.limit);
        }
        return await query.exec();
    },
    async countEventCheckIns(eventId, options = {}) {
        const filter = { eventId: new mongoose_1.default.Types.ObjectId(eventId) };
        if (options.sessionId) {
            filter.sessionId = new mongoose_1.default.Types.ObjectId(options.sessionId);
        }
        else if (options.allowedSessionIds && options.allowedSessionIds.length > 0) {
            filter.sessionId = { $in: options.allowedSessionIds.map(id => new mongoose_1.default.Types.ObjectId(id)) };
        }
        if (options.checkInMethod) {
            filter.checkInMethod = options.checkInMethod;
        }
        return await CheckIn_1.CheckIn.countDocuments(filter);
    }
};
