import { Schema, Types, model } from 'mongoose';

export const SURPRISE_STATUSES = ['planned', 'in-progress', 'completed'] as const;
export type SurpriseStatus = (typeof SURPRISE_STATUSES)[number];

export type SurpriseDocument = {
  userId: Types.ObjectId;
  title: string;
  recipientName: string;
  occasion: string;
  date: Date;
  budget: number;
  description: string;
  status: SurpriseStatus;
  city?: string;
  relationship?: string;
  createdAt: Date;
  updatedAt: Date;
};

const surpriseSchema = new Schema<SurpriseDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    occasion: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: SURPRISE_STATUSES,
      default: 'planned',
    },
    city: {
      type: String,
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

surpriseSchema.set('toJSON', {
  transform(_doc, ret) {
    const value = ret as Record<string, unknown>;
    value.id = String(value._id);
    delete value._id;
    delete value.__v;
    return value;
  },
});

export const Surprise = model<SurpriseDocument>('Surprise', surpriseSchema);
