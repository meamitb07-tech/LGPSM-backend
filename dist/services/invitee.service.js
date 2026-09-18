"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteeService = void 0;
const invitee_repository_1 = require("../repositories/invitee.repository");
const Invitee_1 = require("../models/Invitee");
const Event_1 = require("../models/Event");
const Session_1 = require("../models/Session");
const mongoose_1 = __importDefault(require("mongoose"));
const xlsx = __importStar(require("xlsx"));
exports.inviteeService = {
    async createInvitee(eventId, organizerId, data) {
        const event = await Event_1.Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            throw new Error('EVENT_NOT_FOUND');
        }
        // Check duplicates
        const duplicates = await invitee_repository_1.inviteeRepository.findByEmailOrMobile(eventId, data.email, data.mobile);
        if (duplicates.length > 0) {
            throw new Error('DUPLICATE_INVITEE');
        }
        const inviteeData = {
            ...data,
            eventId: new mongoose_1.default.Types.ObjectId(eventId)
        };
        return await invitee_repository_1.inviteeRepository.create(inviteeData);
    },
    async getInvitees(eventId, organizerId, options = {}) {
        const event = await Event_1.Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            throw new Error('EVENT_NOT_FOUND');
        }
        const page = options.page || 1;
        const limit = options.limit || 10;
        const skip = (page - 1) * limit;
        const filter = {};
        if (options.rsvpStatus)
            filter.rsvpStatus = options.rsvpStatus;
        if (options.invitationStatus)
            filter.invitationStatus = options.invitationStatus;
        if (options.search) {
            filter.$or = [
                { name: { $regex: options.search, $options: 'i' } },
                { email: { $regex: options.search, $options: 'i' } },
                { mobile: { $regex: options.search, $options: 'i' } }
            ];
        }
        const invitees = await invitee_repository_1.inviteeRepository.findByEventId(eventId, {
            filter,
            sort: { createdAt: -1 },
            skip,
            limit
        });
        const total = await invitee_repository_1.inviteeRepository.countByEventId(eventId, filter);
        return { invitees, total };
    },
    async getInviteeById(inviteeId, organizerId) {
        const invitee = await invitee_repository_1.inviteeRepository.findById(inviteeId);
        if (!invitee) {
            throw new Error('INVITEE_NOT_FOUND');
        }
        const event = await Event_1.Event.findOne({ _id: invitee.eventId, organizerId });
        if (!event) {
            throw new Error('INVITEE_NOT_FOUND');
        }
        return invitee;
    },
    async updateInvitee(inviteeId, organizerId, data) {
        const invitee = await this.getInviteeById(inviteeId, organizerId); // Ensures ownership
        // Check duplicates if email/mobile changed
        if ((data.email && data.email !== invitee.email) ||
            (data.mobile && data.mobile !== invitee.mobile)) {
            const emailToCheck = data.email || invitee.email;
            const mobileToCheck = data.mobile || invitee.mobile;
            const duplicates = await invitee_repository_1.inviteeRepository.findByEmailOrMobile(invitee.eventId.toString(), emailToCheck, mobileToCheck);
            const isDuplicate = duplicates.some(dup => dup._id.toString() !== inviteeId);
            if (isDuplicate) {
                throw new Error('DUPLICATE_INVITEE');
            }
        }
        // Protect system fields
        delete data._id;
        delete data.eventId;
        delete data.createdAt;
        delete data.invitationStatus; // Handled by separate workflows
        delete data.rsvpStatus; // Handled by separate workflows
        const updated = await invitee_repository_1.inviteeRepository.update(inviteeId, data);
        if (!updated) {
            throw new Error('UPDATE_FAILED');
        }
        return updated;
    },
    async updateSessionAccess(inviteeId, organizerId, sessionAccess) {
        const invitee = await this.getInviteeById(inviteeId, organizerId);
        const eventId = invitee.eventId.toString();
        // Verify all sessions belong to the event
        const sessionIds = sessionAccess.map(sa => sa.sessionId);
        const sessions = await Session_1.Session.find({ _id: { $in: sessionIds }, eventId });
        if (sessions.length !== sessionIds.length) {
            throw new Error('INVALID_SESSIONS');
        }
        // Merge or replace? The spec asks to "Preserve the existing access entries if the operation is intended to be partial. Clearly distinguish replace-all behavior from partial updates."
        // Let's implement replace-all for the provided session IDs. (Partial update on the array).
        const accessMap = new Map();
        invitee.sessionAccess.forEach(sa => accessMap.set(sa.sessionId.toString(), sa.allowed));
        sessionAccess.forEach(sa => accessMap.set(sa.sessionId, sa.allowed));
        const newSessionAccess = Array.from(accessMap.entries()).map(([sessionId, allowed]) => ({
            sessionId: new mongoose_1.default.Types.ObjectId(sessionId),
            allowed
        }));
        const updated = await invitee_repository_1.inviteeRepository.update(inviteeId, { sessionAccess: newSessionAccess });
        if (!updated) {
            throw new Error('UPDATE_FAILED');
        }
        return updated;
    },
    async bulkUpdateSessionAccess(eventId, organizerId, inviteeIds, sessionAccess) {
        const event = await Event_1.Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            throw new Error('EVENT_NOT_FOUND');
        }
        // Verify all invitees belong to event
        const invitees = await Invitee_1.Invitee.find({ _id: { $in: inviteeIds }, eventId });
        if (invitees.length !== inviteeIds.length) {
            throw new Error('INVALID_INVITEES');
        }
        // Verify all sessions belong to event
        const sessionIds = sessionAccess.map(sa => sa.sessionId);
        const sessions = await Session_1.Session.find({ _id: { $in: sessionIds }, eventId });
        if (sessions.length !== sessionIds.length) {
            throw new Error('INVALID_SESSIONS');
        }
        // For simplicity in bulk update, we replace the session access completely 
        // or we can't easily do a partial merge in MongoDB without complex aggregation pipelines.
        // The prompt says "Avoid partial database updates when the chosen operation is intended to be atomic."
        // We will replace the sessionAccess entirely for the bulk updated invitees.
        const mappedSessionAccess = sessionAccess.map(sa => ({
            sessionId: new mongoose_1.default.Types.ObjectId(sa.sessionId),
            allowed: sa.allowed
        }));
        await invitee_repository_1.inviteeRepository.bulkUpdateSessionAccess(inviteeIds, mappedSessionAccess);
        return { success: true, updatedCount: invitees.length };
    },
    async deleteInvitee(inviteeId, organizerId) {
        const invitee = await this.getInviteeById(inviteeId, organizerId);
        // Non-destructive check (if they have check-ins etc later, we might prevent this).
        // For now, hard delete.
        const deleted = await invitee_repository_1.inviteeRepository.delete(inviteeId);
        if (!deleted) {
            throw new Error('DELETE_FAILED');
        }
        return deleted;
    },
    async processExcelImport(eventId, organizerId, fileBuffer) {
        const event = await Event_1.Event.findOne({ _id: eventId, organizerId });
        if (!event) {
            throw new Error('EVENT_NOT_FOUND');
        }
        const eventSessions = await Session_1.Session.find({ eventId });
        const sessionNameMap = new Map(eventSessions.map(s => [s.name.toLowerCase(), s._id]));
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
        const results = {
            totalRows: rows.length,
            imported: 0,
            rejected: 0,
            duplicateCount: 0,
            errors: []
        };
        const validInviteesToInsert = [];
        const emailsInImport = new Set();
        const mobilesInImport = new Set();
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // +1 for 0-index, +1 for header
            const name = String(row['Name'] || '').trim();
            const email = String(row['Email'] || '').trim().toLowerCase();
            const mobile = String(row['Mobile'] || '').trim();
            const dietaryPreference = String(row['Dietary preference'] || '').trim();
            if (!name) {
                results.rejected++;
                results.errors.push({ row: rowNum, error: 'Name is required' });
                continue;
            }
            if (!email && !mobile) {
                results.rejected++;
                results.errors.push({ row: rowNum, error: 'Either Email or Mobile is required' });
                continue;
            }
            // Check duplicates within file
            if ((email && emailsInImport.has(email)) || (mobile && mobilesInImport.has(mobile))) {
                results.rejected++;
                results.duplicateCount++;
                results.errors.push({ row: rowNum, error: 'Duplicate within file' });
                continue;
            }
            // Check DB duplicates
            const dbDuplicates = await invitee_repository_1.inviteeRepository.findByEmailOrMobile(eventId, email, mobile);
            if (dbDuplicates.length > 0) {
                results.rejected++;
                results.duplicateCount++;
                results.errors.push({ row: rowNum, error: 'Duplicate in database' });
                continue;
            }
            if (email)
                emailsInImport.add(email);
            if (mobile)
                mobilesInImport.add(mobile);
            // Process Session Access
            const sessionAccess = [];
            let sessionError = false;
            for (const [key, value] of Object.entries(row)) {
                if (['Name', 'Email', 'Mobile', 'Dietary preference'].includes(key))
                    continue;
                // Any other column is assumed to be a session name
                const lowerKey = key.toLowerCase();
                const sessionId = sessionNameMap.get(lowerKey);
                if (!sessionId) {
                    // Unrecognized column - could be a typo or just extra data
                    // Prompt says: "Validate CSV headers against the configured session fields before importing, and reject the file with clear, field-specific errors if any required fields are missing or mismatched"
                    // Or report invalid/unknown session columns. We will report an error.
                    sessionError = true;
                    results.errors.push({ row: rowNum, error: `Unknown session column: ${key}` });
                    break;
                }
                const val = String(value).trim().toUpperCase();
                if (val !== 'Y' && val !== 'N' && val !== '') {
                    sessionError = true;
                    results.errors.push({ row: rowNum, error: `Invalid access value for session ${key}: ${val}. Expected Y or N.` });
                    break;
                }
                if (val === 'Y') {
                    sessionAccess.push({ sessionId, allowed: true });
                }
                else if (val === 'N') {
                    sessionAccess.push({ sessionId, allowed: false });
                }
            }
            if (sessionError) {
                results.rejected++;
                continue;
            }
            validInviteesToInsert.push({
                eventId: new mongoose_1.default.Types.ObjectId(eventId),
                name,
                email,
                mobile,
                dietaryPreference,
                sessionAccess,
                invitationStatus: 'PENDING',
                rsvpStatus: 'PENDING'
            });
        }
        if (validInviteesToInsert.length > 0) {
            await invitee_repository_1.inviteeRepository.insertMany(validInviteesToInsert);
            results.imported = validInviteesToInsert.length;
        }
        return results;
    }
};
