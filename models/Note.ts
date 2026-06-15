// models/Note.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export type NoteType = 'meeting' | 'daily_log' | 'discussion' | 'personal' | 'general';

export interface INote extends Document {
  _id: string;
  userId: string;
  title: string;
  content: string; // Rich text HTML from TipTap
  type: NoteType;
  tags?: string[];
  aiSummary?: string;
  actionItems?: string[];
  isStarred?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['meeting', 'daily_log', 'discussion', 'personal', 'general'], default: 'general' },
    tags: [{ type: String }],
    aiSummary: { type: String },
    actionItems: [{ type: String }],
    isStarred: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index for search
NoteSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
export default Note;
