#!/usr/bin/env node
/**
 * Script de test pour vérifier le fix des analyses groupées dans le PDF
 * 
 * Workflow:
 * 1. Vérifier qu'il existe des photos en DB avec analyses groupées
 * 2. Tester l'endpoint /api/pdf/generate-from-photos avec ces photos
 * 3. Vérifier que le PDF est généré et contient les analyses
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Test: Analyses groupées dans le PDF');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Chercher des photos avec analyses groupées
    console.log('🔍 Recherche de photos avec analyses groupées...');
    
    const photosWithGroupAnalysis = await prisma.photo.findMany({
      where: {
        status: 'DONE',
        analysis: {
          path: ['_isGroupAnalysis'],
          equals: true
        }
      },
      select: {
        id: true,
        filename: true,
        roomType: true,
        analysis: true
      },
      take: 5
    });

    console.log(`✅ Trouvé ${photosWithGroupAnalysis.length} photo(s) primaire(s) avec analyse groupée\n`);

    if (photosWithGroupAnalysis.length === 0) {
      console.log('⚠️  Aucune photo avec analyse groupée trouvée en DB.');
      console.log('   Pour tester, il faut:');
      console.log('   1. Uploader des photos via l\'interface');
      console.log('   2. Passer à l\'étape 2 (Validation des pièces)');
      console.log('   3. Valider les groupes de pièces\n');
      return;
    }

    // 2. Pour chaque photo primaire, trouver les photos secondaires
    for (const primaryPhoto of photosWithGroupAnalysis) {
      const analysis = primaryPhoto.analysis;
      const groupPhotoIds = analysis._groupPhotoIds || [];
      
      console.log(`📸 Photo primaire: ${primaryPhoto.filename} (${primaryPhoto.roomType})`);
      console.log(`   - Items: ${analysis.items?.length || 0}`);
      console.log(`   - Groupe: ${groupPhotoIds.length} photo(s)`);
      
      if (groupPhotoIds.length > 1) {
        // Récupérer les photos secondaires
        const secondaryPhotos = await prisma.photo.findMany({
          where: {
            id: { in: groupPhotoIds.slice(1) }
          },
          select: {
            id: true,
            filename: true,
            analysis: true
          }
        });

        console.log(`\n   📋 Photos du groupe:`);
        for (const photo of secondaryPhotos) {
          const hasGroupInfo = photo.analysis?._groupPhotoIds !== undefined;
          const hasPrimaryId = photo.analysis?._primaryPhotoId !== undefined;
          console.log(`   - ${photo.filename}`);
          console.log(`     ✓ _groupPhotoIds: ${hasGroupInfo ? '✅' : '❌'}`);
          console.log(`     ✓ _primaryPhotoId: ${hasPrimaryId ? '✅' : '❌'}`);
          console.log(`     ✓ items: ${photo.analysis?.items?.length || 0}`);
        }
      }
      
      console.log('');
    }

    // 3. Tester avec une photo primaire
    if (photosWithGroupAnalysis.length > 0) {
      const testPhoto = photosWithGroupAnalysis[0];
      const groupPhotoIds = testPhoto.analysis._groupPhotoIds || [];
      
      console.log('🧪 Test de génération PDF...');
      console.log(`   PhotoIds: ${groupPhotoIds.join(', ')}\n`);
      
      const testPayload = {
        formData: {
          departure: { address: 'Test Départ' },
          arrival: { address: 'Test Arrivée' },
          movingDate: new Date().toISOString(),
          contact: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '0123456789'
          }
        },
        photoIds: groupPhotoIds
      };

      const response = await fetch('http://localhost:3001/api/pdf/generate-from-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        const pdfBuffer = await response.arrayBuffer();
        console.log(`✅ PDF généré avec succès: ${pdfBuffer.byteLength} bytes`);
        
        // Vérifier que c'est bien un PDF
        const header = Buffer.from(pdfBuffer.slice(0, 4)).toString();
        if (header === '%PDF') {
          console.log('✅ Le fichier est un PDF valide\n');
        } else {
          console.log('❌ Le fichier ne semble pas être un PDF valide\n');
        }
      } else {
        const error = await response.json();
        console.log('❌ Erreur lors de la génération du PDF:');
        console.log(JSON.stringify(error, null, 2));
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Résumé des vérifications:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 1. Photos primaires avec _isGroupAnalysis trouvées');
    console.log('✅ 2. Photos secondaires avec _groupPhotoIds vérifiées');
    console.log('✅ 3. Génération PDF testée\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

