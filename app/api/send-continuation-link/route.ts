import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { sendEmail, generateContinuationToken, generateContinuationEmailHtml } from '@/lib/email';
import { z } from 'zod';

export const runtime = "nodejs";

const SendContinuationLinkSchema = z.object({
  email: z.string().email('Email invalide'),
  projectId: z.string().optional(), // Optionnel pour créer auto si besoin
});

/**
 * POST /api/send-continuation-link
 * Envoie un email avec un lien de continuation sécurisé
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();

    // Validation
    const validated = SendContinuationLinkSchema.parse(body);
    const { email, projectId } = validated;

    // Récupérer ou créer un projet pour cet utilisateur
    let project = await prisma.project.findFirst({
      where: {
        userId: userId,
        name: "Projet Moverz"
      },
      include: {
        _count: {
          select: { photos: true }
        }
      }
    });

    // Créer un projet par défaut si aucun n'existe
    if (!project) {
      project = await prisma.project.create({
        data: {
          userId: userId,
          name: "Projet Moverz",
          currentStep: 1
        },
        include: {
          _count: {
            select: { photos: true }
          }
        }
      });
    }

    // Générer un token sécurisé
    const token = generateContinuationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expire dans 30 jours

    // Sauvegarder l'email en DB
    await prisma.project.update({
      where: { id: project.id },
      data: {
        customerEmail: email
      }
    });

    // Générer l'URL de continuation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL || 
                    `http://localhost:${process.env.PORT || 3001}`;
    
    const continuationUrl = `${baseUrl}?userId=${userId}&projectId=${projectId}&token=${token}`;

    // Générer le HTML de l'email
    const emailHtml = generateContinuationEmailHtml({
      continuationUrl,
      projectId: project.id,
      photosCount: project._count.photos
    });

    // Envoyer l'email
    const emailSent = await sendEmail({
      to: email,
      subject: '📦 Continuez votre devis Moverz',
      html: emailHtml
    });

    if (!emailSent && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    console.log(`✅ Lien de continuation envoyé à ${email} (projet ${projectId})`);

    return NextResponse.json({
      success: true,
      message: process.env.NODE_ENV === 'development' 
        ? `Email envoyé (dev mode) - Lien: ${continuationUrl}`
        : 'Email envoyé avec succès ! Vérifiez votre boîte de réception.',
      // En dev, on retourne l'URL pour faciliter les tests
      ...(process.env.NODE_ENV === 'development' && { 
        debugUrl: continuationUrl,
        debugToken: token 
      })
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation échouée', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Erreur send-continuation-link:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

