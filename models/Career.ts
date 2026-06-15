// models/Career.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICareerGoal {
  title: string;
  targetDate?: Date;
  achieved: boolean;
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialUrl?: string;
}

export interface ICareer extends Document {
  _id: string;
  userId: string;
  currentRole?: string;
  targetRole?: string;
  skills?: string[];
  resumeVersions?: {
    name: string;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    uploadedAt: Date;
    isActive: boolean;
  }[];
  certifications?: ICertification[];
  goals?: ICareerGoal[];
  interviewNotes?: string; // Rich text
  createdAt: Date;
  updatedAt: Date;
}

const CareerSchema = new Schema<ICareer>(
  {
    userId: { type: String, required: true, unique: true },
    currentRole: { type: String },
    targetRole: { type: String },
    skills: [{ type: String }],
    resumeVersions: [
      {
        name: { type: String, required: true },
        cloudinaryUrl: { type: String, required: true },
        cloudinaryPublicId: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: false },
      },
    ],
    certifications: [
      {
        name: { type: String, required: true },
        issuer: { type: String },
        issueDate: { type: Date },
        expiryDate: { type: Date },
        credentialUrl: { type: String },
      },
    ],
    goals: [
      {
        title: { type: String, required: true },
        targetDate: { type: Date },
        achieved: { type: Boolean, default: false },
      },
    ],
    interviewNotes: { type: String },
  },
  { timestamps: true }
);

const Career: Model<ICareer> = mongoose.models.Career || mongoose.model<ICareer>('Career', CareerSchema);
export default Career;
