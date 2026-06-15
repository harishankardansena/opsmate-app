// models/Lead.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'interested' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'social_media' | 'email' | 'walk_in' | 'other';

export interface ILead extends Document {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  designation?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  value?: number;
  nextFollowUp?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true },
    company: { type: String },
    designation: { type: String },
    source: {
      type: String,
      enum: ['website', 'referral', 'cold_call', 'social_media', 'email', 'walk_in', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'follow_up', 'interested', 'converted', 'lost'],
      default: 'new',
    },
    notes: { type: String },
    value: { type: Number },
    nextFollowUp: { type: Date },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
export default Lead;
