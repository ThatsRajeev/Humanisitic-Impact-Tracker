import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const progresses = await prisma.progress.findMany({
      include: {
        user: true,
        activity: true,
        attestations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(progresses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { text, userId, activityId } = await req.json();

    if (!text || !userId || !activityId) {
      return NextResponse.json({ error: 'Text, user, and activity are required' }, { status: 400 });
    }

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const progress = await prisma.$transaction(async (tx) => {
      const newProgress = await tx.progress.create({
        data: { text, userId, activityId },
      });

      await tx.user.update({
        where: { id: userId },
        data: { score: { increment: activity.points } },
      });

      return newProgress;
    });

    return NextResponse.json(progress);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit progress' }, { status: 500 });
  }
}
