const http = require('http');
const url = require('url');
const PORT = 8000;

// Serveur HTTP simple
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Route de santé
  if (method === 'GET' && path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'AI Mock Server', port: PORT }));
    return;
  }

  // Route d'analyse d'images
  if (method === 'POST' && path === '/analyze') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('🔍 Analyse demandée');
      
      const mockAnalysis = {
        items: [
          {
            label: 'Canapé',
            category: 'furniture',
            confidence: 0.95,
            dimensions: { width: 2.0, height: 0.8, depth: 0.9 },
            volume_m3: 1.44,
            packaged_volume_m3: 1.8,
            position: { x: 100, y: 150, width: 200, height: 80 }
          },
          {
            label: 'Table basse',
            category: 'furniture',
            confidence: 0.88,
            dimensions: { width: 1.2, height: 0.4, depth: 0.6 },
            volume_m3: 0.29,
            packaged_volume_m3: 0.35,
            position: { x: 150, y: 200, width: 120, height: 60 }
          },
          {
            label: 'Télévision',
            category: 'electronics',
            confidence: 0.92,
            dimensions: { width: 1.2, height: 0.7, depth: 0.1 },
            volume_m3: 0.08,
            packaged_volume_m3: 0.15,
            position: { x: 50, y: 50, width: 120, height: 70 }
          }
        ],
        room_type: 'salon',
        room_confidence: 0.85,
        processing_time: 1.2,
        provider: 'mock-service'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockAnalysis));
    });
    return;
  }

  // Route de classification de pièces
  if (method === 'POST' && path === '/classify-rooms') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('🏠 Classification de pièces demandée');
      
      const mockClassification = {
        rooms: [
          {
            id: 'room-1',
            room_type: 'salon',
            confidence: 0.9,
            photo_ids: ['photo1', 'photo2']
          },
          {
            id: 'room-2', 
            room_type: 'chambre',
            confidence: 0.85,
            photo_ids: ['photo3', 'photo4']
          }
        ],
        processing_time: 0.8,
        provider: 'mock-service'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockClassification));
    });
    return;
  }

  // Route non trouvée
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🤖 Serveur IA Mock démarré sur http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   GET  /health - Statut du service`);
  console.log(`   POST /analyze - Analyse d'images`);
  console.log(`   POST /classify-rooms - Classification de pièces`);
});
