// app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    await connectDB();

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ tasks });
  } catch (err) {
    logger.error('Failed to fetch tasks', { data: err });
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    await connectDB();
    const task = await Task.create({ ...body, userId });

    logger.activity('Task created', { userId, module: 'tasks', data: { title: task.title } });
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    logger.error('Failed to create task', { data: err });
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
