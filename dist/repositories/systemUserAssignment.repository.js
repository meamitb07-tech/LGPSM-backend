"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemUserAssignmentRepository = void 0;
const SystemUserAssignment_1 = require("../models/SystemUserAssignment");
exports.systemUserAssignmentRepository = {
    async create(data) {
        const assignment = new SystemUserAssignment_1.SystemUserAssignment(data);
        return await assignment.save();
    },
    async findByEventId(eventId) {
        return await SystemUserAssignment_1.SystemUserAssignment.find({ eventId }).populate('userId', 'fullName email phone');
    },
    async findByUserId(userId) {
        return await SystemUserAssignment_1.SystemUserAssignment.find({ userId }).populate('eventId', 'title status schedule').populate('sessionIds', 'name schedule');
    },
    async findById(assignmentId) {
        return await SystemUserAssignment_1.SystemUserAssignment.findById(assignmentId);
    },
    async findByUserAndEvent(userId, eventId) {
        return await SystemUserAssignment_1.SystemUserAssignment.findOne({ userId, eventId });
    },
    async update(assignmentId, data) {
        return await SystemUserAssignment_1.SystemUserAssignment.findByIdAndUpdate(assignmentId, data, { new: true, runValidators: true });
    },
    async delete(assignmentId) {
        return await SystemUserAssignment_1.SystemUserAssignment.findByIdAndDelete(assignmentId);
    }
};
