import { randomUUID } from "crypto";
import { File } from "node:buffer";
import { optimizeImageForAI } from "@/lib/imageOptimization";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import fs from 'fs/promises';
import path from 'path';

// Configuration
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
const UPLOADS_URL = process.env.UPLOADS_URL || '/api/uploads';

/**
 * Sauvegarde une photo sur le disque (VPS local)
 */
export async function savePhotoToFile(file: any, photoId?: string) {
  const id = photoId || randomUUID();
  
  // Normaliser l'objet file
  let normalizedFile: File;
  
  if (file instanceof File) {
    normalizedFile = file;
  } else {
    const name = file.name || 'image.jpg';
    const type = file.type || 'image/jpeg';
    normalizedFile = new File([file], name, { type });
  }
  
  const ext = (normalizedFile.name.split(".").pop() || "jpg").toLowerCase();
  
  // Convertir en Buffer
  const arrayBuffer = await normalizedFile.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);
  
  // Optimiser l'image pour l'IA
  const optimized = await optimizeImageForAI(originalBuffer);
  
  // Créer le dossier si nécessaire
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  
  // Nom du fichier
  const filename = `${id}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  
  // Sauvegarder sur disque
  await fs.writeFile(filePath, optimized.buffer);
  
  // URL publique
  const url = `${UPLOADS_URL}/${filename}`;
  
  logger.debug(`💾 Photo sauvegardée: ${filePath} (${optimized.buffer.length} bytes)`);
  
  return {
    id,
    filename,
    filePath: filePath,  // Chemin absolu disque pour référence
    url,  // URL publique (/api/uploads/xxx.jpg)
    size: optimized.buffer.length,
    originalSize: originalBuffer.length
  };
}

// Stockage Base64 optimisé - compatible local + production (LEGACY)
export async function saveAsBase64(file: any){
  const id = randomUUID();
  
  // Normaliser l'objet file pour compatibilité local/production
  let normalizedFile: File;
  
  if (file instanceof File) {
    // Cas navigateur (local)
    normalizedFile = file;
  } else {
    // Cas FormData (production CapRover)
    const name = file.name || 'image.jpg';
    const type = file.type || 'image/jpeg';
    normalizedFile = new File([file], name, { type });
  }
  
  const ext = (normalizedFile.name.split(".").pop() || "jpg").toLowerCase();
  
  // Convertir en Buffer
  const arrayBuffer = await normalizedFile.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);
  
  // Optimiser l'image pour l'IA (réduction de taille significative)
  const optimized = await optimizeImageForAI(originalBuffer);
  
  // Convertir en Base64 optimisé
  const base64 = optimized.buffer.toString('base64');
  
  // Déterminer le MIME type
  let mimeType = "image/jpeg";
  if (ext === "png") mimeType = "image/png";
  if (ext === "webp") mimeType = "image/webp";
  
  // Créer l'URL data optimisée
  const dataUrl = `data:${mimeType};base64,${base64}`;
  
  logger.debug(`Image optimized: ${originalBuffer.length}→${optimized.buffer.length} bytes (${Math.round((1 - optimized.buffer.length/originalBuffer.length) * 100)}% reduction)`);
  
  return { 
    id, 
    base64, 
    dataUrl,
    mimeType,
    size: optimized.buffer.length,
    originalSize: originalBuffer.length,
    optimizedSize: optimized.buffer.length
  };
}

/**
 * Sauvegarde une photo dans la DB (crée un projet par défaut si nécessaire)
 */
export async function savePhotoToDatabase(params: {
  userId: string;
  photoId: string;
  filename: string;
  filePath: string;  // Chemin relatif (/uploads/xxx.jpg)
  url: string;       // URL publique
  roomType?: string;
  analysis?: any;
}): Promise<{ photoId: string; projectId: string }> {
  const { userId, photoId, filename, filePath, url, roomType, analysis } = params;

  // 1. S'assurer que l'utilisateur existe
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId }
  });

  // 2. Récupérer ou créer un projet par défaut pour cet utilisateur
  let project = await prisma.project.findFirst({
    where: { 
      userId: userId,
      name: "Projet Moverz"
    },
    select: { id: true }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        userId: userId,
        name: "Projet Moverz",
        currentStep: 1
      },
      select: { id: true }
    });
  }

  // 3. Créer ou mettre à jour la photo en DB
  const photo = await prisma.photo.upsert({
    where: { id: photoId },
    update: {
      filename: filename,
      filePath: filePath,  // Chemin fichier
      url: url,            // URL publique
      roomType: roomType,
      analysis: analysis
    },
    create: {
      id: photoId,
      projectId: project.id,
      filename: filename,
      filePath: filePath,  // Chemin fichier
      url: url,            // URL publique
      roomType: roomType,
      analysis: analysis
    }
  });

  logger.debug(`📸 Photo DB: ${photo.id} → ${photo.url} (${project.id})`);

  // 4. Créer ou mettre à jour l'entité Room si roomType est défini
  if (roomType) {
    await prisma.room.upsert({
      where: {
        userId_roomType: {
          userId: userId,
          roomType: roomType
        }
      },
      update: {
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        roomType: roomType,
        name: getRoomDisplayName(roomType)
      }
    });
    logger.debug(`🏠 Room DB: ${roomType} créé/mis à jour pour ${userId}`);
  }

  return { photoId: photo.id, projectId: project.id };
}

/**
 * Convertit un roomType technique en nom d'affichage
 */
function getRoomDisplayName(roomType: string): string {
  const roomNames: Record<string, string> = {
    'salon': 'Salon',
    'cuisine': 'Cuisine',
    'chambre': 'Chambre',
    'bureau': 'Bureau',
    'salle_de_bain': 'Salle de bain',
    'garage': 'Garage',
    'cave': 'Cave',
    'grenier': 'Grenier',
    'balcon': 'Balcon',
    'terrasse': 'Terrasse',
    'jardin': 'Jardin',
    'unknown': 'Pièce non identifiée'
  };
  
  return roomNames[roomType] || roomType.charAt(0).toUpperCase() + roomType.slice(1);
}
