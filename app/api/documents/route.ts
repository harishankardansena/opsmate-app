import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import logger from '@/lib/logger';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    await connectDB();
    const query: any = { userId };
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    const documents = await Document.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ documents });
  } catch (err) {
    logger.error('Failed to fetch documents', { data: err });
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as { id: string }).id;
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;

    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // Save locally for MVP
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true }).catch(() => {});
    await writeFile(path.join(uploadDir, fileName), buffer);

    await connectDB();
    const doc = await Document.create({
      userId,
      name: file.name,
      category: (category as any) || 'other',
      cloudinaryUrl: `/uploads/${fileName}`, // Using local path for MVP
      cloudinaryPublicId: fileName,
      fileType: file.type,
      fileSize: file.size,
      description
    });

    logger.activity('Document uploaded', { userId, module: 'documents', data: { name: file.name } });
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    logger.error('Failed to upload document', { data: err });
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
