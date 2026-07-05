import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch activities', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, points } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        points: points ? parseInt(points, 10) : 10,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create activity', details: String(error) }, { status: 500 });
  }
}
