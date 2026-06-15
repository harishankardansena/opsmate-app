// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import logger from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    await connectDB();

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ leads });
  } catch (err) {
    logger.error('Failed to fetch leads', { data: err });
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    await connectDB();
    const lead = await Lead.create({ ...body, userId });

    logger.activity('Lead created', { userId, module: 'leads', data: { name: lead.name } });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    logger.error('Failed to create lead', { data: err });
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
