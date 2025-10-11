#!/usr/bin/env node

/**
 * Script pour afficher les statistiques de la base de données
 * Usage: node scripts/show-db-stats.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showStats() {
  console.log('\n📊 Statistiques de la Base de Données\n');
  console.log('=====================================\n');

  try {
    // 1. Utilisateurs
    const usersCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            rooms: true,
          }
        }
      }
    });

    console.log('👥 UTILISATEURS');
    console.log(`   Total: ${usersCount}`);
    if (users.length > 0) {
      console.log('\n   Derniers utilisateurs:');
      users.forEach(u => {
        console.log(`   - ${u.id.substring(0, 8)}... (${u.email || 'sans email'})`);
        console.log(`     Créé: ${u.createdAt.toLocaleDateString('fr-FR')}`);
        console.log(`     Projets: ${u._count.projects} | Rooms: ${u._count.rooms}`);
      });
    }
    console.log('');

    // 2. Photos
    const photosCount = await prisma.photo.count();
    const photosByStatus = await prisma.photo.groupBy({
      by: ['status'],
      _count: true
    });
    const recentPhotos = await prisma.photo.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        roomType: true,
        status: true,
        createdAt: true,
        project: {
          select: {
            name: true,
            userId: true
          }
        }
      }
    });

    console.log('📸 PHOTOS');
    console.log(`   Total: ${photosCount}`);
    console.log('   Par statut:');
    photosByStatus.forEach(({ status, _count }) => {
      console.log(`     ${status}: ${_count}`);
    });
    
    if (recentPhotos.length > 0) {
      console.log('\n   Dernières photos:');
      recentPhotos.forEach(p => {
        console.log(`   - ${p.filename}`);
        console.log(`     Room: ${p.roomType || 'N/A'} | Status: ${p.status}`);
        console.log(`     Projet: ${p.project.name} | User: ${p.project.userId.substring(0, 8)}...`);
        console.log(`     Date: ${p.createdAt.toLocaleDateString('fr-FR')} ${p.createdAt.toLocaleTimeString('fr-FR')}`);
      });
    }
    console.log('');

    // 3. Projets
    const projectsCount = await prisma.project.count();
    const projects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        userId: true,
        currentStep: true,
        createdAt: true,
        _count: {
          select: {
            photos: true,
            batches: true
          }
        }
      }
    });

    console.log('📁 PROJETS');
    console.log(`   Total: ${projectsCount}`);
    if (projects.length > 0) {
      console.log('\n   Derniers projets:');
      projects.forEach(p => {
        console.log(`   - ${p.name} (${p.id.substring(0, 8)}...)`);
        console.log(`     User: ${p.userId.substring(0, 8)}... | Étape: ${p.currentStep}`);
        console.log(`     Photos: ${p._count.photos} | Batches: ${p._count.batches}`);
        console.log(`     Créé: ${p.createdAt.toLocaleDateString('fr-FR')}`);
      });
    }
    console.log('');

    // 4. Rooms
    const roomsCount = await prisma.room.count();
    const roomsByType = await prisma.room.groupBy({
      by: ['roomType'],
      _count: true
    });

    console.log('🏠 PIÈCES (ROOMS)');
    console.log(`   Total: ${roomsCount}`);
    if (roomsByType.length > 0) {
      console.log('   Par type:');
      roomsByType.forEach(({ roomType, _count }) => {
        console.log(`     ${roomType}: ${_count}`);
      });
    }
    console.log('');

    // 5. Batches
    const batchesCount = await prisma.batch.count();
    const batchesByStatus = await prisma.batch.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('📦 BATCHES');
    console.log(`   Total: ${batchesCount}`);
    if (batchesByStatus.length > 0) {
      console.log('   Par statut:');
      batchesByStatus.forEach(({ status, _count }) => {
        console.log(`     ${status}: ${_count}`);
      });
    }
    console.log('');

    // 6. Assets (S3)
    const assetsCount = await prisma.asset.count();
    const assetsByStatus = await prisma.asset.groupBy({
      by: ['status'],
      _count: true
    });
    const totalSize = await prisma.asset.aggregate({
      _sum: {
        sizeBytes: true
      }
    });

    console.log('📎 ASSETS (S3)');
    console.log(`   Total: ${assetsCount}`);
    if (totalSize._sum.sizeBytes) {
      const sizeMB = (totalSize._sum.sizeBytes / 1024 / 1024).toFixed(2);
      console.log(`   Taille totale: ${sizeMB} MB`);
    }
    if (assetsByStatus.length > 0) {
      console.log('   Par statut:');
      assetsByStatus.forEach(({ status, _count }) => {
        console.log(`     ${status}: ${_count}`);
      });
    }
    console.log('');

    // 7. Métriques IA
    const metricsCount = await prisma.aiMetric.count();
    if (metricsCount > 0) {
      const successRate = await prisma.aiMetric.aggregate({
        where: { success: true },
        _count: true
      });
      const avgLatency = await prisma.aiMetric.aggregate({
        _avg: {
          latencyMs: true
        }
      });
      const metricsByProvider = await prisma.aiMetric.groupBy({
        by: ['provider'],
        _count: true
      });

      console.log('🤖 MÉTRIQUES IA');
      console.log(`   Total appels: ${metricsCount}`);
      console.log(`   Success rate: ${((successRate._count / metricsCount) * 100).toFixed(1)}%`);
      console.log(`   Latence moyenne: ${avgLatency._avg.latencyMs?.toFixed(0) || 'N/A'} ms`);
      if (metricsByProvider.length > 0) {
        console.log('   Par provider:');
        metricsByProvider.forEach(({ provider, _count }) => {
          console.log(`     ${provider}: ${_count}`);
        });
      }
      console.log('');
    }

    // 8. Statistiques générales
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const photosToday = await prisma.photo.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    const usersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    console.log('📅 AUJOURD\'HUI');
    console.log(`   Nouveaux utilisateurs: ${usersToday}`);
    console.log(`   Nouvelles photos: ${photosToday}`);
    console.log('');

    console.log('=====================================');
    console.log('✅ Statistiques affichées avec succès\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

showStats();

