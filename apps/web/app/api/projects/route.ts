import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';
import { getUserId } from '@core/auth';
import { z } from 'zod';

// Schéma validation pour créer un projet
const CreateProjectSchema = z.object({
  name: z.string().min(1, "Le nom du projet est requis")
});

/**
 * GET /api/projects
 * Liste tous les projets de l'utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        photos: {
          select: {
            id: true,
            url: true,
            roomType: true,
            createdAt: true
          }
        },
        _count: {
          select: { photos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ projects });
  } catch (error: unknown) {
    console.error('[GET /api/projects] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Crée un nouveau projet
 * Body: { name: string }
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();

    // Validation avec Zod
    const validated = CreateProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: validated.name,
        userId
      },
      include: {
        _count: {
          select: { photos: true }
        }
      }
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: unknown) {
    console.error('[POST /api/projects] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: (error as Error).message || 'Internal error' },
      { status: 500 }
    );
  }
}


