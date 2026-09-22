import { User, IUser, Role, AuthProvider } from '../models/User';

export const userRepository = {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  },

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  },

  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return user.save();
  },

  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  },

  async find(query: any = {}): Promise<IUser[]> {
    return User.find(query).select('-passwordHash').sort({ createdAt: -1 });
  }
};
