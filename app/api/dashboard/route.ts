// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Lead from '@/models/Lead';
import FollowUp from '@/models/FollowUp';
import Performance from '@/models/Performance';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    await connectDB();

    const today = new Date();
    const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
      tasksDueToday,
      pendingTasks,
      inProgressTasks,
      totalLeads,
      convertedLeads,
      overdueFollowups,
      todayFollowups,
      todayPerformance,
      weekPerformance,
    ] = await Promise.all([
      Task.countDocuments({ userId, dueDate: { $gte: dayStart, $lt: dayEnd }, status: { $ne: 'completed' } }),
      Task.countDocuments({ userId, status: 'pending' }),
      Task.countDocuments({ userId, status: 'in_progress' }),
      Lead.countDocuments({ userId }),
      Lead.countDocuments({ userId, status: 'converted' }),
      FollowUp.countDocuments({ userId, status: 'pending', scheduledAt: { $lt: today } }),
      FollowUp.countDocuments({ userId, scheduledAt: { $gte: dayStart, $lt: dayEnd } }),
      Performance.findOne({ userId, date: dayStart }),
      Performance.find({ userId, date: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) } }).sort({ date: 1 }),
    ]);

    const recentTasks = await Task.find({ userId, status: { $ne: 'completed' } })
      .sort({ dueDate: 1 })
      .limit(5);

    const upcomingFollowups = await FollowUp.find({
      userId,
      status: 'pending',
      scheduledAt: { $gte: today },
    })
      .sort({ scheduledAt: 1 })
      .limit(5);

    return NextResponse.json({
      stats: {
        tasksDueToday,
        pendingTasks,
        inProgressTasks,
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
        overdueFollowups,
        todayFollowups,
        callsToday: todayPerformance?.calls ?? 0,
        meetingsToday: todayPerformance?.meetings ?? 0,
        salesToday: todayPerformance?.sales ?? 0,
      },
      recentTasks,
      upcomingFollowups,
      weekPerformance,
    });
  } catch (err) {
    logger.error('Dashboard fetch error', { data: err });
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
