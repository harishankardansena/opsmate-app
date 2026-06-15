// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import logger from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { name, email, password, department, designation, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // First user ever gets admin role
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      department,
      designation,
      phone,
      role,
    });

    logger.activity('New user registered', {
      userId: user._id.toString(),
      module: 'auth',
      data: { email: user.email, role },
    });

    return NextResponse.json(
      { message: 'Account created successfully', userId: user._id.toString(), role },
      { status: 201 }
    );
  } catch (err) {
    logger.error('Registration error', { data: err });
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
