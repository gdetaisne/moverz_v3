#!/usr/bin/env node
/**
 * 🔍 Diagnostic complet Étape 2
 * Identifie pourquoi les photos sont noires et l'inventaire vide
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

console.log('🔍 DIAGNOSTIC ÉTAPE 2 - Photos noires + Inventaire vide\n');
console.log('═══════════════════════════════════════════════════════\n');

async function main() {
  // 1. Vérifier les photos en DB
  console.log('📊 1. PHOTOS EN BASE DE DONNÉES');
  console.log('─────────────────────────────────');
  
  const allPhotos = await prisma.photo.findMany({
    include: {
      project: {
        select: {
          userId: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  console.log(`Total photos: ${allPhotos.length}\n`);
  
  if (allPhotos.length === 0) {
    console.log('⚠️  Aucune photo en DB - Le problème est en amont (upload).\n');
  } else {
    allPhotos.forEach((photo, idx) => {
      console.log(`Photo ${idx + 1}:`);
      console.log(`  ID: ${photo.id}`);
      console.log(`  Filename: ${photo.filename}`);
      console.log(`  URL: ${photo.url}`);
      console.log(`  FilePath: ${photo.filePath}`);
      console.log(`  RoomType: ${photo.roomType}`);
      console.log(`  Status: ${photo.status}`);
      console.log(`  HasAnalysis: ${!!photo.analysis}`);
      
      if (photo.analysis) {
        const analysis = typeof photo.analysis === 'string' 
          ? JSON.parse(photo.analysis) 
          : photo.analysis;
        console.log(`  Analysis.items: ${Array.isArray(analysis.items) ? analysis.items.length : 'N/A'}`);
        console.log(`  Analysis.totalVolume: ${analysis.totalVolume ?? 'N/A'}`);
      }
      
      console.log(`  UserId: ${photo.project.userId}`);
      console.log('');
    });
  }
  
  // 2. Vérifier les fichiers sur disque
  console.log('\n📁 2. FICHIERS SUR DISQUE (/uploads/)');
  console.log('─────────────────────────────────────');
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log(`⚠️  Le dossier uploads n'existe pas: ${uploadsDir}\n`);
  } else {
    const files = fs.readdirSync(uploadsDir).filter(f => 
      f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
    );
    
    console.log(`Fichiers images trouvés: ${files.length}\n`);
    
    if (files.length === 0) {
      console.log('⚠️  Aucun fichier image dans /uploads/\n');
    } else {
      files.slice(0, 5).forEach((file, idx) => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        console.log(`${idx + 1}. ${file} (${Math.round(stats.size / 1024)} KB)`);
      });
      console.log('');
    }
    
    // Vérifier cohérence DB <-> Disque
    const photosWithFiles = allPhotos.filter(p => {
      const filename = p.filePath ? path.basename(p.filePath) : p.filename;
      return fs.existsSync(path.join(uploadsDir, filename));
    });
    
    console.log(`Photos en DB avec fichier existant: ${photosWithFiles.length}/${allPhotos.length}\n`);
  }
  
  // 3. Tester endpoint /api/uploads/[filename]
  console.log('\n🌐 3. TEST ENDPOINT /api/uploads/[filename]');
  console.log('────────────────────────────────────────────');
  
  if (allPhotos.length > 0) {
    const testPhoto = allPhotos[0];
    const filename = testPhoto.filePath ? path.basename(testPhoto.filePath) : testPhoto.filename;
    const testUrl = `http://localhost:3001/api/uploads/${filename}`;
    
    console.log(`URL de test: ${testUrl}`);
    
    try {
      const response = await fetch(testUrl);
      console.log(`Statut: ${response.status} ${response.statusText}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`Content-Length: ${response.headers.get('content-length')} bytes\n`);
      
      if (response.status !== 200) {
        console.log(`⚠️  Erreur: Le endpoint ne retourne pas 200`);
        const text = await response.text();
        console.log(`Réponse: ${text.substring(0, 200)}\n`);
      }
    } catch (err) {
      console.log(`❌ Erreur fetch: ${err.message}\n`);
    }
  }
  
  // 4. Résumé et recommandations
  console.log('\n📋 4. RÉSUMÉ ET RECOMMANDATIONS');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const photosWithAnalysis = allPhotos.filter(p => p.analysis);
  const photosWithItems = allPhotos.filter(p => {
    if (!p.analysis) return false;
    const analysis = typeof p.analysis === 'string' 
      ? JSON.parse(p.analysis) 
      : p.analysis;
    return Array.isArray(analysis.items) && analysis.items.length > 0;
  });
  
  console.log(`✅ Photos en DB: ${allPhotos.length}`);
  console.log(`✅ Photos avec analysis: ${photosWithAnalysis.length}`);
  console.log(`✅ Photos avec items: ${photosWithItems.length}\n`);
  
  if (allPhotos.length === 0) {
    console.log('🔧 ACTION: Uploader des photos d\'abord (Étape 1)\n');
  } else if (photosWithAnalysis.length === 0) {
    console.log('🔧 ACTION: Les photos ne sont pas analysées');
    console.log('   → Vérifier l\'endpoint /api/photos/analyze');
    console.log('   → Vérifier les logs serveur lors de l\'upload\n');
  } else if (photosWithItems.length === 0) {
    console.log('🔧 ACTION: Les analyses n\'ont pas d\'items');
    console.log('   → Vérifier la structure analysis.items dans la DB');
    console.log('   → Vérifier le provider IA (Claude/OpenAI)\n');
  } else {
    console.log('✅ Les données semblent correctes en DB');
    console.log('🔧 ACTION: Le problème est dans le rendu UI');
    console.log('   → Vérifier resolvePhotoSrc() dans lib/imageUrl.ts');
    console.log('   → Vérifier le mapping des données dans RoomInventoryCard');
    console.log('   → Activer debug=true dans resolvePhotoSrc');
    console.log('   → Ouvrir la console navigateur (F12) et recharger\n');
  }
  
  // 5. Export des données pour debug
  if (allPhotos.length > 0) {
    const debugData = allPhotos.slice(0, 3).map(p => ({
      id: p.id,
      filename: p.filename,
      url: p.url,
      filePath: p.filePath,
      roomType: p.roomType,
      analysis: p.analysis
    }));
    
    fs.writeFileSync(
      path.join(process.cwd(), 'debug-photos.json'),
      JSON.stringify(debugData, null, 2)
    );
    console.log('💾 Export debug: debug-photos.json créé\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

