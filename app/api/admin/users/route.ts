// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import logger from '@/lib/logger';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return null;
  if (user.role !== 'admin') return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  await connectDB();
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const adminUser = session?.user as { id?: string; role?: string } | undefined;
  if (!adminUser?.id || adminUser.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { userId, ...update } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await connectDB();

  // Prevent admin from removing their own admin role
  if (userId === adminUser.id && update.role === 'user') {
    return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  logger.activity('Admin updated user', {
    userId: adminUser.id,
    module: 'admin',
    data: { targetUser: userId, update },
  });

  return NextResponse.json({ user });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const adminUser = session?.user as { id?: string; role?: string } | undefined;
  if (!adminUser?.id || adminUser.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId || userId === adminUser.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndDelete(userId);

  logger.activity('Admin deleted user', { userId: adminUser.id, module: 'admin', data: { deleted: userId } });
  return NextResponse.json({ message: 'User deleted' });
}
