import { Schema, model } from 'mongoose';

export const USER_ROLES = ['customer', 'crew'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CREW_STATUSES = ['pending', 'approved', 'rejected', 'suspended'] as const;
export type CrewStatus = (typeof CREW_STATUSES)[number];

export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  crewStatus?: CrewStatus;
  phone?: string;
  city?: string;
  crewCategory?: string;
  crewExperience?: string;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'customer',
    },
    crewStatus: {
      type: String,
      enum: CREW_STATUSES,
    },
    phone: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    crewCategory: {
      type: String,
      trim: true,
    },
    crewExperience: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const value = ret as Record<string, unknown>;
    value.id = String(value._id);
    delete value._id;
    delete value.__v;
    delete value.passwordHash;
    return value;
  },
});

export const User = model<UserDocument>('User', userSchema);
