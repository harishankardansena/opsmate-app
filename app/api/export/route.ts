export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Note from '@/models/Note';
import Lead from '@/models/Lead';
import FollowUp from '@/models/FollowUp';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch data concurrently
    const [tasks, notes, leads, followUps] = await Promise.all([
      Task.find({ userId }).sort({ createdAt: -1 }).lean(),
      Note.find({ userId }).sort({ createdAt: -1 }).lean(),
      Lead.find({ userId }).sort({ createdAt: -1 }).lean(),
      FollowUp.find({ userId }).sort({ createdAt: -1 }).lean()
    ]);

    logger.activity('User exported full workspace data', { userId, module: 'export' });

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        notes,
        leads,
        followUps
      }
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export workspace data' }, { status: 500 });
  }
}
