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

    const companyVal = (data as any).companyName || (data as any).company;

    const inviteeData = {
      ...data,
      companyName: companyVal,
      company: companyVal,
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
    
    // Helper function to cleanse formula errors & invalid cell objects
    const cleanCellValue = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val).trim();
      if (!str) return '';
      const formulaErrors = ['#VALUE!', '#N/A', '#REF!', '#DIV/0!', '#NAME?', '#NUM!', '#NULL!', '[OBJECT OBJECT]', 'NAN', 'UNDEFINED', 'NULL'];
      if (formulaErrors.some(err => str.toUpperCase().includes(err))) {
        return '';
      }
      return str;
    };

    const isValidEmailFormat = (emailStr: string): boolean => {
      if (!emailStr) return false;
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailStr);
    };

    const isValidMobileFormat = (mobileStr: string): boolean => {
      if (!mobileStr) return false;
      const digits = mobileStr.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    };

    // Filter out completely blank rows
    const nonBlankRows = rowsRaw.filter(
      r => Array.isArray(r) && r.some(cell => cleanCellValue(cell) !== '')
    );

    if (nonBlankRows.length === 0) {
      return { totalRows: 0, imported: 0, updated: 0, rejected: 0, duplicateCount: 0, errors: [] };
    }

    // Smart header column matching
    let nameColIdx = -1;
    let emailColIdx = -1;
    let mobileColIdx = -1;
    let companyColIdx = -1;
    let dietaryColIdx = -1;
    const sessionColMap = new Map<number, string>();

    const firstRowCols = nonBlankRows[0].map((c: any) => cleanCellValue(c).toLowerCase());
    const isHeaderPresent = firstRowCols.some(
      col => col.includes('name') || col.includes('email') || col.includes('mobile') || col.includes('phone') || col.includes('company')
    );

    if (isHeaderPresent) {
      firstRowCols.forEach((colStr: string, colIdx: number) => {
        if (!colStr) return;
        if (colStr.includes('name') && !colStr.includes('company')) nameColIdx = colIdx;
        else if (colStr.includes('email') || colStr.includes('mail')) emailColIdx = colIdx;
        else if (colStr.includes('mobile') || colStr.includes('phone') || colStr.includes('contact') || colStr.includes('whatsapp')) mobileColIdx = colIdx;
        else if (colStr.includes('company') || colStr.includes('organization') || colStr.includes('org')) companyColIdx = colIdx;
        else if (colStr.includes('diet') || colStr.includes('food') || colStr.includes('meal') || colStr.includes('veg') || colStr.includes('dietary')) dietaryColIdx = colIdx;

        // Check session column match dynamically
        for (const session of eventSessions) {
          if (colStr === session.name.toLowerCase() || colStr.includes(session.name.toLowerCase())) {
            sessionColMap.set(colIdx, (session as any)._id.toString());
          }
        }
      });
    }

    // Fallbacks ONLY if no header row was detected
    if (!isHeaderPresent) {
      nameColIdx = 0;
      emailColIdx = 1;
      mobileColIdx = 2;
      companyColIdx = 3;
      dietaryColIdx = 4;
    }

    const dataRows = isHeaderPresent ? nonBlankRows.slice(1) : nonBlankRows;
    
    const results = {
      totalRows: dataRows.length,
      imported: 0,
      updated: 0,
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

      const rawName = nameColIdx !== -1 && row[nameColIdx] !== undefined ? cleanCellValue(row[nameColIdx]) : (!isHeaderPresent ? cleanCellValue(row[0]) : '');
      const rawEmail = emailColIdx !== -1 && row[emailColIdx] !== undefined ? cleanCellValue(row[emailColIdx]).toLowerCase() : (!isHeaderPresent ? cleanCellValue(row[1]).toLowerCase() : '');
      const rawMobile = mobileColIdx !== -1 && row[mobileColIdx] !== undefined ? cleanCellValue(row[mobileColIdx]) : (!isHeaderPresent ? cleanCellValue(row[2]) : '');
      const companyVal = companyColIdx !== -1 && row[companyColIdx] !== undefined ? cleanCellValue(row[companyColIdx]) : (!isHeaderPresent ? cleanCellValue(row[3]) : '');
      const dietaryPreference = dietaryColIdx !== -1 && row[dietaryColIdx] !== undefined ? cleanCellValue(row[dietaryColIdx]) : (!isHeaderPresent ? cleanCellValue(row[4]) : '');

      // 1. Name Validation
      if (!rawName) {
        results.rejected++;
        results.errors.push({ row: rowNum, error: 'Name is required' });
        continue;
      }

      if (rawName.length < 2 || rawName.length > 100) {
        results.rejected++;
        results.errors.push({ row: rowNum, error: `Invalid name '${rawName}' (must be 2-100 characters)` });
        continue;
      }

      // 2. Email & Mobile Validation
      let email = rawEmail;
      let mobile = rawMobile;

      if (email && !isValidEmailFormat(email)) {
        results.rejected++;
        results.errors.push({ row: rowNum, error: `Invalid email format '${email}'` });
        continue;
      }

      if (mobile && !isValidMobileFormat(mobile)) {
        results.rejected++;
        results.errors.push({ row: rowNum, error: `Invalid mobile number format '${mobile}' (must contain 7-15 digits)` });
        continue;
      }

      if (!email && !mobile) {
        results.rejected++;
        results.errors.push({ row: rowNum, error: 'At least one valid contact method (Email or Mobile) is required' });
        continue;
      }

      // 3. In-File Duplicate Check
      const cleanDigits = mobile ? mobile.replace(/\D/g, '') : '';
      const emailDupKey = email ? email : '';
      const mobileDupKey = cleanDigits ? cleanDigits : '';

      if ((emailDupKey && emailsInImport.has(emailDupKey)) || (mobileDupKey && mobilesInImport.has(mobileDupKey))) {
        results.rejected++;
        results.duplicateCount++;
        results.errors.push({ row: rowNum, error: `Duplicate invitee in file (${email || mobile})` });
        continue;
      }

      if (emailDupKey) emailsInImport.add(emailDupKey);
      if (mobileDupKey) mobilesInImport.add(mobileDupKey);

      // 4. Session Access Processing
      const sessionAccess: any[] = [];
      if (sessionColMap.size > 0) {
        sessionColMap.forEach((sessionId, colIdx) => {
          const val = cleanCellValue(row[colIdx]).toUpperCase();
          if (val === 'Y' || val === 'YES' || val === 'TRUE' || val === '1') {
            sessionAccess.push({ sessionId, allowed: true });
          } else if (val === 'N' || val === 'NO' || val === 'FALSE' || val === '0') {
            sessionAccess.push({ sessionId, allowed: false });
          } else {
            sessionAccess.push({ sessionId, allowed: true });
          }
        });
      } else {
        eventSessions.forEach(session => {
          sessionAccess.push({ sessionId: (session as any)._id, allowed: true });
        });
      }

      // 5. Database Duplicate Check & Update
      const dbDuplicates = await inviteeRepository.findByEmailOrMobile(eventId, email, mobile);
      if (dbDuplicates.length > 0) {
        const existing = dbDuplicates[0];
        const updateData: any = {
          name: rawName || existing.name,
          email: email || existing.email,
          mobile: mobile || existing.mobile,
          companyName: companyVal || existing.companyName || (existing as any).company,
          company: companyVal || existing.company || existing.companyName,
          dietaryPreference: dietaryPreference || existing.dietaryPreference,
          sessionAccess: sessionAccess.length > 0 ? sessionAccess : existing.sessionAccess
        };

        await inviteeRepository.update((existing as any)._id.toString(), updateData);
        results.updated++;
        continue;
      }

      validInviteesToInsert.push({
        eventId: new mongoose.Types.ObjectId(eventId),
        name: rawName,
        email,
        mobile,
        companyName: companyVal,
        company: companyVal,
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
