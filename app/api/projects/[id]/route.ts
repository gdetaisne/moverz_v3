import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { z } from 'zod';

const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional()
});

/**
 * GET /api/projects/[id]
 * Récupère un projet avec toutes ses photos
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId // Sécurité: seul le propriétaire peut voir
      },
      include: {
        photos: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[GET /api/projects/${id}] Error:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Met à jour un projet
 * Body: { name?: string }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    const { id } = await params;
    const body = await req.json();

    const validated = UpdateProjectSchema.parse(body);

    // Vérifier que le projet appartient à l'utilisateur
    const existing = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data: validated,
      include: {
        _count: {
          select: { photos: true }
        }
      }
    });

    return NextResponse.json({ project });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[PUT /api/projects/${id}] Error:`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Supprime un projet et toutes ses photos
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(req);
    const { id } = await params;

    // Vérifier que le projet appartient à l'utilisateur
    const existing = await prisma.project.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[DELETE /api/projects/${id}] Error:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}


