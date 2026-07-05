import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, role, confirmReturning } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { name },
    });

    if (user && !confirmReturning) {
      // User exists, but they haven't explicitly said they are returning.
      return NextResponse.json({ exists: true, user });
    }

    if (!user) {
      user = await prisma.user.create({
        data: { name, role: role || 'PARTICIPANT' },
      });
    }

    return NextResponse.json({ exists: false, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to authenticate user', details: String(error) }, { status: 500 });
  }
}
