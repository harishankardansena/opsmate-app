// app/api/leads/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import logger from '@/lib/logger';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    await connectDB();
    const lead = await Lead.findOneAndUpdate({ _id: params.id, userId }, body, { new: true });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    logger.activity('Lead updated', { userId, module: 'leads', data: { id: params.id } });
    return NextResponse.json({ lead });
  } catch (err) {
    logger.error('Failed to update lead', { data: err });
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    await connectDB();
    const lead = await Lead.findOneAndDelete({ _id: params.id, userId });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    logger.activity('Lead deleted', { userId, module: 'leads', data: { id: params.id } });
    return NextResponse.json({ message: 'Lead deleted' });
  } catch (err) {
    logger.error('Failed to delete lead', { data: err });
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
