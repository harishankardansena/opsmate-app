// app/api/followups/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import logger from '@/lib/logger';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    await connectDB();
    const followup = await FollowUp.findOneAndUpdate(
      { _id: params.id, userId },
      { ...body, ...(body.status === 'done' ? { completedAt: new Date() } : {}) },
      { new: true }
    );
    if (!followup) return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    logger.activity('Follow-up updated', { userId, module: 'followups', data: { id: params.id } });
    return NextResponse.json({ followup });
  } catch (err) {
    logger.error('Failed to update followup', { data: err });
    return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    await connectDB();
    const followup = await FollowUp.findOneAndDelete({ _id: params.id, userId });
    if (!followup) return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    logger.activity('Follow-up deleted', { userId, module: 'followups', data: { id: params.id } });
    return NextResponse.json({ message: 'Follow-up deleted' });
  } catch (err) {
    logger.error('Failed to delete followup', { data: err });
    return NextResponse.json({ error: 'Failed to delete follow-up' }, { status: 500 });
  }
}
