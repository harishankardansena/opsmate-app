import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Note from '@/models/Note';
import Lead from '@/models/Lead';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) return NextResponse.json({ results: [] });

    await connectDB();
    const regex = { $regex: query, $options: 'i' };

    const [tasks, notes, leads] = await Promise.all([
      Task.find({ userId, $or: [{ title: regex }, { description: regex }] }).limit(10),
      Note.find({ userId, $or: [{ title: regex }, { content: regex }] }).limit(10),
      Lead.find({ userId, $or: [{ name: regex }, { company: regex }] }).limit(10),
    ]);

    const results = [
      ...tasks.map(t => ({ id: t._id, type: 'Task', title: t.title, subtitle: t.description || t.status, link: '/tasks' })),
      ...notes.map(n => ({ id: n._id, type: 'Note', title: n.title, subtitle: 'Match found in content', link: '/notes' })),
      ...leads.map(l => ({ id: l._id, type: 'Lead', title: l.name, subtitle: l.company || l.status, link: '/leads' })),
    ];

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
