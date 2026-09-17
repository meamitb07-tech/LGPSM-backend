import { userRepository } from '../repositories/user.repository';

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  },

  async updateProfile(userId: string, data: any) {
    const user = await userRepository.updateById(userId, data);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  },

  async createUser(creatorRole: string, data: any) {
    // Role Hierarchy rules
    if (creatorRole === 'ORGANIZER' && data.role !== 'SYSTEM_USER') {
      throw { statusCode: 403, message: 'Organizers can only create staff (SYSTEM_USER)' };
    }
    // Admins can create ORGANIZER and SYSTEM_USER (and admins if needed)

    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already in use' };
    }

    const { hashPassword } = await import('../utils/password');
    const { AuthProvider } = await import('../models/User');

    const hashedPassword = await hashPassword(data.password);
    const user = await userRepository.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash: hashedPassword,
      authProvider: AuthProvider.LOCAL,
      role: data.role
    });

    return user;
  }
};
