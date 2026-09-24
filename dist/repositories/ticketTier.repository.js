"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketTierRepository = void 0;
const TicketTier_1 = require("../models/TicketTier");
exports.ticketTierRepository = {
    async create(data) {
        return await TicketTier_1.TicketTier.create(data);
    },
    async findByEventId(eventId, activeOnly = true) {
        const query = { eventId };
        if (activeOnly)
            query.isActive = true;
        return await TicketTier_1.TicketTier.find(query).sort({ price: 1 });
    },
    async findById(id) {
        return await TicketTier_1.TicketTier.findById(id);
    },
    async update(id, updateData) {
        return await TicketTier_1.TicketTier.findByIdAndUpdate(id, updateData, { new: true });
    },
    async delete(id) {
        return await TicketTier_1.TicketTier.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
};
