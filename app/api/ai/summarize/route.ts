// app/api/ai/summarize/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { summarizeText, extractActionItems } from '@/lib/ai';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const { text, mode } = await req.json();
    if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

    let result;
    if (mode === 'action_items') {
      result = await extractActionItems(text);
    } else {
      result = await summarizeText(text);
    }

    logger.activity('AI summarize', { userId, module: 'notes', data: { mode, status: result.status } });
    return NextResponse.json({ text: result.text, status: result.status });
  } catch (err) {
    logger.error('AI summarize error', { data: err });
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 });
  }
}
