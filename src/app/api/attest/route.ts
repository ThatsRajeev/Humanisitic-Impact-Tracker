import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, progressId } = await req.json();

    if (!userId || !progressId) {
      return NextResponse.json({ error: 'User ID and Progress ID are required' }, { status: 400 });
    }

    const progress = await prisma.progress.findUnique({
      where: { id: progressId },
    });

    if (!progress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 });
    }

    const existingAttestation = await prisma.attestation.findUnique({
      where: {
        userId_progressId: {
          userId,
          progressId,
        },
      },
    });

    if (existingAttestation) {
      return NextResponse.json({ message: 'Already attested' }, { status: 400 });
    }

    const attestation = await prisma.attestation.create({
      data: {
        userId,
        progressId,
      },
    });

    // Award bonus points for getting an attestation (optional, let's say 2 points)
    await prisma.user.update({
      where: { id: progress.userId },
      data: { score: { increment: 2 } },
    });

    return NextResponse.json(attestation);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to attest', details: String(error) }, { status: 500 });
  }
}
