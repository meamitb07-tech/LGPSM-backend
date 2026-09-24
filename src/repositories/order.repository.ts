import { Order, IOrder } from '../models/Order';

export const orderRepository = {
  async create(data: Partial<IOrder>): Promise<IOrder> {
    return await Order.create(data);
  },

  async findById(id: string): Promise<IOrder | null> {
    return await Order.findById(id).populate('eventId').populate('ticketTierId').populate('userId', 'fullName email');
  },

  async findByUserId(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const orders = await Order.find({ userId })
      .populate('eventId', 'title schedule location')
      .populate('ticketTierId', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ userId });
    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  },

  async updateStatus(id: string, status: string, providerOrderId?: string): Promise<IOrder | null> {
    const update: any = { status };
    if (providerOrderId) update.providerOrderId = providerOrderId;
    return await Order.findByIdAndUpdate(id, update, { new: true });
  }
};
