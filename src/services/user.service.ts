import { userRepository } from '../repositories/user.repository';
import { Role } from '../models/User';

// Organizers may only manage staff accounts (SYSTEM_USER); admins may manage anyone.
async function findManageableUser(actorRole: string, userId: string) {
  const target = await userRepository.findById(userId);
  if (!target) {
    throw { statusCode: 404, message: 'User not found' };
  }
  if (actorRole === Role.ORGANIZER && target.role !== Role.SYSTEM_USER) {
    throw { statusCode: 403, message: 'Organizers can only manage staff (SYSTEM_USER) accounts' };
  }
  return target;
}

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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    if (!user.passwordHash) {
      throw { statusCode: 400, message: 'This account signs in with Google and has no password to change' };
    }

    const { verifyPassword, hashPassword } = await import('../utils/password');
    const matches = await verifyPassword(currentPassword, user.passwordHash);
    if (!matches) {
      throw { statusCode: 400, message: 'Current password is incorrect' };
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    return { updated: true };
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
      phone: data.phone,
      ...(data.profile ? { profile: data.profile } : {}),
      passwordHash: hashedPassword,
      authProvider: AuthProvider.LOCAL,
      role: data.role
    });

    return user;
  },

  async getUsers(actorRole: string, role?: string) {
    const query: any = { isActive: true };
    if (role) {
      query.role = role;
    }
    // Organizers only ever see staff accounts
    if (actorRole === Role.ORGANIZER) {
      query.role = Role.SYSTEM_USER;
    }
    return await userRepository.find(query);
  },

  async deleteUser(actorRole: string, userId: string) {
    await findManageableUser(actorRole, userId);
    const user = await userRepository.updateById(userId, { isActive: false });
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return { deleted: true };
  },

  async updateUser(actorRole: string, userId: string, data: any) {
    await findManageableUser(actorRole, userId);

    const updatePayload: any = {};
    if (data.fullName !== undefined) updatePayload.fullName = data.fullName;
    if (data.email !== undefined) {
      const existing = await userRepository.findByEmail(String(data.email).toLowerCase().trim());
      if (existing && (existing as any)._id.toString() !== userId) {
        throw { statusCode: 409, message: 'Email already in use' };
      }
      updatePayload.email = data.email;
    }
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.password) {
      const { hashPassword } = await import('../utils/password');
      updatePayload.passwordHash = await hashPassword(data.password);
    }
    const user = await userRepository.updateById(userId, updatePayload);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }
    return user;
  }
};
