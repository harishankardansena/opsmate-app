// models/Document.ts
import mongoose, { Schema, Document as MongoDoc, Model } from 'mongoose';

export type DocCategory = 'offer_letter' | 'salary_slip' | 'certificate' | 'resume' | 'experience_letter' | 'id_proof' | 'other';

export interface IDocument extends MongoDoc {
  _id: string;
  userId: string;
  name: string;
  category: DocCategory;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileType: string;
  fileSize: number;
  extractedText?: string; // For AI Q&A
  tags?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['offer_letter', 'salary_slip', 'certificate', 'resume', 'experience_letter', 'id_proof', 'other'],
      default: 'other',
    },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    extractedText: { type: String },
    tags: [{ type: String }],
    description: { type: String },
  },
  { timestamps: true }
);

const Document: Model<IDocument> = mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
export default Document;
