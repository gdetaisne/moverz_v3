import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { z } from 'zod';

export const runtime = "nodejs";

const SaveModificationSchema = z.object({
  photoId: z.string().min(1),
  itemIndex: z.number().int().min(0),
  field: z.enum(['dismountable', 'fragile', 'selected']),
  value: z.any()
});

const LoadModificationsSchema = z.object({
  photoId: z.string().optional(),
  fields: z.array(z.enum(['dismountable', 'fragile', 'selected'])).optional()
});

/**
 * POST /api/user-modifications
 * Sauvegarde une modification utilisateur
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();

    // Validation
    const validated = SaveModificationSchema.parse(body);
    const { photoId, itemIndex, field, value } = validated;

    console.log(`💾 Sauvegarde modification: ${userId} - ${photoId}[${itemIndex}].${field} = ${JSON.stringify(value)}`);

    // Vérifier que la photo existe et appartient à l'utilisateur
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        project: {
          select: { userId: true }
        }
      }
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.project.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Sauvegarder ou mettre à jour la modification
    const modification = await prisma.userModification.upsert({
      where: {
        userId_photoId_itemIndex_field: {
          userId,
          photoId,
          itemIndex,
          field
        }
      },
      update: {
        value: JSON.stringify(value),
        updatedAt: new Date()
      },
      create: {
        userId,
        photoId,
        itemIndex,
        field,
        value: JSON.stringify(value)
      }
    });

    console.log(`✅ Modification sauvegardée: ${modification.id}`);

    return NextResponse.json({ 
      success: true, 
      modification: {
        id: modification.id,
        field,
        value,
        updatedAt: modification.updatedAt
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('❌ Erreur sauvegarde modification:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Failed to save modification" 
    }, { status: 500 });
  }
}

/**
 * GET /api/user-modifications
 * Récupère les modifications utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const url = new URL(req.url);
    
    // Paramètres optionnels
    const photoId = url.searchParams.get('photoId');
    const fields = url.searchParams.get('fields')?.split(',');

    // Validation des paramètres
    const validated = LoadModificationsSchema.parse({
      photoId: photoId || undefined,
      fields: fields || undefined
    });

    console.log(`📥 Chargement modifications: ${userId}${photoId ? ` - ${photoId}` : ''}${fields ? ` - ${fields.join(',')}` : ''}`);

    // Construire les conditions de recherche
    const where: any = { userId };
    
    if (validated.photoId) {
      where.photoId = validated.photoId;
    }
    
    if (validated.fields && validated.fields.length > 0) {
      where.field = { in: validated.fields };
    }

    // Récupérer les modifications
    const modifications = await prisma.userModification.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });

    // Transformer les données pour le frontend
    const result = modifications.map(mod => ({
      id: mod.id,
      photoId: mod.photoId,
      itemIndex: mod.itemIndex,
      field: mod.field,
      value: JSON.parse(mod.value),
      updatedAt: mod.updatedAt
    }));

    console.log(`✅ ${result.length} modifications récupérées`);

    return NextResponse.json({ 
      modifications: result 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('❌ Erreur chargement modifications:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Failed to load modifications" 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/user-modifications
 * Supprime toutes les modifications d'un utilisateur
 */
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    console.log(`🗑️ Suppression modifications: ${userId}`);

    const result = await prisma.userModification.deleteMany({
      where: { userId }
    });

    console.log(`✅ ${result.count} modifications supprimées`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('❌ Erreur suppression modifications:', error);
    
    return NextResponse.json({ 
      error: "Failed to delete modifications" 
    }, { status: 500 });
  }
}
