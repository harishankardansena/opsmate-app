// app/api/ai/chat/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiChat } from '@/lib/ai';
import connectDB from '@/lib/mongodb';
import ChatMessage from '@/models/ChatMessage';
import logger from '@/lib/logger';

const OPSMATE_SYSTEM_PROMPT = `You are OpsMate AI, a smart work assistant embedded in the OpsMate Work Operating System. 
You help users manage their tasks, leads, follow-ups, notes, documents, performance, and career growth.

Key capabilities:
- Parse natural language commands like "Create task for tomorrow 11 AM", "Show pending follow-ups", "How much incentive am I expected?"
- Provide actionable advice based on user's work context
- Help with meeting summaries, email drafting, resume improvement
- Be concise, professional, and helpful
- When you detect a command (create task, add lead, etc.), respond with the action AND a JSON block like: {"action": "create_task", "data": {...}}

Always be encouraging and productivity-focused.`;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { messages, context } = await req.json();

    const systemWithContext = context
      ? `${OPSMATE_SYSTEM_PROMPT}\n\nUser's current data context:\n${context}`
      : OPSMATE_SYSTEM_PROMPT;

    const result = await aiChat(messages, systemWithContext);

    // Save to DB
    await connectDB();
    const userMsg = messages[messages.length - 1];
    await ChatMessage.create({ userId, role: 'user', content: userMsg.content });
    await ChatMessage.create({
      userId,
      role: 'assistant',
      content: result.text,
      aiStatus: result.status,
      keyIndex: result.keyIndex,
    });

    logger.activity('AI chat', { userId, module: 'ai-chat', data: { status: result.status } });

    return NextResponse.json({
      text: result.text,
      status: result.status,
      keyIndex: result.keyIndex,
    });
  } catch (err) {
    logger.error('AI chat error', { data: err });
    return NextResponse.json({ error: 'AI chat failed' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    await connectDB();
    const messages = await ChatMessage.find({ userId }).sort({ createdAt: 1 }).limit(100);
    return NextResponse.json({ messages });
  } catch (err) {
    logger.error('Failed to fetch chat history', { data: err });
    return NextResponse.json({ error: 'Failed to load chat history' }, { status: 500 });
  }
}
