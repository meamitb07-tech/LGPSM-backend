import { OAuth2Client } from 'google-auth-library';
import { userRepository } from '../repositories/user.repository';
import { tokenRepository } from '../repositories/token.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/token';
import { sendEmail } from '../utils/email.provider';
import { AuthProvider, Role } from '../models/User';
import { env } from '../config/env';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const authService = {
  async register(data: any) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already in use' };
    }

    const hashedPassword = await hashPassword(data.password);

    // Role comes only from the explicit (validated) input; never inferred from name/email
    let assignedRole = Role.ORGANIZER;
    if (data.role && Object.values(Role).includes(data.role as Role)) {
      assignedRole = data.role as Role;
    }

    const user = await userRepository.create({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
      authProvider: AuthProvider.LOCAL,
      role: assignedRole
    });

    return user;
  },

  async login(data: any) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || !user.isActive) {
      throw { statusCode: 401, message: 'Invalid credentials or inactive account' };
    }

    if (user.authProvider !== AuthProvider.LOCAL || !user.passwordHash) {
      throw { statusCode: 401, message: 'Invalid authentication method' };
    }

    const isMatch = await verifyPassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw { statusCode: 401, message: 'Invalid credentials or inactive account' };
    }

    // The login portal (Admin / Organizer / System User) must match the stored role.
    // A login request can never change a user's role.
    if (data.role && data.role !== user.role) {
      throw { statusCode: 403, message: `This account is not registered as ${String(data.role).replace('_', ' ').toLowerCase()}. Please use the correct login option.` };
    }

    const userId = (user as any)._id.toString();
    const accessToken = generateAccessToken(userId, user.role);
    const refreshToken = generateRefreshToken(userId, user.role);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await tokenRepository.createRefreshToken(userId, refreshToken, expiresAt);

    return { user, accessToken, refreshToken };
  },

  async googleAuth(idToken: string) {
    if (!env.GOOGLE_CLIENT_ID) {
      throw { statusCode: 501, message: 'Google Auth not configured on server' };
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      throw { statusCode: 401, message: 'Invalid or unverified Google token' };
    }

    let user = await userRepository.findByEmail(payload.email);
    
    if (!user) {
      user = await userRepository.create({
        fullName: payload.name || 'Google User',
        email: payload.email,
        authProvider: AuthProvider.GOOGLE,
        role: Role.ORGANIZER
      });
    } else if (user.authProvider !== AuthProvider.GOOGLE) {
       throw { statusCode: 400, message: 'Email already associated with a local account' };
    }

    if (!user.isActive) {
      throw { statusCode: 403, message: 'User account is inactive' };
    }

    const userId = (user as any)._id.toString();
    const accessToken = generateAccessToken(userId, user.role);
    const refreshToken = generateRefreshToken(userId, user.role);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await tokenRepository.createRefreshToken(userId, refreshToken, expiresAt);

    return { user, accessToken, refreshToken };
  },

  async refresh(token: string) {
    const payload = verifyRefreshToken(token);
    
    const tokenDoc = await tokenRepository.findByToken(token);
    if (!tokenDoc || tokenDoc.isRevoked || tokenDoc.expiresAt < new Date()) {
      throw { statusCode: 401, message: 'Invalid or expired refresh token' };
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw { statusCode: 401, message: 'User not found or inactive' };
    }

    await tokenRepository.revokeToken(token);

    const userId = (user as any)._id.toString();
    const newAccessToken = generateAccessToken(userId, user.role);
    const newRefreshToken = generateRefreshToken(userId, user.role);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await tokenRepository.createRefreshToken(userId, newRefreshToken, expiresAt);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(token: string) {
    if (token) {
      await tokenRepository.revokeToken(token);
    }
  },

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return;

    const resetToken = generatePasswordResetToken((user as any)._id.toString(), user.role);
    const resetUrl = `${env.FRONTEND_URL}/forgot-password?token=${encodeURIComponent(resetToken)}`;

    try {
      await sendEmail(
        user.email,
        'Reset your LGPSM password',
        `<p>Hello ${user.fullName},</p><p>Use the link below to reset your password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`
      );
    } catch (err) {
      // Without a working mail provider the link is only surfaced to developers
      if (env.NODE_ENV !== 'production') {
        console.log(`[DEV ONLY] Password reset link for ${email}: ${resetUrl}`);
      } else {
        console.error('Password reset email could not be sent:', (err as Error).message);
      }
    }
  },

  async resetPassword(token: string, newPassword: string) {
    const payload = verifyPasswordResetToken(token);

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw { statusCode: 400, message: 'Invalid token' };
    }

    const hashedPassword = await hashPassword(newPassword);
    await userRepository.updateById((user as any)._id.toString(), { passwordHash: hashedPassword });
    
    await tokenRepository.revokeAllForUser((user as any)._id.toString());
  }
};
