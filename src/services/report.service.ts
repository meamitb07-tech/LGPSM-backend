import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Invitee, RsvpStatus, InvitationStatus } from '../models/Invitee';
import { CheckIn } from '../models/CheckIn';
import { Session } from '../models/Session';

export const reportService = {
  async getDashboardStats(user: { userId: string; role: string }) {
    const isOrganizer = user.role !== 'ADMIN';
    const eventQuery: any = isOrganizer ? { organizerId: new mongoose.Types.ObjectId(user.userId) } : {};

    const totalEvents = await Event.countDocuments(eventQuery);
    
    // Get all matching event IDs
    const events = await Event.find(eventQuery, '_id');
    const eventIds = events.map(e => e._id);

    const totalInvitees = await Invitee.countDocuments({ eventId: { $in: eventIds } });
    const totalCheckIns = await CheckIn.countDocuments({ eventId: { $in: eventIds }, status: 'CHECKED_IN' });

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
    const totalCheckIns = await CheckIn.countDocuments({ eventId: eventObjId, status: 'CHECKED_IN' });

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
      { $match: { eventId: eventObjId, status: 'CHECKED_IN' } },
      { $group: { _id: '$method', count: { $sum: 1 } } }
    ]);

    const checkInMethods = { QR: 0, MANUAL: 0 };
    methodStats.forEach((stat: any) => {
      if (stat._id in checkInMethods) {
        (checkInMethods as any)[stat._id] = stat.count;
      }
    });

    // Sessions breakdown
    const sessions = await Session.find({ eventId: eventObjId });
    const sessionReports = await Promise.all(
      sessions.map(async (sess) => {
        const count = await CheckIn.countDocuments({ eventId: eventObjId, sessionId: sess._id, status: 'CHECKED_IN' });
        return {
          sessionId: sess._id,
          name: sess.name,
          checkInCount: count,
          schedule: sess.schedule
        };
      })
    );

    const attendanceRate = totalInvitees > 0 ? ((totalCheckIns / totalInvitees) * 100).toFixed(2) + '%' : '0.00%';

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
      rsvpSummary,
      deliverySummary,
      checkInMethods,
      sessionReports
    };
  }
};
