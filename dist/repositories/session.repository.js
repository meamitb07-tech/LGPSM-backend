"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = void 0;
const Session_1 = require("../models/Session");
exports.sessionRepository = {
    async create(data) {
        const session = new Session_1.Session(data);
        return await session.save();
    },
    async findByEventId(eventId, options = {}) {
        let query = Session_1.Session.find({ eventId });
        if (options.sort) {
            query = query.sort(options.sort);
        }
        if (options.skip !== undefined) {
            query = query.skip(options.skip);
        }
        if (options.limit !== undefined) {
            query = query.limit(options.limit);
        }
        return await query.exec();
    },
    async countByEventId(eventId) {
        return await Session_1.Session.countDocuments({ eventId });
    },
    async findById(sessionId) {
        return await Session_1.Session.findById(sessionId);
    },
    async update(sessionId, data) {
        return await Session_1.Session.findByIdAndUpdate(sessionId, data, { new: true, runValidators: true });
    },
    async delete(sessionId) {
        return await Session_1.Session.findByIdAndDelete(sessionId);
    }
};
