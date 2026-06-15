// app/api/performance/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Performance from '@/models/Performance';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly

    await connectDB();

    const now = new Date();
    let startDate = new Date();

    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (period === 'weekly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }

    const records = await Performance.find({
      userId,
      date: { $gte: startDate, $lte: now },
    }).sort({ date: 1 });

    return NextResponse.json({ records });
  } catch (err) {
    logger.error('Failed to fetch performance', { data: err });
    return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    await connectDB();

    // Upsert — one record per day
    const date = new Date(body.date || Date.now());
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const record = await Performance.findOneAndUpdate(
      { userId, date: dayStart },
      { ...body, userId, date: dayStart },
      { upsert: true, new: true }
    );

    logger.activity('Performance logged', { userId, module: 'performance', data: body });
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    logger.error('Failed to log performance', { data: err });
    return NextResponse.json({ error: 'Failed to log performance' }, { status: 500 });
  }
}
