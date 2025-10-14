#!/usr/bin/env node
/**
 * Script de test pour la génération PDF
 * Teste le nouvel endpoint qui charge les images côté serveur
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testPDFGeneration() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Test Génération PDF avec Images Serveur');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Récupérer une photo existante depuis la DB
    console.log('📸 Récupération de photos depuis la DB...');
    
    const photoResponse = await fetch(`${API_URL}/api/test-get-photos`, {
      headers: {
        'x-user-id': 'test-user-123'
      }
    });

    if (!photoResponse.ok) {
      console.error('❌ Impossible de récupérer les photos');
      console.log('\n⚠️  Astuce: Uploadez d\'abord des photos via l\'interface');
      return;
    }

    const photos = await photoResponse.json();
    
    if (!photos || photos.length === 0) {
      console.log('⚠️  Aucune photo trouvée');
      console.log('\n💡 Étapes pour tester:');
      console.log('   1. Ouvrir l\'application');
      console.log('   2. Uploader des photos');
      console.log('   3. Attendre l\'analyse IA');
      console.log('   4. Re-lancer ce script');
      return;
    }

    console.log(`✅ ${photos.length} photos trouvées`);
    console.log(`   Première photo: ${photos[0].filename} (${photos[0].id})`);

    // 2. Tester la génération PDF
    console.log('\n📄 Génération du PDF...');

    const photoIds = photos.slice(0, 3).map(p => p.id); // Prendre max 3 photos pour le test
    
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

    if (!pdfResponse.ok) {
      const error = await pdfResponse.json();
      console.error('❌ Erreur génération PDF:');
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    const contentType = pdfResponse.headers.get('content-type');
    if (contentType !== 'application/pdf') {
      console.error('❌ Type de contenu incorrect:', contentType);
      return;
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfSize = pdfBuffer.byteLength;

    console.log(`✅ PDF généré avec succès!`);
    console.log(`   Taille: ${(pdfSize / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${contentType}`);

    // Vérifier le magic number PDF
    const view = new Uint8Array(pdfBuffer);
    const magicNumber = String.fromCharCode(...view.slice(0, 4));
    
    if (magicNumber === '%PDF') {
      console.log(`   Magic number: ✅ ${magicNumber}`);
    } else {
      console.log(`   Magic number: ❌ ${magicNumber} (attendu: %PDF)`);
    }

    // Sauvegarder le PDF pour vérification
    const fs = require('fs');
    const filename = `test-pdf-${Date.now()}.pdf`;
    fs.writeFileSync(filename, Buffer.from(pdfBuffer));
    console.log(`\n💾 PDF sauvegardé: ${filename}`);
    console.log(`   Ouvrir avec: open ${filename} (macOS) ou xdg-open ${filename} (Linux)`);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ Test réussi - Vérifier le PDF pour les photos/inventaire');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error(error.stack);
  }
}

// Endpoint helper pour récupérer des photos de test
async function createTestEndpoint() {
  console.log('\n💡 Pour tester, créez un endpoint temporaire:');
  console.log('\napp/api/test-get-photos/route.ts:');
  console.log(`
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@core/db';

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  
  const photos = await prisma.photo.findMany({
    where: {
      status: 'DONE',
      project: { userId: userId || undefined }
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      filename: true,
      filePath: true,
      url: true,
      roomType: true,
      analysis: true
    }
  });
  
  return NextResponse.json(photos);
}
  `);
}

// Lancer le test
testPDFGeneration().catch(console.error);

