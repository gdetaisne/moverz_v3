#!/usr/bin/env node
/**
 * Bull Board Dashboard Server
 * 
 * Interface d'administration pour monitorer les queues BullMQ:
 * - photo-analyze
 * - inventory-sync
 * 
 * Port: 3010
 * URL: http://localhost:3010/admin/queues
 * 
 * Auth: Header x-access-token avec valeur BULLBOARD_TOKEN
 * 
 * Usage:
 *   node scripts/bullboard.js
 *   
 * Prérequis:
 *   npm install @bull-board/express @bull-board/api express
 */

const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Configuration
const PORT = process.env.BULLBOARD_PORT || 3010;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const BULLBOARD_TOKEN = process.env.BULLBOARD_TOKEN || 'dev-secret-token';
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🎯 Bull Board Dashboard Server');
console.log(`   Port: ${PORT}`);
console.log(`   Redis: ${REDIS_URL}`);
console.log(`   Auth: ${BULLBOARD_TOKEN ? '✅ Enabled' : '❌ Disabled'}`);
console.log(`   Env: ${NODE_ENV}`);

// Redis connection
const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('connect', () => {
  console.log('✅ Redis connected');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

// Create queues (read-only connections for monitoring)
const queues = {
  'photo-analyze': new Queue('photo-analyze', { connection: redisConnection }),
  'inventory-sync': new Queue('inventory-sync', { connection: redisConnection }),
};

// Setup Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: Object.values(queues).map(queue => new BullMQAdapter(queue)),
  serverAdapter,
});

// Express app
const app = express();

// Middleware: JSON parsing
app.use(express.json());

// Middleware: Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Middleware: Auth protection
const authMiddleware = (req, res, next) => {
  // Skip auth in development if no token set
  if (NODE_ENV === 'development' && !BULLBOARD_TOKEN) {
    return next();
  }

  const token = req.headers['x-access-token'] || req.query.token;

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing x-access-token header or ?token query param',
    });
  }

  if (token !== BULLBOARD_TOKEN) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid access token',
    });
  }

  next();
};

// Apply auth to all /admin/* routes
app.use('/admin', authMiddleware);

// Mount Bull Board
app.use('/admin/queues', serverAdapter.getRouter());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisConnection.status,
    queues: Object.keys(queues),
  });
});

// API: Get queue stats
app.get('/admin/api/stats', async (req, res) => {
  try {
    const stats = {};

    for (const [name, queue] of Object.entries(queues)) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      stats[name] = {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      };
    }

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message,
    });
  }
});

// API: Get recent failed jobs
app.get('/admin/api/failed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10');
    const queueName = req.query.queue || 'photo-analyze';
    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        error: 'Queue not found',
        available: Object.keys(queues),
      });
    }

    const failed = await queue.getFailed(0, limit - 1);
    const jobs = failed.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    }));

    res.json({
      queue: queueName,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Error fetching failed jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch failed jobs',
      message: error.message,
    });
  }
});

// API: Retry all failed jobs
app.post('/admin/api/retry-failed', async (req, res) => {
  try {
    const queueName = req.body.queue || req.query.queue || 'photo-analyze';
    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        error: 'Queue not found',
        available: Object.keys(queues),
      });
    }

    const failed = await queue.getFailed(0, -1);
    let retried = 0;

    for (const job of failed) {
      try {
        await job.retry();
        retried++;
      } catch (error) {
        console.error(`Failed to retry job ${job.id}:`, error.message);
      }
    }

    res.json({
      queue: queueName,
      total: failed.length,
      retried,
      message: `Retried ${retried}/${failed.length} failed jobs`,
    });
  } catch (error) {
    console.error('Error retrying failed jobs:', error);
    res.status(500).json({
      error: 'Failed to retry jobs',
      message: error.message,
    });
  }
});

// API: Clean completed jobs
app.post('/admin/api/clean', async (req, res) => {
  try {
    const queueName = req.body.queue || req.query.queue || 'photo-analyze';
    const grace = parseInt(req.body.grace || req.query.grace || '3600000'); // 1 hour default
    const queue = queues[queueName];

    if (!queue) {
      return res.status(404).json({
        error: 'Queue not found',
        available: Object.keys(queues),
      });
    }

    const cleaned = await queue.clean(grace, 1000, 'completed');

    res.json({
      queue: queueName,
      cleaned: cleaned.length,
      message: `Cleaned ${cleaned.length} completed jobs older than ${grace}ms`,
    });
  } catch (error) {
    console.error('Error cleaning jobs:', error);
    res.status(500).json({
      error: 'Failed to clean jobs',
      message: error.message,
    });
  }
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/admin/queues');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.path} not found`,
    hint: 'Try /admin/queues or /health',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n✅ Bull Board Dashboard running at:`);
  console.log(`   http://localhost:${PORT}/admin/queues`);
  console.log(`   http://localhost:${PORT}/health`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   GET  /admin/api/stats         - Queue statistics`);
  console.log(`   GET  /admin/api/failed        - Recent failed jobs`);
  console.log(`   POST /admin/api/retry-failed  - Retry all failed`);
  console.log(`   POST /admin/api/clean         - Clean old completed`);
  console.log(`\n🔑 Auth: x-access-token: ${BULLBOARD_TOKEN}`);
  console.log(`\n💡 Example:`);
  console.log(`   curl -H "x-access-token: ${BULLBOARD_TOKEN}" http://localhost:${PORT}/admin/api/stats`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  await Promise.all(
    Object.values(queues).map(queue => queue.close())
  );
  console.log('✅ Queues closed');

  await redisConnection.quit();
  console.log('✅ Redis connection closed');

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  await Promise.all(
    Object.values(queues).map(queue => queue.close())
  );
  console.log('✅ Queues closed');

  await redisConnection.quit();
  console.log('✅ Redis connection closed');

  process.exit(0);
});



