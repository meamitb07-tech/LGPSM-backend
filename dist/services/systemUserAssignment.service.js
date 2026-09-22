"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemUserAssignmentService = void 0;
const systemUserAssignment_repository_1 = require("../repositories/systemUserAssignment.repository");
const Event_1 = require("../models/Event");
const User_1 = require("../models/User");
const Session_1 = require("../models/Session");
const mongoose_1 = __importDefault(require("mongoose"));
async function findAccessibleEvent(eventId, organizerId) {
    const requestingUser = await User_1.User.findById(organizerId);
    if (requestingUser?.role === User_1.Role.ADMIN) {
        return await Event_1.Event.findById(eventId);
    }
    return await Event_1.Event.findOne({ _id: eventId, organizerId });
}
exports.systemUserAssignmentService = {
    async createAssignment(eventId, organizerId, data) {
        const event = await findAccessibleEvent(eventId, organizerId);
        if (!event) {
            throw new Error('EVENT_NOT_FOUND');
        }
        const targetUser = await User_1.User.findById(data.userId);
        if (!targetUser || !targetUser.isActive || targetUser.role !== User_1.Role.SYSTEM_USER) {
            throw new Error('INVALID_USER');
        }
        const existing = await systemUserAssignment_repository_1.systemUserAssignmentRepository.findByUserAndEvent(data.userId, eventId);
        if (existing) {
            throw new Error('DUPLICATE_ASSIGNMENT');
        }
        // Verify sessions belong to event
        const uniqueSessionIds = [...new Set(data.sessionIds)];
        if (uniqueSessionIds.length > 0) {
            const sessions = await Session_1.Session.find({ _id: { $in: uniqueSessionIds }, eventId });
            if (sessions.length !== uniqueSessionIds.length) {
                throw new Error('INVALID_SESSIONS');
            }
        }
        const assignmentData = {
            userId: new mongoose_1.default.Types.ObjectId(data.userId),
            eventId: new mongoose_1.default.Types.ObjectId(eventId),
            sessionIds: uniqueSessionIds.map(id => new mongoose_1.default.Types.ObjectId(id)),
            assignedBy: new mongoose_1.default.Types.ObjectId(organizerId)
        };
        return await systemUserAssignment_repository_1.systemUserAssignmentRepository.create(assignmentData);
    },
    async getAssignmentsByEvent(eventId, organizerId) {
        const event = await findAccessibleEvent(eventId, organizerId);
        if (!event) {
            throw new Error('EVENT_NOT_FOUND');
        }
        return await systemUserAssignment_repository_1.systemUserAssignmentRepository.findByEventId(eventId);
    },
    async getAssignmentsByUser(userId) {
        return await systemUserAssignment_repository_1.systemUserAssignmentRepository.findByUserId(userId);
    },
    async updateAssignment(assignmentId, organizerId, sessionIds) {
        const assignment = await systemUserAssignment_repository_1.systemUserAssignmentRepository.findById(assignmentId);
        if (!assignment) {
            throw new Error('ASSIGNMENT_NOT_FOUND');
        }
        const event = await findAccessibleEvent(assignment.eventId.toString(), organizerId);
        if (!event) {
            throw new Error('ASSIGNMENT_NOT_FOUND');
        }
        const uniqueSessionIds = [...new Set(sessionIds)];
        if (uniqueSessionIds.length > 0) {
            const sessions = await Session_1.Session.find({ _id: { $in: uniqueSessionIds }, eventId: assignment.eventId });
            if (sessions.length !== uniqueSessionIds.length) {
                throw new Error('INVALID_SESSIONS');
            }
        }
        const updated = await systemUserAssignment_repository_1.systemUserAssignmentRepository.update(assignmentId, {
            sessionIds: uniqueSessionIds.map(id => new mongoose_1.default.Types.ObjectId(id))
        });
        if (!updated) {
            throw new Error('UPDATE_FAILED');
        }
        return updated;
    },
    async deleteAssignment(assignmentId, organizerId) {
        const assignment = await systemUserAssignment_repository_1.systemUserAssignmentRepository.findById(assignmentId);
        if (!assignment) {
            throw new Error('ASSIGNMENT_NOT_FOUND');
        }
        const event = await findAccessibleEvent(assignment.eventId.toString(), organizerId);
        if (!event) {
            throw new Error('ASSIGNMENT_NOT_FOUND');
        }
        const deleted = await systemUserAssignment_repository_1.systemUserAssignmentRepository.delete(assignmentId);
        if (!deleted) {
            throw new Error('DELETE_FAILED');
        }
        return deleted;
    }
};
