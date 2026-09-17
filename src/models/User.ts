import mongoose, { Document, Schema } from 'mongoose';

export enum Role {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  SYSTEM_USER = 'SYSTEM_USER'
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE'
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  authProvider: AuthProvider;
  role: Role;
  profile?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    passwordHash: { type: String },
    authProvider: { type: String, enum: Object.values(AuthProvider), default: AuthProvider.LOCAL },
    role: { type: String, enum: Object.values(Role), default: Role.ORGANIZER },
    profile: { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
