import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tasks } = await req.json();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty task array' }, { status: 400 });
    }

    await connectDB();

    // Map tasks to ensure userId is correctly assigned
    const tasksToInsert = tasks.map((task: any) => ({
      userId,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      dueDate: task.dueDate || undefined,
      dueTime: task.dueTime || '',
      tags: task.tags || [],
    }));

    const result = await Task.insertMany(tasksToInsert);

    logger.activity('Bulk imported tasks', { userId, module: 'tasks', data: { count: result.length } });

    return NextResponse.json({ success: true, count: result.length, tasks: result }, { status: 201 });
  } catch (error: any) {
    console.error('Bulk insert error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import tasks' }, { status: 500 });
  }
}
