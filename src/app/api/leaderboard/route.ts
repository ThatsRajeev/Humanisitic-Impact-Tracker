import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { score: 'desc' },
      select: {
        id: true,
        name: true,
        score: true,
        role: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
