// app/api/notes/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Note from '@/models/Note';
import logger from '@/lib/logger';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    await connectDB();
    const note = await Note.findOneAndUpdate({ _id: params.id, userId }, body, { new: true });
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    logger.activity('Note updated', { userId, module: 'notes', data: { id: params.id } });
    return NextResponse.json({ note });
  } catch (err) {
    logger.error('Failed to update note', { data: err });
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    await connectDB();
    const note = await Note.findOneAndDelete({ _id: params.id, userId });
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    logger.activity('Note deleted', { userId, module: 'notes', data: { id: params.id } });
    return NextResponse.json({ message: 'Note deleted' });
  } catch (err) {
    logger.error('Failed to delete note', { data: err });
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
