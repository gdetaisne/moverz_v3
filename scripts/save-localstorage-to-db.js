#!/usr/bin/env node

/**
 * Script pour sauvegarder les données localStorage en DB
 * 
 * À exécuter depuis la console navigateur pour récupérer les données,
 * puis depuis Node pour les sauvegarder en DB
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Les données à sauvegarder (à récupérer depuis localStorage)
const DATA_FROM_LOCALSTORAGE = process.argv[2] ? JSON.parse(process.argv[2]) : null;

async function saveToDatabase(data) {
  if (!data) {
    console.log('\n🔴 ERREUR: Pas de données fournies\n');
    console.log('📝 ÉTAPES:');
    console.log('1. Dans le navigateur (F12 → Console), copiez-collez:');
    console.log('');
    console.log('```javascript');
    console.log('const userId = localStorage.getItem(\'current_user_id\');');
    console.log('const data = localStorage.getItem(`inventory_data_${userId}`);');
    console.log('console.log(\'COPY_THIS_START\');');
    console.log('console.log(data);');
    console.log('console.log(\'COPY_THIS_END\');');
    console.log('```');
    console.log('');
    console.log('2. Copiez le JSON entre COPY_THIS_START et COPY_THIS_END');
    console.log('');
    console.log('3. Exécutez:');
    console.log('node scripts/save-localstorage-to-db.js \'<JSON_COPIÉ>\'');
    console.log('');
    return;
  }

  console.log('\n💾 SAUVEGARDE EN DB\n');
  console.log('='.repeat(60));

  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    const userId = parsedData.currentUserId || 'user-from-localStorage';
    const roomGroups = parsedData.roomGroups || [];
    
    console.log(`\n👤 User ID: ${userId}`);
    console.log(`📦 Pièces à sauvegarder: ${roomGroups.length}`);
    
    let totalPhotos = 0;
    roomGroups.forEach(room => {
      totalPhotos += room.photos?.length || 0;
    });
    console.log(`📸 Photos à sauvegarder: ${totalPhotos}\n`);

    // 1. Créer l'utilisateur
    console.log('1️⃣  Création utilisateur...');
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    });
    console.log('   ✅ Utilisateur créé/mis à jour');

    // 2. Créer le projet
    console.log('\n2️⃣  Création projet...');
    const project = await prisma.project.upsert({
      where: {
        userId_name: {
          userId: userId,
          name: 'Projet Moverz'
        }
      },
      update: {
        currentStep: parsedData.currentStep || 5
      },
      create: {
        userId: userId,
        name: 'Projet Moverz',
        currentStep: parsedData.currentStep || 5
      }
    });
    console.log(`   ✅ Projet créé: ${project.id}`);

    // 3. Créer les rooms
    console.log('\n3️⃣  Création des pièces...');
    for (const room of roomGroups) {
      const roomType = room.roomType || room.id?.replace('room-', '');
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
          name: room.name || roomType
        }
      });
      console.log(`   ✅ Pièce: ${roomType}`);
    }

    // 4. Créer les photos
    console.log('\n4️⃣  Création des photos...');
    let savedPhotos = 0;
    
    for (const room of roomGroups) {
      const roomType = room.roomType || room.id?.replace('room-', '');
      
      if (!room.photos || room.photos.length === 0) continue;
      
      for (const photo of room.photos) {
        const photoId = photo.photoId || `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const filename = photo.file?.name || photo.filename || 'photo.jpg';
        
        await prisma.photo.upsert({
          where: { id: photoId },
          update: {
            roomType: roomType,
            analysis: photo.analysis || null,
            status: photo.status === 'completed' ? 'DONE' : 'PENDING'
          },
          create: {
            id: photoId,
            projectId: project.id,
            filename: filename,
            filePath: `/uploads/${filename}`,
            url: photo.fileUrl || `/uploads/${filename}`,
            roomType: roomType,
            analysis: photo.analysis || null,
            status: photo.status === 'completed' ? 'DONE' : 'PENDING'
          }
        });
        
        savedPhotos++;
      }
    }
    
    console.log(`   ✅ ${savedPhotos} photos sauvegardées`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ SAUVEGARDE TERMINÉE !\n');
    console.log('Vérifiez dans Prisma Studio: http://localhost:5555');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Si on fournit le JSON en argument
if (process.argv[2]) {
  saveToDatabase(process.argv[2]);
} else {
  saveToDatabase(null);
}

