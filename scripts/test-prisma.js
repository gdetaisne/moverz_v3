#!/usr/bin/env node

/**
 * Script de test Prisma - Vérifie que tout fonctionne
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrisma() {
  console.log('\n🧪 TEST PRISMA\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1 : Connexion à la DB
    console.log('\n1️⃣  Test de connexion à la DB...');
    await prisma.$connect();
    console.log('   ✅ Connexion réussie');
    
    // Test 2 : Lecture simple
    console.log('\n2️⃣  Test de lecture (count users)...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ Lecture réussie : ${userCount} utilisateur(s)`);
    
    // Test 3 : Écriture (création utilisateur test)
    console.log('\n3️⃣  Test d\'écriture (créer un utilisateur test)...');
    const testUser = await prisma.user.create({
      data: {
        id: `test-prisma-${Date.now()}`,
        email: `test-${Date.now()}@example.com`
      }
    });
    console.log(`   ✅ Écriture réussie : ${testUser.id}`);
    
    // Test 4 : Lecture avec relation
    console.log('\n4️⃣  Test de lecture avec relations...');
    const users = await prisma.user.findMany({
      include: {
        projects: true,
        rooms: true
      },
      take: 1
    });
    console.log(`   ✅ Lecture avec relations réussie : ${users.length} résultat(s)`);
    
    // Test 5 : Mise à jour
    console.log('\n5️⃣  Test de mise à jour...');
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { 
        email: `updated-${Date.now()}@example.com` 
      }
    });
    console.log(`   ✅ Mise à jour réussie : ${updatedUser.email}`);
    
    // Test 6 : Suppression
    console.log('\n6️⃣  Test de suppression...');
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('   ✅ Suppression réussie');
    
    // Test 7 : Transactions
    console.log('\n7️⃣  Test de transaction...');
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: `txn-test-${Date.now()}`
        }
      });
      
      const room = await tx.room.create({
        data: {
          name: 'Test Room',
          roomType: 'test',
          userId: user.id
        }
      });
      
      // Supprimer immédiatement (cascade)
      await tx.user.delete({
        where: { id: user.id }
      });
      
      return { user, room };
    });
    console.log('   ✅ Transaction réussie (create + delete)');
    
    // Test 8 : Raw query
    console.log('\n8️⃣  Test de requête raw SQL...');
    const rawResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM User
    `;
    // SQLite retourne BigInt pour COUNT, on le convertit
    const count = rawResult[0]?.count ? Number(rawResult[0].count) : 0;
    console.log(`   ✅ Raw query réussie : count = ${count}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ TOUS LES TESTS PRISMA SONT PASSÉS !\n');
    console.log('Prisma fonctionne parfaitement :');
    console.log('  - Connexion DB ✅');
    console.log('  - Lecture ✅');
    console.log('  - Écriture ✅');
    console.log('  - Relations ✅');
    console.log('  - Mise à jour ✅');
    console.log('  - Suppression ✅');
    console.log('  - Transactions ✅');
    console.log('  - Raw queries ✅');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERREUR PRISMA:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Déconnexion de Prisma\n');
  }
}

testPrisma();

