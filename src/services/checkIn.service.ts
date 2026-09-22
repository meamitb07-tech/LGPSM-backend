import mongoose from 'mongoose';
import { CheckIn, CheckInMethod, ICheckIn } from '../models/CheckIn';
import { Event, EventStatus } from '../models/Event';
import { Invitee, IInvitee, RsvpStatus } from '../models/Invitee';
import { Session, AccessControl } from '../models/Session';
import { User, Role } from '../models/User';
import { SystemUserAssignment } from '../models/SystemUserAssignment';
import { checkInRepository } from '../repositories/checkIn.repository';
import { hashToken } from '../utils/invitation.util';

export interface ScanCheckInDto {
  qrCode: string;
  eventId?: string;
  sessionId?: string;
}

export interface ManualCheckInDto {
  eventId: string;
  inviteeId?: string;
  email?: string;
  mobile?: string;
  sessionId?: string;
}

export interface GetCheckInsOptions {
  sessionId?: string;
  checkInMethod?: string;
  page?: number;
  limit?: number;
}

export const checkInService = {
  async scanCheckIn(actor: { userId: string; role: Role }, dto: ScanCheckInDto) {
    const rawToken = this.extractRawToken(dto.qrCode);
    if (!rawToken) {
      throw new Error('INVALID_QR_TOKEN');
    }

    const tokenHash = hashToken(rawToken);
    const invitee = await Invitee.findOne({ qrTokenHash: tokenHash });
    if (!invitee) {
      throw new Error('INVALID_QR_TOKEN');
    }

    const eventId = invitee.eventId.toString();
    if (dto.eventId && dto.eventId !== eventId) {
      throw new Error('EVENT_MISMATCH');
    }

    const { event, assignment } = await this.validateActorAndEvent(actor, eventId);

    if (dto.sessionId) {
      await this.validateStaffSessionAccess(actor, assignment, dto.sessionId);
    }

    await this.validateInviteeEligibility(invitee, event);

    let session = null;
    if (dto.sessionId) {
      session = await this.validateSessionAndRules(invitee, eventId, dto.sessionId);
    }

    // Check duplicate event-wide check-in if no sessionId
    if (!dto.sessionId) {
      const existing = await checkInRepository.findEventWideCheckIn((invitee._id as any).toString(), eventId);
      if (existing) {
        throw new Error('DUPLICATE_CHECKIN');
      }
    }

    const checkIn = await checkInRepository.create({
      eventId: new mongoose.Types.ObjectId(eventId),
      inviteeId: invitee._id as any,
      sessionId: dto.sessionId ? new mongoose.Types.ObjectId(dto.sessionId) : null,
      checkInMethod: CheckInMethod.QR,
      checkedInBy: new mongoose.Types.ObjectId(actor.userId),
      checkInAt: new Date()
    });

    return this.formatCheckInResponse(checkIn, invitee, session);
  },

  async manualCheckIn(actor: { userId: string; role: Role }, dto: ManualCheckInDto) {
    if (!dto.eventId) {
      throw new Error('EVENT_ID_REQUIRED');
    }

    const { event, assignment } = await this.validateActorAndEvent(actor, dto.eventId);

    if (dto.sessionId) {
      await this.validateStaffSessionAccess(actor, assignment, dto.sessionId);
    }

    let invitee: IInvitee | null = null;
    if (dto.inviteeId) {
      invitee = await Invitee.findOne({ _id: dto.inviteeId, eventId: dto.eventId });
    } else if (dto.email) {
      invitee = await Invitee.findOne({ eventId: dto.eventId, email: dto.email.trim().toLowerCase() });
    } else if (dto.mobile) {
      invitee = await Invitee.findOne({ eventId: dto.eventId, mobile: dto.mobile.trim() });
    }

    if (!invitee) {
      throw new Error('INVITEE_NOT_FOUND');
    }

    await this.validateInviteeEligibility(invitee, event);

    let session = null;
    if (dto.sessionId) {
      session = await this.validateSessionAndRules(invitee, dto.eventId, dto.sessionId);
    }

    if (!dto.sessionId) {
      const existing = await checkInRepository.findEventWideCheckIn((invitee._id as any).toString(), dto.eventId);
      if (existing) {
        throw new Error('DUPLICATE_CHECKIN');
      }
    }

    const checkIn = await checkInRepository.create({
      eventId: new mongoose.Types.ObjectId(dto.eventId),
      inviteeId: invitee._id as any,
      sessionId: dto.sessionId ? new mongoose.Types.ObjectId(dto.sessionId) : null,
      checkInMethod: CheckInMethod.MANUAL,
      checkedInBy: new mongoose.Types.ObjectId(actor.userId),
      checkInAt: new Date()
    });

    return this.formatCheckInResponse(checkIn, invitee, session);
  },

  async getCheckIns(actor: { userId: string; role: Role }, eventId: string, options: GetCheckInsOptions) {
    const { assignment } = await this.validateActorAndEvent(actor, eventId);

    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    let allowedSessionIds: string[] | undefined = undefined;

    if (actor.role === Role.SYSTEM_USER && assignment) {
      if (assignment.sessionIds && assignment.sessionIds.length > 0) {
        allowedSessionIds = assignment.sessionIds.map((id: any) => id.toString());
      }
    }

    if (options.sessionId) {
      if (actor.role === Role.SYSTEM_USER && allowedSessionIds && !allowedSessionIds.includes(options.sessionId)) {
        throw new Error('STAFF_SESSION_FORBIDDEN');
      }
    }

    const records = await checkInRepository.findEventCheckIns(eventId, {
      sessionId: options.sessionId,
      checkInMethod: options.checkInMethod,
      allowedSessionIds,
      skip,
      limit
    });

    const total = await checkInRepository.countEventCheckIns(eventId, {
      sessionId: options.sessionId,
      checkInMethod: options.checkInMethod,
      allowedSessionIds
    });

    const sanitizedRecords = records.map(record => {
      const invitee = record.inviteeId as any;
      const session = record.sessionId as any;
      const checkedInBy = record.checkedInBy as any;

      return {
        _id: record._id,
        eventId: record.eventId,
        checkInMethod: record.checkInMethod,
        checkInAt: record.checkInAt,
        invitee: invitee ? {
          _id: invitee._id,
          name: invitee.name,
          email: invitee.email,
          mobile: invitee.mobile,
          dietaryPreference: invitee.dietaryPreference,
          rsvpStatus: invitee.rsvpStatus
        } : null,
        session: session ? {
          _id: session._id,
          name: session.name,
          schedule: session.schedule
        } : null,
        checkedInBy: checkedInBy ? {
          _id: checkedInBy._id,
          fullName: checkedInBy.fullName,
          email: checkedInBy.email,
          role: checkedInBy.role
        } : record.checkedInBy
      };
    });

    return {
      checkIns: sanitizedRecords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  },

  // Helper Methods
  extractRawToken(qrCode: string): string {
    if (!qrCode || typeof qrCode !== 'string') return '';
    const trimmed = qrCode.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const segments = url.pathname.split('/').filter(Boolean);
        return segments[segments.length - 1] || '';
      } catch (err) {
        return trimmed;
      }
    }
    return trimmed;
  },

  async validateActorAndEvent(actor: { userId: string; role: Role }, eventId: string) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('EVENT_NOT_FOUND');
    }

    let assignment: any = null;

    if (actor.role === Role.ADMIN) {
      return { event, assignment: null };
    }

    if (actor.role === Role.ORGANIZER) {
      if (event.organizerId.toString() !== actor.userId) {
        throw new Error('FORBIDDEN');
      }
      return { event, assignment: null };
    }

    if (actor.role === Role.SYSTEM_USER) {
      assignment = await SystemUserAssignment.findOne({ userId: actor.userId, eventId });
      if (!assignment) {
        throw new Error('STAFF_EVENT_FORBIDDEN');
      }
      return { event, assignment };
    }

    throw new Error('FORBIDDEN');
  },

  async validateStaffSessionAccess(actor: { userId: string; role: Role }, assignment: any, sessionId: string) {
    if (actor.role === Role.SYSTEM_USER && assignment) {
      if (assignment.sessionIds && assignment.sessionIds.length > 0) {
        const hasSession = assignment.sessionIds.some((id: any) => id.toString() === sessionId);
        if (!hasSession) {
          throw new Error('STAFF_SESSION_FORBIDDEN');
        }
      }
    }
  },

  async validateInviteeEligibility(invitee: IInvitee, event: any) {
    if (event.rsvp && event.rsvp.enabled) {
      if (invitee.rsvpStatus === RsvpStatus.DECLINED && !event.rsvp.allowDeclined) {
        throw new Error('RSVP_DECLINED');
      }
      if (invitee.rsvpStatus === RsvpStatus.PENDING && !event.rsvp.allowNotResponded && !event.rsvp.allowAllInvited) {
        throw new Error('RSVP_PENDING');
      }
    }
  },

  async validateSessionAndRules(invitee: IInvitee, eventId: string, sessionId: string) {
    const session = await Session.findOne({ _id: sessionId, eventId });
    if (!session) {
      throw new Error('SESSION_NOT_FOUND');
    }

    // Invitee session permissions check
    if (invitee.sessionAccess && invitee.sessionAccess.length > 0) {
      const accessEntry = invitee.sessionAccess.find(sa => sa.sessionId.toString() === sessionId);
      if (accessEntry) {
        if (!accessEntry.allowed) {
          throw new Error('INVITEE_SESSION_DENIED');
        }
      } else {
        // Invitee has explicit session access rules defined, but this session is missing
        throw new Error('INVITEE_SESSION_DENIED');
      }
    }

    // AccessControl (ONLY_ONCE / NO_RESTRICTION) check
    const existingSessionCheckIn = await checkInRepository.findByInviteeAndSession((invitee._id as any).toString(), sessionId);

    if (session.accessControl === AccessControl.ONLY_ONCE && existingSessionCheckIn) {
      throw new Error('ONLY_ONCE_VIOLATION');
    }

    if (session.accessControl === AccessControl.NO_RESTRICTION && existingSessionCheckIn) {
      throw new Error('DUPLICATE_CHECKIN');
    }

    // Cross-session validation check
    if (session.validateAgainstOtherSessions) {
      const otherCheckIns = await checkInRepository.findOtherSessionCheckIns((invitee._id as any).toString(), eventId, sessionId);
      if (otherCheckIns.length > 0) {
        throw new Error('CROSS_SESSION_CONFLICT');
      }
    }

    return session;
  },

  formatCheckInResponse(checkIn: ICheckIn, invitee: IInvitee, session: any) {
    return {
      _id: checkIn._id,
      eventId: checkIn.eventId,
      checkInMethod: checkIn.checkInMethod,
      checkInAt: checkIn.checkInAt,
      checkedInBy: checkIn.checkedInBy,
      invitee: {
        _id: invitee._id,
        name: invitee.name,
        email: invitee.email,
        mobile: invitee.mobile,
        dietaryPreference: invitee.dietaryPreference,
        rsvpStatus: invitee.rsvpStatus
      },
      session: session ? {
        _id: session._id,
        name: session.name,
        schedule: session.schedule
      } : null
    };
  }
};
