#!/usr/bin/env node
/**
 * Script de diagnostic pour le problème PDF
 * Vérifie l'état des photos en base de données
 */

const API_URL = process.env.API_URL || 'https://movers-test.gslv.cloud';

async function diagnosePDFIssue() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Diagnostic: Problème PDF "Aucune photo analysée"');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Tester l'endpoint de debug
    console.log('🔍 1. Test de l\'endpoint debug...');
    
    const debugResponse = await fetch(`${API_URL}/api/debug-photos`, {
      headers: {
        'x-user-id': 'test-user-123'
      }
    });

    if (!debugResponse.ok) {
      console.error('❌ Endpoint debug non disponible');
      console.log('   Vérifiez que /api/debug-photos/route.ts existe');
      return;
    }

    const debugData = await debugResponse.json();
    
    console.log('📊 Statistiques des photos:');
    console.log(`   Total photos: ${debugData.stats.total}`);
    console.log(`   PENDING: ${debugData.stats.byStatus.PENDING}`);
    console.log(`   PROCESSING: ${debugData.stats.byStatus.PROCESSING}`);
    console.log(`   DONE: ${debugData.stats.byStatus.DONE}`);
    console.log(`   ERROR: ${debugData.stats.byStatus.ERROR}`);
    console.log(`   Avec analyse: ${debugData.stats.withAnalysis}`);
    console.log(`   Avec items: ${debugData.stats.withItems}`);
    console.log(`   Prêtes pour PDF: ${debugData.stats.readyForPDF}\n`);

    // 2. Analyser les photos en détail
    if (debugData.photos.length === 0) {
      console.log('⚠️  Aucune photo trouvée');
      console.log('\n💡 Actions:');
      console.log('   1. Uploader des photos via l\'interface');
      console.log('   2. Attendre l\'analyse IA');
      console.log('   3. Re-lancer ce script');
      return;
    }

    console.log('📋 Détail des photos:');
    debugData.photos.forEach((photo, idx) => {
      const status = photo.status === 'DONE' ? '✅' : 
                    photo.status === 'ERROR' ? '❌' : 
                    photo.status === 'PROCESSING' ? '⏳' : '⏸️';
      
      console.log(`   ${status} ${photo.filename}`);
      console.log(`      Statut: ${photo.status}`);
      console.log(`      Analyse: ${photo.hasAnalysis ? '✅' : '❌'}`);
      console.log(`      Items: ${photo.hasItems ? `✅ (${photo.itemsCount})` : '❌'}`);
      console.log(`      Pièce: ${photo.roomType || 'Non détectée'}`);
      console.log(`      Date: ${new Date(photo.createdAt).toLocaleString()}`);
      console.log('');
    });

    // 3. Diagnostiquer le problème
    console.log('🔧 3. Diagnostic:');
    
    if (debugData.stats.total === 0) {
      console.log('❌ Problème: Aucune photo uploadée');
      console.log('   Solution: Uploader des photos via l\'interface');
    } else if (debugData.stats.byStatus.DONE === 0) {
      console.log('❌ Problème: Aucune photo terminée (statut DONE)');
      console.log('   Solutions:');
      console.log('   - Vérifier que l\'analyse IA fonctionne');
      console.log('   - Vérifier les logs serveur pour erreurs');
      console.log('   - Relancer l\'analyse si nécessaire');
    } else if (debugData.stats.withAnalysis === 0) {
      console.log('❌ Problème: Photos DONE mais sans analyse');
      console.log('   Solutions:');
      console.log('   - Vérifier la structure analysis dans la DB');
      console.log('   - Vérifier le provider IA (Claude/OpenAI)');
      console.log('   - Vérifier les clés API IA');
    } else if (debugData.stats.withItems === 0) {
      console.log('❌ Problème: Analyses sans items');
      console.log('   Solutions:');
      console.log('   - Vérifier la structure analysis.items');
      console.log('   - Vérifier que l\'IA détecte des objets');
      console.log('   - Tester avec des photos contenant des meubles clairs');
    } else if (debugData.stats.readyForPDF === 0) {
      console.log('❌ Problème: Photos avec items mais pas DONE');
      console.log('   Solutions:');
      console.log('   - Attendre que les analyses se terminent');
      console.log('   - Vérifier que le statut est bien DONE');
    } else {
      console.log('✅ Les données semblent correctes');
      console.log('   Le problème pourrait être:');
      console.log('   - Dans le frontend (currentRoom.photos vide)');
      console.log('   - Dans la récupération des données UI');
      console.log('   - Dans le mapping des données');
    }

    // 4. Tester la génération PDF si possible
    if (debugData.stats.readyForPDF > 0) {
      console.log('\n🧪 4. Test génération PDF...');
      
      const photoIds = debugData.photos
        .filter(p => p.status === 'DONE' && p.hasItems)
        .slice(0, 3)
        .map(p => p.id);

      console.log(`   Tentative avec ${photoIds.length} photos...`);

      const pdfResponse = await fetch(`${API_URL}/api/pdf/generate-from-photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-123'
        },
        body: JSON.stringify({
          photoIds: photoIds,
          formData: {
            email: 'test@example.com',
            departureCity: 'Paris',
            departurePostalCode: '75001',
            departureElevator: true,
            arrivalCity: 'Lyon',
            arrivalPostalCode: '69001',
            arrivalElevator: false,
            movingDate: new Date().toISOString().split('T')[0],
            selectedOffer: 'standard'
          }
        })
      });

      if (pdfResponse.ok) {
        const pdfSize = (await pdfResponse.arrayBuffer()).byteLength;
        console.log(`   ✅ PDF généré avec succès (${(pdfSize / 1024).toFixed(2)} KB)`);
        console.log('   Le problème est dans le frontend, pas le backend');
      } else {
        const error = await pdfResponse.json();
        console.log(`   ❌ Erreur génération PDF: ${error.error}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Diagnostic terminé');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Erreur lors du diagnostic:', error.message);
    console.error(error.stack);
  }
}

// Lancer le diagnostic
diagnosePDFIssue().catch(console.error);
