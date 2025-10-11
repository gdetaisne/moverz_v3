#!/usr/bin/env node

/**
 * Script pour monitorer la base de données en temps réel
 * Usage: node scripts/watch-db.js [interval_seconds]
 * Par défaut : refresh toutes les 5 secondes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REFRESH_INTERVAL = parseInt(process.argv[2]) || 5;

let lastCount = {
  users: 0,
  photos: 0,
  projects: 0,
  rooms: 0,
  batches: 0,
  assets: 0
};

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function formatDiff(current, last) {
  const diff = current - last;
  if (diff > 0) return `\x1b[32m+${diff}\x1b[0m`; // Vert
  if (diff < 0) return `\x1b[31m${diff}\x1b[0m`;  // Rouge
  return '';
}

async function monitor() {
  try {
    const [
      usersCount,
      photosCount,
      projectsCount,
      roomsCount,
      batchesCount,
      assetsCount,
      photosByStatus,
      batchesByStatus,
      recentPhotos,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.photo.count(),
      prisma.project.count(),
      prisma.room.count(),
      prisma.batch.count(),
      prisma.asset.count(),
      prisma.photo.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.batch.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.photo.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          filename: true,
          status: true,
          roomType: true,
          createdAt: true
        }
      }),
      prisma.user.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true
        }
      })
    ]);

    clearScreen();
    
    const now = new Date().toLocaleTimeString('fr-FR');
    console.log('━'.repeat(80));
    console.log(`🔄 MONITORING BASE DE DONNÉES - ${now}`);
    console.log(`   Rafraîchissement automatique toutes les ${REFRESH_INTERVAL}s (Ctrl+C pour quitter)`);
    console.log('━'.repeat(80));
    console.log('');

    // Compteurs principaux
    console.log('📊 COMPTEURS GLOBAUX\n');
    
    console.log(`   👥 Utilisateurs    : ${usersCount.toString().padEnd(5)} ${formatDiff(usersCount, lastCount.users)}`);
    console.log(`   📸 Photos          : ${photosCount.toString().padEnd(5)} ${formatDiff(photosCount, lastCount.photos)}`);
    console.log(`   📁 Projets         : ${projectsCount.toString().padEnd(5)} ${formatDiff(projectsCount, lastCount.projects)}`);
    console.log(`   🏠 Pièces          : ${roomsCount.toString().padEnd(5)} ${formatDiff(roomsCount, lastCount.rooms)}`);
    console.log(`   📦 Batches         : ${batchesCount.toString().padEnd(5)} ${formatDiff(batchesCount, lastCount.batches)}`);
    console.log(`   📎 Assets S3       : ${assetsCount.toString().padEnd(5)} ${formatDiff(assetsCount, lastCount.assets)}`);
    console.log('');

    // Mettre à jour les compteurs
    lastCount = {
      users: usersCount,
      photos: photosCount,
      projects: projectsCount,
      rooms: roomsCount,
      batches: batchesCount,
      assets: assetsCount
    };

    // Photos par statut
    if (photosByStatus.length > 0) {
      console.log('📸 PHOTOS PAR STATUT\n');
      photosByStatus.forEach(({ status, _count }) => {
        const icon = status === 'DONE' ? '✅' : status === 'ERROR' ? '❌' : status === 'PROCESSING' ? '⏳' : '⏸️';
        console.log(`   ${icon} ${status.padEnd(12)} : ${_count}`);
      });
      console.log('');
    }

    // Batches par statut
    if (batchesByStatus.length > 0) {
      console.log('📦 BATCHES PAR STATUT\n');
      batchesByStatus.forEach(({ status, _count }) => {
        const icon = status === 'COMPLETED' ? '✅' : status === 'FAILED' ? '❌' : status === 'PROCESSING' ? '⏳' : '⏸️';
        console.log(`   ${icon} ${status.padEnd(12)} : ${_count}`);
      });
      console.log('');
    }

    // Dernières photos
    if (recentPhotos.length > 0) {
      console.log('📸 DERNIÈRES PHOTOS\n');
      recentPhotos.forEach((photo, i) => {
        const icon = photo.status === 'DONE' ? '✅' : photo.status === 'ERROR' ? '❌' : '⏳';
        console.log(`   ${i + 1}. ${icon} ${photo.filename}`);
        console.log(`      Room: ${photo.roomType || 'N/A'} | ${photo.createdAt.toLocaleTimeString('fr-FR')}`);
      });
      console.log('');
    }

    // Derniers utilisateurs
    if (recentUsers.length > 0) {
      console.log('👥 DERNIERS UTILISATEURS\n');
      recentUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.id.substring(0, 20)}...`);
        console.log(`      Créé: ${user.createdAt.toLocaleString('fr-FR')}`);
      });
      console.log('');
    }

    console.log('━'.repeat(80));
    console.log(`⏱️  Prochain refresh dans ${REFRESH_INTERVAL}s...`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Première exécution immédiate
monitor();

// Puis exécution périodique
const interval = setInterval(monitor, REFRESH_INTERVAL * 1000);

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n\n👋 Arrêt du monitoring...');
  clearInterval(interval);
  await prisma.$disconnect();
  process.exit(0);
});

