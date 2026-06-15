// app/api/ai/email/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateEmail } from '@/lib/ai';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const params = await req.json();
    const result = await generateEmail(params);
    logger.activity('AI email generated', { userId, module: 'email-assistant', data: { type: params.type, status: result.status } });
    return NextResponse.json({ text: result.text, status: result.status });
  } catch (err) {
    logger.error('AI email generation error', { data: err });
    return NextResponse.json({ error: 'Email generation failed' }, { status: 500 });
  }
}
