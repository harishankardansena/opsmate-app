// app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Note from '@/models/Note';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const starred = searchParams.get('starred');
    await connectDB();
    const query: Record<string, unknown> = { userId };
    if (type) query.type = type;
    if (starred === 'true') query.isStarred = true;
    if (search) query.$text = { $search: search };
    const notes = await Note.find(query).sort({ updatedAt: -1 });
    return NextResponse.json({ notes });
  } catch (err) {
    logger.error('Failed to fetch notes', { data: err });
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    await connectDB();
    const note = await Note.create({ ...body, userId });
    logger.activity('Note created', { userId, module: 'notes', data: { title: note.title } });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    logger.error('Failed to create note', { data: err });
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
