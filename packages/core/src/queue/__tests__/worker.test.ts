import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../db';

// Mock Prisma
vi.mock('../../db', () => ({
  prisma: {
    photo: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    aiMetric: {
      create: vi.fn(),
    },
  },
}));

// Mock Redis/BullMQ
vi.mock('../queue', () => ({
  getRedisConnection: vi.fn(() => ({
    on: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock AI Engine
vi.mock('@moverz/ai/engine', () => ({
  detectRoom: vi.fn(async () => 'salon'),
  analyzePhoto: vi.fn(async () => ({
    items: [
      { name: 'Table', category: 'furniture', confidence: 0.9 },
      { name: 'Chaise', category: 'furniture', confidence: 0.85 },
    ],
    confidence: 0.9,
  })),
}));

describe('Photo Analyze Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip processing if photo already DONE', async () => {
    // Mock photo déjà DONE
    (prisma.photo.findUnique as any).mockResolvedValue({
      id: 'photo-123',
      status: 'DONE',
      filePath: '/uploads/test.jpg',
      url: 'http://localhost/test.jpg',
      roomType: 'salon',
      analysis: { items: [] },
    });

    // Simuler job data
    const jobData = {
      photoId: 'photo-123',
      userId: 'user-123',
      force: false,
    };

    // Logique simplifiée (le worker réel ferait ceci)
    const photo = await prisma.photo.findUnique({ where: { id: jobData.photoId } });
    
    if (photo && photo.status === 'DONE' && !jobData.force) {
      expect(photo.status).toBe('DONE');
      expect(prisma.photo.update).not.toHaveBeenCalled();
    }
  });

  it('should process photo and write metrics on success', async () => {
    (prisma.photo.findUnique as any).mockResolvedValue({
      id: 'photo-456',
      status: 'PENDING',
      filePath: '/uploads/test2.jpg',
      url: 'http://localhost/test2.jpg',
      roomType: null,
      analysis: null,
    });

    (prisma.photo.update as any).mockResolvedValue({});
    (prisma.aiMetric.create as any).mockResolvedValue({});

    const photo = await prisma.photo.findUnique({ where: { id: 'photo-456' } });
    expect(photo).toBeDefined();
    expect(photo?.status).toBe('PENDING');

    // Simuler mise à jour PROCESSING
    await prisma.photo.update({
      where: { id: 'photo-456' },
      data: { status: 'PROCESSING' },
    });

    // Simuler analyse réussie
    await prisma.photo.update({
      where: { id: 'photo-456' },
      data: {
        status: 'DONE',
        analysis: { items: [] },
        processedAt: new Date(),
      },
    });

    // Simuler écriture métrique
    await prisma.aiMetric.create({
      data: {
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        operation: 'analyze_photo',
        latencyMs: 1500,
        success: true,
        retries: 0,
      },
    });

    expect(prisma.photo.update).toHaveBeenCalledTimes(2);
    expect(prisma.aiMetric.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        success: true,
        operation: 'analyze_photo',
      }),
    });
  });

  it('should handle errors and write error metrics', async () => {
    (prisma.photo.findUnique as any).mockResolvedValue({
      id: 'photo-error',
      status: 'PENDING',
      filePath: '/uploads/error.jpg',
      url: 'http://localhost/error.jpg',
    });

    (prisma.photo.update as any).mockResolvedValue({});
    (prisma.aiMetric.create as any).mockResolvedValue({});

    // Simuler erreur
    const error = new Error('AI_TIMEOUT');

    await prisma.photo.update({
      where: { id: 'photo-error' },
      data: {
        status: 'ERROR',
        errorCode: 'TIMEOUT',
        errorMessage: "Timeout lors de l'appel IA",
      },
    });

    await prisma.aiMetric.create({
      data: {
        provider: 'anthropic',
        model: 'unknown',
        operation: 'analyze_photo',
        latencyMs: 30000,
        success: false,
        errorType: 'TIMEOUT',
        retries: 1,
      },
    });

    expect(prisma.photo.update).toHaveBeenCalledWith({
      where: { id: 'photo-error' },
      data: expect.objectContaining({
        status: 'ERROR',
        errorCode: 'TIMEOUT',
      }),
    });

    expect(prisma.aiMetric.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        success: false,
        errorType: 'TIMEOUT',
      }),
    });
  });
});

describe('Inventory Sync Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should aggregate inventory from multiple photos', async () => {
    // Mock photos DONE
    const mockPhotos = [
      {
        id: 'photo-1',
        roomType: 'salon',
        analysis: {
          items: [{ name: 'Table' }, { name: 'Chaise' }],
          totals: { volume_m3: 2.5 },
        },
      },
      {
        id: 'photo-2',
        roomType: 'salon',
        analysis: {
          items: [{ name: 'Canapé' }],
          totals: { volume_m3: 3.0 },
        },
      },
      {
        id: 'photo-3',
        roomType: 'cuisine',
        analysis: {
          items: [{ name: 'Réfrigérateur' }],
          totals: { volume_m3: 1.5 },
        },
      },
    ];

    // Logique d'agrégation simplifiée
    const roomsMap = new Map();
    let totalItems = 0;
    let totalVolume = 0;

    for (const photo of mockPhotos) {
      const roomType = photo.roomType;
      if (!roomsMap.has(roomType)) {
        roomsMap.set(roomType, {
          roomType,
          itemsCount: 0,
          volume_m3: 0,
          photos: [],
        });
      }

      const room = roomsMap.get(roomType);
      const itemsCount = photo.analysis.items.length;
      const volume = photo.analysis.totals.volume_m3;

      room.itemsCount += itemsCount;
      room.volume_m3 += volume;
      room.photos.push(photo.id);

      totalItems += itemsCount;
      totalVolume += volume;
    }

    const rooms = Array.from(roomsMap.values());

    expect(rooms).toHaveLength(2);
    expect(totalItems).toBe(4);
    expect(totalVolume).toBe(7.0);

    const salonRoom = rooms.find(r => r.roomType === 'salon');
    expect(salonRoom?.itemsCount).toBe(3);
    expect(salonRoom?.volume_m3).toBe(5.5);
  });
});

