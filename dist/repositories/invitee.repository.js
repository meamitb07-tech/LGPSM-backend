"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteeRepository = void 0;
const Invitee_1 = require("../models/Invitee");
exports.inviteeRepository = {
    async create(data) {
        const invitee = new Invitee_1.Invitee(data);
        return await invitee.save();
    },
    async insertMany(data) {
        return await Invitee_1.Invitee.insertMany(data);
    },
    async findByEventId(eventId, options = {}) {
        const filter = { eventId, ...(options.filter || {}) };
        let query = Invitee_1.Invitee.find(filter);
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
    async countByEventId(eventId, filter = {}) {
        return await Invitee_1.Invitee.countDocuments({ eventId, ...filter });
    },
    async findById(inviteeId) {
        return await Invitee_1.Invitee.findById(inviteeId);
    },
    async findByEmailOrMobile(eventId, email, mobile) {
        const orConditions = [];
        if (email)
            orConditions.push({ email: email.toLowerCase() });
        if (mobile)
            orConditions.push({ mobile });
        if (orConditions.length === 0)
            return [];
        return await Invitee_1.Invitee.find({ eventId, $or: orConditions });
    },
    async update(inviteeId, data) {
        return await Invitee_1.Invitee.findByIdAndUpdate(inviteeId, data, { new: true, runValidators: true });
    },
    async bulkUpdateSessionAccess(inviteeIds, sessionAccess) {
        return await Invitee_1.Invitee.updateMany({ _id: { $in: inviteeIds } }, { $set: { sessionAccess } }, { runValidators: true });
    },
    async delete(inviteeId) {
        return await Invitee_1.Invitee.findByIdAndDelete(inviteeId);
    }
};
