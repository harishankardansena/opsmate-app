// app/api/followups/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const overdue = searchParams.get('overdue');
    await connectDB();
    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;
    if (overdue === 'true') {
      query.scheduledAt = { $lt: new Date() };
      query.status = 'pending';
    }
    const followups = await FollowUp.find(query).sort({ scheduledAt: 1 });
    return NextResponse.json({ followups });
  } catch (err) {
    logger.error('Failed to fetch followups', { data: err });
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    await connectDB();
    const followup = await FollowUp.create({ ...body, userId });
    logger.activity('Follow-up created', { userId, module: 'followups', data: { contact: followup.contactName } });
    return NextResponse.json({ followup }, { status: 201 });
  } catch (err) {
    logger.error('Failed to create followup', { data: err });
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
  }
}
