import { inviteeRepository } from '../repositories/invitee.repository';
import { IInvitee, Invitee } from '../models/Invitee';
import { Event } from '../models/Event';
import { Session } from '../models/Session';
import mongoose from 'mongoose';
import * as xlsx from 'xlsx';

export const inviteeService = {
  async createInvitee(eventId: string, organizerId: string, data: Partial<IInvitee>): Promise<IInvitee> {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Check duplicates
    const duplicates = await inviteeRepository.findByEmailOrMobile(eventId, data.email, data.mobile);
    if (duplicates.length > 0) {
      throw new Error('DUPLICATE_INVITEE');
    }

    const inviteeData = {
      ...data,
      eventId: new mongoose.Types.ObjectId(eventId)
    };

    return await inviteeRepository.create(inviteeData);
  },

  async getInvitees(eventId: string, organizerId: string, options: { 
    page?: number; 
    limit?: number;
    rsvpStatus?: string;
    invitationStatus?: string;
    search?: string;
  } = {}) {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (options.rsvpStatus) filter.rsvpStatus = options.rsvpStatus;
    if (options.invitationStatus) filter.invitationStatus = options.invitationStatus;
    
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
        { mobile: { $regex: options.search, $options: 'i' } }
      ];
    }

    const invitees = await inviteeRepository.findByEventId(eventId, {
      filter,
      sort: { createdAt: -1 },
      skip,
      limit
    });
    
    const total = await inviteeRepository.countByEventId(eventId, filter);

    return { invitees, total };
  },

  async getInviteeById(inviteeId: string, organizerId: string): Promise<IInvitee> {
    const invitee = await inviteeRepository.findById(inviteeId);
    if (!invitee) {
      throw new Error('INVITEE_NOT_FOUND');
    }

    const event = await Event.findOne({ _id: invitee.eventId, organizerId });
    if (!event) {
      throw new Error('INVITEE_NOT_FOUND');
    }

    return invitee;
  },

  async updateInvitee(inviteeId: string, organizerId: string, data: Partial<IInvitee>): Promise<IInvitee> {
    const invitee = await this.getInviteeById(inviteeId, organizerId); // Ensures ownership

    // Check duplicates if email/mobile changed
    if (
      (data.email && data.email !== invitee.email) || 
      (data.mobile && data.mobile !== invitee.mobile)
    ) {
      const emailToCheck = data.email || invitee.email;
      const mobileToCheck = data.mobile || invitee.mobile;
      const duplicates = await inviteeRepository.findByEmailOrMobile(invitee.eventId.toString(), emailToCheck, mobileToCheck);
      
      const isDuplicate = duplicates.some(dup => dup._id.toString() !== inviteeId);
      if (isDuplicate) {
        throw new Error('DUPLICATE_INVITEE');
      }
    }

    // Protect system fields
    delete (data as any)._id;
    delete (data as any).eventId;
    delete (data as any).createdAt;
    delete (data as any).invitationStatus; // Handled by separate workflows
    delete (data as any).rsvpStatus;       // Handled by separate workflows

    const updated = await inviteeRepository.update(inviteeId, data);
    if (!updated) {
      throw new Error('UPDATE_FAILED');
    }
    return updated;
  },

  async updateSessionAccess(inviteeId: string, organizerId: string, sessionAccess: { sessionId: string; allowed: boolean }[]): Promise<IInvitee> {
    const invitee = await this.getInviteeById(inviteeId, organizerId);
    const eventId = invitee.eventId.toString();

    // Verify all sessions belong to the event
    const sessionIds = sessionAccess.map(sa => sa.sessionId);
    const sessions = await Session.find({ _id: { $in: sessionIds }, eventId });
    if (sessions.length !== sessionIds.length) {
      throw new Error('INVALID_SESSIONS');
    }

    // Merge or replace? The spec asks to "Preserve the existing access entries if the operation is intended to be partial. Clearly distinguish replace-all behavior from partial updates."
    // Let's implement replace-all for the provided session IDs. (Partial update on the array).
    const accessMap = new Map<string, boolean>();
    invitee.sessionAccess.forEach(sa => accessMap.set(sa.sessionId.toString(), sa.allowed));
    
    sessionAccess.forEach(sa => accessMap.set(sa.sessionId, sa.allowed));

    const newSessionAccess = Array.from(accessMap.entries()).map(([sessionId, allowed]) => ({
      sessionId: new mongoose.Types.ObjectId(sessionId),
      allowed
    }));

    const updated = await inviteeRepository.update(inviteeId, { sessionAccess: newSessionAccess });
    if (!updated) {
      throw new Error('UPDATE_FAILED');
    }
    return updated;
  },

  async bulkUpdateSessionAccess(eventId: string, organizerId: string, inviteeIds: string[], sessionAccess: { sessionId: string; allowed: boolean }[]) {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    // Verify all invitees belong to event
    const invitees = await Invitee.find({ _id: { $in: inviteeIds }, eventId });
    if (invitees.length !== inviteeIds.length) {
      throw new Error('INVALID_INVITEES');
    }

    // Verify all sessions belong to event
    const sessionIds = sessionAccess.map(sa => sa.sessionId);
    const sessions = await Session.find({ _id: { $in: sessionIds }, eventId });
    if (sessions.length !== sessionIds.length) {
      throw new Error('INVALID_SESSIONS');
    }

    // For simplicity in bulk update, we replace the session access completely 
    // or we can't easily do a partial merge in MongoDB without complex aggregation pipelines.
    // The prompt says "Avoid partial database updates when the chosen operation is intended to be atomic."
    // We will replace the sessionAccess entirely for the bulk updated invitees.
    
    const mappedSessionAccess = sessionAccess.map(sa => ({
      sessionId: new mongoose.Types.ObjectId(sa.sessionId),
      allowed: sa.allowed
    }));

    await inviteeRepository.bulkUpdateSessionAccess(inviteeIds, mappedSessionAccess);

    return { success: true, updatedCount: invitees.length };
  },

  async deleteInvitee(inviteeId: string, organizerId: string): Promise<IInvitee> {
    const invitee = await this.getInviteeById(inviteeId, organizerId);
    
    // Non-destructive check (if they have check-ins etc later, we might prevent this).
    // For now, hard delete.
    const deleted = await inviteeRepository.delete(inviteeId);
    if (!deleted) {
      throw new Error('DELETE_FAILED');
    }
    return deleted;
  },

  async processExcelImport(eventId: string, organizerId: string, fileBuffer: Buffer) {
    const event = await Event.findOne({ _id: eventId, organizerId });
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    const eventSessions = await Session.find({ eventId });
    const sessionNameMap = new Map(eventSessions.map(s => [s.name.toLowerCase(), s._id]));

    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Get headers
    const headers = xlsx.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0] || [];
    const lowerHeaders = headers.map((h: any) => String(h).trim().toLowerCase());
    
    // Validate CSV headers against configured session fields
    const requiredStandardHeaders = ['name', 'email', 'mobile', 'dietary preference'];
    const missingSessions: string[] = [];
    const mismatchedHeaders: string[] = [];
    
    // Check if all configured event sessions exist in the CSV headers
    for (const session of eventSessions) {
      if (!lowerHeaders.includes(session.name.toLowerCase())) {
        missingSessions.push(session.name);
      }
    }

    // Check if there are any extra headers that don't belong to standard or sessions
    for (const header of lowerHeaders) {
      if (!requiredStandardHeaders.includes(header) && !sessionNameMap.has(header)) {
        mismatchedHeaders.push(header);
      }
    }

    if (missingSessions.length > 0 || mismatchedHeaders.length > 0) {
      const errors = [];
      if (missingSessions.length > 0) {
        errors.push(`Missing required session columns: ${missingSessions.join(', ')}`);
      }
      if (mismatchedHeaders.length > 0) {
        errors.push(`Mismatched/Unknown columns found: ${mismatchedHeaders.join(', ')}`);
      }
      return {
        totalRows: 0,
        imported: 0,
        rejected: 0,
        duplicateCount: 0,
        errors: [{ row: 0, error: 'Header Validation Failed: ' + errors.join('. ') }]
      };
    }

    const rows = xlsx.utils.sheet_to_json<any>(sheet, { defval: '' });
    
    const results = {
      totalRows: rows.length,
      imported: 0,
      rejected: 0,
      duplicateCount: 0,
      errors: [] as { row: number; error: string }[]
    };

    const validInviteesToInsert: any[] = [];
    const emailsInImport = new Set<string>();
    const mobilesInImport = new Set<string>();

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
      const dbDuplicates = await inviteeRepository.findByEmailOrMobile(eventId, email, mobile);
      if (dbDuplicates.length > 0) {
        results.rejected++;
        results.duplicateCount++;
        results.errors.push({ row: rowNum, error: 'Duplicate in database' });
        continue;
      }

      if (email) emailsInImport.add(email);
      if (mobile) mobilesInImport.add(mobile);

      // Process Session Access
      const sessionAccess: any[] = [];
      let sessionError = false;

      for (const [key, value] of Object.entries(row)) {
        if (['Name', 'Email', 'Mobile', 'Dietary preference'].includes(key)) continue;

        // Any other column is assumed to be a session name
        const lowerKey = key.toLowerCase();
        const sessionId = sessionNameMap.get(lowerKey);
        
        if (!sessionId) continue; // Already validated headers

        const val = String(value).trim().toUpperCase();
        if (val !== 'Y' && val !== 'N' && val !== '') {
          sessionError = true;
          results.errors.push({ row: rowNum, error: `Invalid access value for session ${key}: ${val}. Expected Y or N.` });
          break;
        }

        if (val === 'Y') {
          sessionAccess.push({ sessionId, allowed: true });
        } else if (val === 'N') {
          sessionAccess.push({ sessionId, allowed: false });
        }
      }

      if (sessionError) {
        results.rejected++;
        continue;
      }

      validInviteesToInsert.push({
        eventId: new mongoose.Types.ObjectId(eventId),
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
      await inviteeRepository.insertMany(validInviteesToInsert);
      results.imported = validInviteesToInsert.length;
    }

    return results;
  }
};
