import { RefreshToken, IRefreshToken } from '../models/RefreshToken';

export const tokenRepository = {
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<IRefreshToken> {
    const rt = new RefreshToken({ userId, token, expiresAt });
    return rt.save();
  },

  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token });
  },

  async revokeToken(token: string): Promise<void> {
    await RefreshToken.updateOne({ token }, { isRevoked: true });
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshToken.updateMany({ userId }, { isRevoked: true });
  }
};
