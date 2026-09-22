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
      
      const isDuplicate = duplicates.some(dup => (dup as any)._id.toString() !== inviteeId);
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
    
    const rowsRaw = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 }) || [];
    
    // Filter out completely blank rows
    const nonBlankRows = rowsRaw.filter(
      r => Array.isArray(r) && r.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    if (nonBlankRows.length === 0) {
      return { totalRows: 0, imported: 0, rejected: 0, duplicateCount: 0, errors: [] };
    }

    // Check if first row is header
    let headerRowIdx = -1;
    let nameColIdx = 0;
    let emailColIdx = 1;
    let mobileColIdx = 2;
    let dietaryColIdx = 3;
    const sessionColMap = new Map<number, string>();

    const firstRowStr = nonBlankRows[0].map((c: any) => String(c).trim().toLowerCase()).join(' ');
    const isHeaderPresent = firstRowStr.includes('name') || firstRowStr.includes('email') || firstRowStr.includes('mobile') || firstRowStr.includes('phone');

    if (isHeaderPresent) {
      headerRowIdx = 0;
      const headerCols = nonBlankRows[0].map((c: any) => String(c).trim().toLowerCase());
      
      headerCols.forEach((colStr: string, colIdx: number) => {
        if (colStr.includes('name')) nameColIdx = colIdx;
        else if (colStr.includes('email')) emailColIdx = colIdx;
        else if (colStr.includes('mobile') || colStr.includes('phone') || colStr.includes('contact')) mobileColIdx = colIdx;
        else if (colStr.includes('diet') || colStr.includes('pref') || colStr.includes('food') || colStr.includes('meal') || colStr.includes('veg')) dietaryColIdx = colIdx;

        // Check session column match
        for (const session of eventSessions) {
          if (colStr === session.name.toLowerCase()) {
            sessionColMap.set(colIdx, (session as any)._id.toString());
          }
        }
      });
    }

    const dataRows = isHeaderPresent ? nonBlankRows.slice(1) : nonBlankRows;
    
    const results = {
      totalRows: dataRows.length,
      imported: 0,
      rejected: 0,
      duplicateCount: 0,
      errors: [] as { row: number; error: string }[]
    };

    const validInviteesToInsert: any[] = [];
    const emailsInImport = new Set<string>();
    const mobilesInImport = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + (isHeaderPresent ? 2 : 1);

      const name = String(row[nameColIdx] !== undefined && row[nameColIdx] !== null ? row[nameColIdx] : (row[0] || '')).trim();
      const email = String(row[emailColIdx] !== undefined && row[emailColIdx] !== null ? row[emailColIdx] : (row[1] || '')).trim().toLowerCase();
      const mobile = String(row[mobileColIdx] !== undefined && row[mobileColIdx] !== null ? row[mobileColIdx] : (row[2] || '')).trim();
      const dietaryPreference = String(
        row[dietaryColIdx] !== undefined && row[dietaryColIdx] !== null 
          ? row[dietaryColIdx] 
          : (row[3] !== undefined && row[3] !== null ? row[3] : '')
      ).trim();

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

      if (email) emailsInImport.add(email);
      if (mobile) mobilesInImport.add(mobile);

      // Process Session Access
      const sessionAccess: any[] = [];
      
      if (sessionColMap.size > 0) {
        sessionColMap.forEach((sessionId, colIdx) => {
          const val = String(row[colIdx] || '').trim().toUpperCase();
          if (val === 'Y' || val === 'YES' || val === 'TRUE' || val === '1') {
            sessionAccess.push({ sessionId, allowed: true });
          } else if (val === 'N' || val === 'NO' || val === 'FALSE' || val === '0') {
            sessionAccess.push({ sessionId, allowed: false });
          } else {
            sessionAccess.push({ sessionId, allowed: true });
          }
        });
      } else {
        // Default access to all event sessions if no session columns specified
        eventSessions.forEach(session => {
          sessionAccess.push({ sessionId: session._id, allowed: true });
        });
      }

      // Check DB duplicates - update if exists so re-imported rows are updated & kept
      const dbDuplicates = await inviteeRepository.findByEmailOrMobile(eventId, email, mobile);
      if (dbDuplicates.length > 0) {
        const existing = dbDuplicates[0];
        await inviteeRepository.update((existing as any)._id.toString(), {
          name: name || existing.name,
          email: email || existing.email,
          mobile: mobile || existing.mobile,
          dietaryPreference: dietaryPreference || existing.dietaryPreference,
          sessionAccess: sessionAccess.length > 0 ? sessionAccess : existing.sessionAccess
        });
        results.imported++;
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
      results.imported += validInviteesToInsert.length;
    }

    return results;
  }
};
