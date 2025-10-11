#!/usr/bin/env node

/**
 * Script pour afficher les détails d'un utilisateur
 * Usage: node scripts/show-user-details.js [userId]
 * Si aucun userId, affiche tous les utilisateurs avec détails
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showUserDetails(targetUserId) {
  try {
    let users;
    
    if (targetUserId) {
      // Chercher un utilisateur spécifique
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          projects: {
            include: {
              photos: true,
              batches: true
            }
          },
          rooms: true,
          modifications: true
        }
      });
      
      if (!user) {
        console.log(`❌ Utilisateur ${targetUserId} non trouvé`);
        return;
      }
      
      users = [user];
    } else {
      // Récupérer tous les utilisateurs
      users = await prisma.user.findMany({
        include: {
          projects: {
            include: {
              photos: true,
              batches: true
            }
          },
          rooms: true,
          modifications: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    console.log('\n👥 DÉTAILS UTILISATEURS\n');
    console.log('='.repeat(80) + '\n');

    for (const user of users) {
      console.log(`📌 Utilisateur: ${user.id}`);
      console.log(`   Email: ${user.email || '(non défini)'}`);
      console.log(`   Créé le: ${user.createdAt.toLocaleString('fr-FR')}`);
      console.log(`   Mis à jour: ${user.updatedAt.toLocaleString('fr-FR')}`);
      console.log('');

      // Projets
      if (user.projects.length > 0) {
        console.log(`   📁 PROJETS (${user.projects.length}):`);
        user.projects.forEach((project, i) => {
          console.log(`   ${i + 1}. ${project.name} (${project.id.substring(0, 8)}...)`);
          console.log(`      Étape actuelle: ${project.currentStep}`);
          console.log(`      Photos: ${project.photos.length} | Batches: ${project.batches.length}`);
          
          if (project.customerName) {
            console.log(`      Client: ${project.customerName}`);
            console.log(`      Email: ${project.customerEmail || 'N/A'}`);
            console.log(`      Téléphone: ${project.customerPhone || 'N/A'}`);
          }
          
          // Photos du projet
          if (project.photos.length > 0) {
            console.log(`      📸 Photos:`);
            project.photos.slice(0, 3).forEach(photo => {
              console.log(`         - ${photo.filename} (${photo.status})`);
              if (photo.roomType) console.log(`           Room: ${photo.roomType}`);
            });
            if (project.photos.length > 3) {
              console.log(`         ... et ${project.photos.length - 3} autres`);
            }
          }
          
          // Batches du projet
          if (project.batches.length > 0) {
            console.log(`      📦 Batches:`);
            project.batches.forEach(batch => {
              console.log(`         - ${batch.id.substring(0, 8)}... (${batch.status})`);
              console.log(`           Complétés: ${batch.countsCompleted} | Échoués: ${batch.countsFailed}`);
            });
          }
          
          console.log('');
        });
      } else {
        console.log(`   📁 Aucun projet\n`);
      }

      // Rooms
      if (user.rooms.length > 0) {
        console.log(`   🏠 PIÈCES (${user.rooms.length}):`);
        user.rooms.forEach((room, i) => {
          console.log(`   ${i + 1}. ${room.name} (${room.roomType})`);
          console.log(`      ID: ${room.id.substring(0, 8)}...`);
          console.log(`      Créée: ${room.createdAt.toLocaleDateString('fr-FR')}`);
        });
        console.log('');
      } else {
        console.log(`   🏠 Aucune pièce\n`);
      }

      // Modifications utilisateur
      if (user.modifications.length > 0) {
        console.log(`   ✏️ MODIFICATIONS (${user.modifications.length}):`);
        user.modifications.slice(0, 5).forEach(mod => {
          console.log(`      - Photo ${mod.photoId.substring(0, 8)}... | Item ${mod.itemIndex}`);
          console.log(`        ${mod.field}: ${mod.value}`);
        });
        if (user.modifications.length > 5) {
          console.log(`      ... et ${user.modifications.length - 5} autres`);
        }
        console.log('');
      }

      console.log('='.repeat(80) + '\n');
    }

    // Résumé global
    console.log('📊 RÉSUMÉ GLOBAL:');
    console.log(`   Total utilisateurs: ${users.length}`);
    console.log(`   Total projets: ${users.reduce((sum, u) => sum + u.projects.length, 0)}`);
    console.log(`   Total photos: ${users.reduce((sum, u) => sum + u.projects.reduce((s, p) => s + p.photos.length, 0), 0)}`);
    console.log(`   Total rooms: ${users.reduce((sum, u) => sum + u.rooms.length, 0)}`);
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse arguments
const userId = process.argv[2];

if (userId && userId !== 'all') {
  console.log(`\n🔍 Recherche de l'utilisateur: ${userId}\n`);
  showUserDetails(userId);
} else {
  console.log('\n🔍 Affichage de tous les utilisateurs\n');
  showUserDetails(null);
}

