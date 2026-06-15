// models/ChatMessage.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatMessage extends Document {
  _id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  aiStatus?: 'gemini' | 'groq' | 'offline';
  keyIndex?: number;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    aiStatus: { type: String, enum: ['gemini', 'groq', 'offline'] },
    keyIndex: { type: Number },
  },
  { timestamps: true }
);

const ChatMessage: Model<IChatMessage> = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessage;
