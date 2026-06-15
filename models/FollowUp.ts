// models/FollowUp.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type FollowUpType = 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit';
export type FollowUpStatus = 'pending' | 'done' | 'missed' | 'rescheduled';

export interface IFollowUp extends Document {
  _id: string;
  userId: string;
  leadId?: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduledAt: Date;
  notes?: string;
  reminder?: boolean;
  reminderMinutes?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    userId: { type: String, required: true, index: true },
    leadId: { type: String },
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String },
    contactEmail: { type: String },
    type: { type: String, enum: ['call', 'email', 'whatsapp', 'meeting', 'visit'], default: 'call' },
    status: { type: String, enum: ['pending', 'done', 'missed', 'rescheduled'], default: 'pending' },
    scheduledAt: { type: Date, required: true },
    notes: { type: String },
    reminder: { type: Boolean, default: true },
    reminderMinutes: { type: Number, default: 30 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const FollowUp: Model<IFollowUp> = mongoose.models.FollowUp || mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);
export default FollowUp;
