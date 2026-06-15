import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Career from '@/models/Career';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    await connectDB();
    let career = await Career.findOne({ userId });
    if (!career) {
      career = await Career.create({ userId, skills: [], goals: [], certifications: [], resumeVersions: [] });
    }

    return NextResponse.json({ career });
  } catch (err) {
    logger.error('Failed to fetch career info', { data: err });
    return NextResponse.json({ error: 'Failed to fetch career data' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    await connectDB();
    const career = await Career.findOneAndUpdate(
      { userId },
      { $set: body },
      { new: true, upsert: true }
    );

    logger.activity('Career updated', { userId, module: 'career' });
    return NextResponse.json({ career });
  } catch (err) {
    logger.error('Failed to update career info', { data: err });
    return NextResponse.json({ error: 'Failed to update career data' }, { status: 500 });
  }
}
