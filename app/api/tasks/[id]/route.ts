// app/api/tasks/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import logger from '@/lib/logger';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    await connectDB();
    const task = await Task.findOneAndUpdate(
      { _id: params.id, userId },
      { ...body, ...(body.status === 'completed' ? { completedAt: new Date() } : {}) },
      { new: true }
    );

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    logger.activity('Task updated', { userId, module: 'tasks', data: { id: params.id, ...body } });
    return NextResponse.json({ task });
  } catch (err) {
    logger.error('Failed to update task', { data: err });
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;

    await connectDB();
    const task = await Task.findOneAndDelete({ _id: params.id, userId });
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    logger.activity('Task deleted', { userId, module: 'tasks', data: { id: params.id } });
    return NextResponse.json({ message: 'Task deleted' });
  } catch (err) {
    logger.error('Failed to delete task', { data: err });
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
