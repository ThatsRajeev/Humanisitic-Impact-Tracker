import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, role } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { name },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { name, role: role || 'PARTICIPANT' },
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to authenticate user', details: String(error) }, { status: 500 });
  }
}
