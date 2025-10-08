import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { z } from 'zod';

export const runtime = "nodejs";

const MigrateUserSchema = z.object({
  email: z.string().email('Email invalide'),
  temporaryUserId: z.string().optional()
});

const GetUserByEmailSchema = z.object({
  email: z.string().email('Email invalide')
});

/**
 * POST /api/user/migrate
 * Migre un utilisateur temporaire vers un utilisateur permanent
 */
export async function POST(req: NextRequest) {
  try {
    const currentUserId = await getUserId(req);
    const body = await req.json();

    // Validation
    const validated = MigrateUserSchema.parse(body);
    const { email, temporaryUserId } = validated;

    console.log(`🔄 Migration utilisateur: ${currentUserId} → ${email}`);

    // Vérifier si un utilisateur avec cet email existe déjà
    let permanentUser = await prisma.user.findUnique({
      where: { email },
      include: {
        projects: {
          include: {
            photos: true
          }
        },
        modifications: true
      }
    });

    if (permanentUser) {
      // L'utilisateur existe déjà - fusionner les données
      console.log(`👤 Utilisateur existant trouvé: ${permanentUser.id}`);
      
      // Récupérer les données de l'utilisateur temporaire
      const temporaryUserData = await prisma.user.findUnique({
        where: { id: temporaryUserId || currentUserId },
        include: {
          projects: {
            include: {
              photos: true
            }
          },
          modifications: true
        }
      });

      if (!temporaryUserData) {
        return NextResponse.json({ 
          error: "Utilisateur temporaire non trouvé" 
        }, { status: 404 });
      }

      // Fusionner les projets (éviter les doublons)
      for (const tempProject of temporaryUserData.projects) {
        const existingProject = permanentUser.projects.find(p => p.name === tempProject.name);
        
        if (!existingProject) {
          // Transférer le projet vers l'utilisateur permanent
          await prisma.project.update({
            where: { id: tempProject.id },
            data: { userId: permanentUser.id }
          });
          console.log(`📁 Projet transféré: ${tempProject.name}`);
        } else {
          // Fusionner les photos du projet temporaire vers le projet permanent
          for (const photo of tempProject.photos) {
            await prisma.photo.update({
              where: { id: photo.id },
              data: { projectId: existingProject.id }
            });
          }
          console.log(`📸 ${tempProject.photos.length} photos fusionnées dans le projet existant`);
        }
      }

      // Transférer les modifications
      for (const modification of temporaryUserData.modifications) {
        await prisma.userModification.update({
          where: { id: modification.id },
          data: { userId: permanentUser.id }
        });
      }
      console.log(`🔧 ${temporaryUserData.modifications.length} modifications transférées`);

      // Supprimer l'utilisateur temporaire
      await prisma.user.delete({
        where: { id: temporaryUserId || currentUserId }
      });
      console.log(`🗑️ Utilisateur temporaire supprimé: ${temporaryUserId || currentUserId}`);

      return NextResponse.json({
        success: true,
        permanentUserId: permanentUser.id,
        message: "Données fusionnées avec l'utilisateur existant",
        mergedData: {
          projects: permanentUser.projects.length + temporaryUserData.projects.length,
          modifications: permanentUser.modifications.length + temporaryUserData.modifications.length
        }
      });

    } else {
      // Créer un nouvel utilisateur permanent
      const permanentUser = await prisma.user.create({
        data: {
          email,
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });

      console.log(`👤 Nouvel utilisateur permanent créé: ${permanentUser.id}`);

      // Transférer toutes les données de l'utilisateur temporaire
      const temporaryUserIdToUse = temporaryUserId || currentUserId;
      
      // Transférer les projets
      const projectsTransferred = await prisma.project.updateMany({
        where: { userId: temporaryUserIdToUse },
        data: { userId: permanentUser.id }
      });

      // Transférer les pièces
      const roomsTransferred = await prisma.room.updateMany({
        where: { userId: temporaryUserIdToUse },
        data: { userId: permanentUser.id }
      });

      // Transférer les modifications
      const modificationsTransferred = await prisma.userModification.updateMany({
        where: { userId: temporaryUserIdToUse },
        data: { userId: permanentUser.id }
      });

      // Supprimer l'utilisateur temporaire
      await prisma.user.delete({
        where: { id: temporaryUserIdToUse }
      });

      console.log(`✅ Migration terminée: ${temporaryUserIdToUse} → ${permanentUser.id}`);

      return NextResponse.json({
        success: true,
        permanentUserId: permanentUser.id,
        message: "Utilisateur permanent créé avec toutes les données",
        transferredData: {
          projects: projectsTransferred.count,
          rooms: roomsTransferred.count,
          modifications: modificationsTransferred.count
        }
      });
    }

  } catch (error: unknown) {
    console.error('❌ Erreur migration utilisateur:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Failed to migrate user" 
    }, { status: 500 });
  }
}

/**
 * GET /api/user/migrate?email=xxx
 * Récupère un utilisateur par email
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ 
        error: "Email parameter required" 
      }, { status: 400 });
    }

    // Validation
    const validated = GetUserByEmailSchema.parse({ email });

    console.log(`🔍 Recherche utilisateur par email: ${email}`);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: {
        projects: {
          include: {
            _count: {
              select: { photos: true }
            }
          }
        },
        _count: {
          select: { 
            projects: true, 
            modifications: true 
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        stats: {
          projects: user._count.projects,
          modifications: user._count.modifications,
          totalPhotos: user.projects.reduce((sum, p) => sum + p._count.photos, 0)
        }
      }
    });

  } catch (error: unknown) {
    console.error('❌ Erreur recherche utilisateur:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Failed to find user" 
    }, { status: 500 });
  }
}
