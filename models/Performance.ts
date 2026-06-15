// models/Performance.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPerformance extends Document {
  _id: string;
  userId: string;
  date: Date;
  calls: number;
  meetings: number;
  sales: number;
  conversions: number;
  revenue?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceSchema = new Schema<IPerformance>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    calls: { type: Number, default: 0, min: 0 },
    meetings: { type: Number, default: 0, min: 0 },
    sales: { type: Number, default: 0, min: 0 },
    conversions: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

// One record per user per day
PerformanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Performance: Model<IPerformance> = mongoose.models.Performance || mongoose.model<IPerformance>('Performance', PerformanceSchema);
export default Performance;
