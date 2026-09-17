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
  }
};
