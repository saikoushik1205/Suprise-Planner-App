import { Schema, model } from 'mongoose';

export type UserDocument = {
  name: string;
  email: string;
  passwordHash: string;
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
