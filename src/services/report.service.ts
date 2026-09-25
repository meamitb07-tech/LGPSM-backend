import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Invitee, RsvpStatus, InvitationStatus } from '../models/Invitee';
import { CheckIn } from '../models/CheckIn';
import { Session } from '../models/Session';
import { SystemUserAssignment } from '../models/SystemUserAssignment';

export const reportService = {
  async getDashboardStats(user: { userId: string; role: string }) {
    const isOrganizer = user.role !== 'ADMIN';
    const eventQuery: any = isOrganizer ? { organizerId: new mongoose.Types.ObjectId(user.userId) } : {};

    const totalEvents = await Event.countDocuments(eventQuery);
    
    // Get all matching event IDs
    const events = await Event.find(eventQuery, '_id');
    const eventIds = events.map(e => e._id);

    const totalInvitees = await Invitee.countDocuments({ eventId: { $in: eventIds } });
    const totalCheckIns = await CheckIn.countDocuments({ eventId: { $in: eventIds }});

    const rsvpStats = await Invitee.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$rsvpStatus', count: { $sum: 1 } } }
    ]);

    const rsvpSummary = {
      ACCEPTED: 0,
      DECLINED: 0,
      PENDING: 0
    };

    rsvpStats.forEach((stat: any) => {
      if (stat._id in rsvpSummary) {
        (rsvpSummary as any)[stat._id] = stat.count;
      }
    });

    return {
      totalEvents,
      totalInvitees,
      totalCheckIns,
      rsvpSummary
    };
  },

  async getEventReport(eventId: string, user: { userId: string; role: string }) {
    const isOrganizer = user.role !== 'ADMIN';
    const eventQuery: any = { _id: eventId };
    if (isOrganizer) {
      eventQuery.organizerId = user.userId;
    }

    const event = await Event.findOne(eventQuery);
    if (!event) throw new Error('EVENT_NOT_FOUND');

    const eventObjId = new mongoose.Types.ObjectId(eventId);

    const totalInvitees = await Invitee.countDocuments({ eventId: eventObjId });
    const totalCheckIns = await CheckIn.countDocuments({ eventId: eventObjId});

    // RSVP breakdown
    const rsvpStats = await Invitee.aggregate([
      { $match: { eventId: eventObjId } },
      { $group: { _id: '$rsvpStatus', count: { $sum: 1 } } }
    ]);

    const rsvpSummary = { ACCEPTED: 0, DECLINED: 0, PENDING: 0 };
    rsvpStats.forEach((stat: any) => {
      if (stat._id in rsvpSummary) {
        (rsvpSummary as any)[stat._id] = stat.count;
      }
    });

    // Invitation Delivery Status breakdown
    const deliveryStats = await Invitee.aggregate([
      { $match: { eventId: eventObjId } },
      { $group: { _id: '$invitationStatus', count: { $sum: 1 } } }
    ]);

    const deliverySummary = { SENT: 0, PENDING: 0, FAILED: 0 };
    deliveryStats.forEach((stat: any) => {
      if (stat._id in deliverySummary) {
        (deliverySummary as any)[stat._id] = stat.count;
      }
    });

    // Check-in Method breakdown (QR vs MANUAL)
    const methodStats = await CheckIn.aggregate([
      { $match: { eventId: eventObjId} },
      { $group: { _id: '$checkInMethod', count: { $sum: 1 } } }
    ]);

    const checkInMethods = { QR: 0, MANUAL: 0 };
    methodStats.forEach((stat: any) => {
      if (stat._id in checkInMethods) {
        (checkInMethods as any)[stat._id] = stat.count;
      }
    });

    // Distinct attendees (an invitee checked into several sessions counts once)
    const attendeeIds = await CheckIn.distinct('inviteeId', { eventId: eventObjId });
    const uniqueAttendees = attendeeIds.length;

    // System users assigned to this event
    const assignments = await SystemUserAssignment.find({ eventId: eventObjId }, 'sessionIds').lean();
    const totalSystemUsers = assignments.length;

    // Sessions breakdown
    const sessions = await Session.find({ eventId: eventObjId }).sort({ 'schedule.start': 1 });
    const sessionReports = await Promise.all(
      sessions.map(async (sess) => {
        const [count, sessionAttendees, invitedCount] = await Promise.all([
          CheckIn.countDocuments({ eventId: eventObjId, sessionId: sess._id }),
          CheckIn.distinct('inviteeId', { eventId: eventObjId, sessionId: sess._id }),
          // Invitees with no explicit session rules may attend every session
          Invitee.countDocuments({
            eventId: eventObjId,
            $or: [
              { sessionAccess: { $size: 0 } },
              { sessionAccess: { $elemMatch: { sessionId: sess._id, allowed: true } } }
            ]
          })
        ]);
        // Staff with no session restriction cover every session
        const systemUsers = assignments.filter((a: any) =>
          !a.sessionIds || a.sessionIds.length === 0 || a.sessionIds.some((id: any) => id.toString() === (sess._id as any).toString())
        ).length;
        return {
          sessionId: sess._id,
          name: sess.name,
          checkInCount: count,
          attendeeCount: sessionAttendees.length,
          invitedCount,
          systemUsers,
          accessControl: sess.accessControl,
          schedule: sess.schedule
        };
      })
    );

    const attendanceRate = totalInvitees > 0 ? ((uniqueAttendees / totalInvitees) * 100).toFixed(2) + '%' : '0.00%';

    return {
      event: {
        id: event._id,
        title: event.title,
        schedule: event.schedule,
        format: event.format
      },
      attendanceRate,
      totalInvitees,
      totalCheckIns,
      uniqueAttendees,
      totalSessions: sessions.length,
      totalSystemUsers,
      rsvpSummary,
      deliverySummary,
      checkInMethods,
      sessionReports
    };
  }
};
