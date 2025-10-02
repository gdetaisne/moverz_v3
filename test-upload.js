const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    // Utiliser une photo existante du dossier uploads
    const photoPath = './uploads/40e5237b-9b33-4153-a7a5-b731aeedaa2b.jpeg';
    
    if (!fs.existsSync(photoPath)) {
      console.log('❌ Aucune photo de test trouvée');
      return;
    }
    
    const form = new FormData();
    form.append('file', fs.createReadStream(photoPath));
    
    console.log('🚀 Test d\'upload en cours...');
    const response = await fetch('http://localhost:3001/api/photos/analyze', {
      method: 'POST',
      body: form,
      headers: {
        'x-user-id': 'dev-user-123'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload réussi !');
      console.log('📊 Résultats:');
      console.log('- Items détectés:', result.items?.length || 0);
      console.log('- Chaises:', result.items?.filter(item => item.label?.toLowerCase().includes('chaise')).length || 0);
      console.log('- Armoires:', result.items?.filter(item => item.label?.toLowerCase().includes('armoire')).length || 0);
      console.log('- Canapés:', result.items?.filter(item => item.label?.toLowerCase().includes('canapé')).length || 0);
    } else {
      console.log('❌ Erreur:', result);
    }
  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }
}

testUpload();
