// LOT 11 - Batch Service Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createBatch, updateBatchCounts, computeBatchProgress, shouldTriggerInventorySync } from '../batchService';
import { prisma } from '../../db';

// Mock Prisma
vi.mock('../../db', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    batch: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    photo: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Batch Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBatch', () => {
    it('devrait créer un batch avec les photos associées', async () => {
      const mockProject = {
        id: 'project-1',
        userId: 'user-1',
      };

      const mockBatch = {
        id: 'batch-1',
        projectId: 'project-1',
        userId: 'user-1',
        status: 'QUEUED',
        countsQueued: 2,
        countsProcessing: 0,
        countsCompleted: 0,
        countsFailed: 0,
        inventoryQueued: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPhotos = [
        { id: 'photo-1', filename: 'img1.jpg', checksum: 'abc123' },
        { id: 'photo-2', filename: 'img2.jpg', checksum: 'def456' },
      ];

      vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject as any);
      vi.mocked(prisma.batch.create).mockResolvedValue(mockBatch as any);
      vi.mocked(prisma.photo.findMany).mockResolvedValue(mockPhotos as any);

      const result = await createBatch({
        projectId: 'project-1',
        userId: 'user-1',
        assets: [
          { filename: 'img1.jpg', filePath: '/path/img1.jpg', url: 'http://example.com/img1.jpg' },
          { filename: 'img2.jpg', filePath: '/path/img2.jpg', url: 'http://example.com/img2.jpg' },
        ],
      });

      expect(result.id).toBe('batch-1');
      expect(result.photos).toHaveLength(2);
      expect(prisma.batch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'project-1',
            userId: 'user-1',
            status: 'QUEUED',
            countsQueued: 2,
          }),
        })
      );
    });

    it('devrait rejeter si le projet n\'existe pas', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

      await expect(createBatch({
        projectId: 'non-existent',
        userId: 'user-1',
        assets: [],
      })).rejects.toThrow('not found');
    });

    it('devrait rejeter si l\'utilisateur n\'est pas propriétaire du projet', async () => {
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'project-1',
        userId: 'other-user',
      } as any);

      await expect(createBatch({
        projectId: 'project-1',
        userId: 'user-1',
        assets: [],
      })).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateBatchCounts', () => {
    it('devrait mettre à jour les compteurs et le statut du batch', async () => {
      const mockBatch = {
        id: 'batch-1',
        status: 'QUEUED',
        photos: [
          { status: 'PENDING' },
          { status: 'PROCESSING' },
          { status: 'DONE' },
          { status: 'ERROR' },
        ],
      };

      const mockUpdatedBatch = {
        ...mockBatch,
        status: 'PROCESSING',
        countsQueued: 1,
        countsProcessing: 1,
        countsCompleted: 1,
        countsFailed: 1,
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);
      vi.mocked(prisma.batch.update).mockResolvedValue(mockUpdatedBatch as any);

      const result = await updateBatchCounts('batch-1');

      expect(result.counts).toEqual({
        queued: 1,
        processing: 1,
        completed: 1,
        failed: 1,
      });
      expect(result.batch.status).toBe('PROCESSING');
      expect(result.isComplete).toBe(false);
    });

    it('devrait marquer le batch comme COMPLETED si toutes les photos sont DONE', async () => {
      const mockBatch = {
        id: 'batch-1',
        status: 'PROCESSING',
        photos: [
          { status: 'DONE' },
          { status: 'DONE' },
          { status: 'DONE' },
        ],
      };

      const mockUpdatedBatch = {
        ...mockBatch,
        status: 'COMPLETED',
        countsQueued: 0,
        countsProcessing: 0,
        countsCompleted: 3,
        countsFailed: 0,
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);
      vi.mocked(prisma.batch.update).mockResolvedValue(mockUpdatedBatch as any);

      const result = await updateBatchCounts('batch-1');

      expect(result.batch.status).toBe('COMPLETED');
      expect(result.isComplete).toBe(true);
    });

    it('devrait marquer le batch comme PARTIAL si succès ET échecs', async () => {
      const mockBatch = {
        id: 'batch-1',
        status: 'PROCESSING',
        photos: [
          { status: 'DONE' },
          { status: 'DONE' },
          { status: 'ERROR' },
        ],
      };

      const mockUpdatedBatch = {
        ...mockBatch,
        status: 'PARTIAL',
        countsQueued: 0,
        countsProcessing: 0,
        countsCompleted: 2,
        countsFailed: 1,
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);
      vi.mocked(prisma.batch.update).mockResolvedValue(mockUpdatedBatch as any);

      const result = await updateBatchCounts('batch-1');

      expect(result.batch.status).toBe('PARTIAL');
      expect(result.isComplete).toBe(true);
    });

    it('devrait marquer le batch comme FAILED si toutes les photos ont échoué', async () => {
      const mockBatch = {
        id: 'batch-1',
        status: 'PROCESSING',
        photos: [
          { status: 'ERROR' },
          { status: 'ERROR' },
        ],
      };

      const mockUpdatedBatch = {
        ...mockBatch,
        status: 'FAILED',
        countsQueued: 0,
        countsProcessing: 0,
        countsCompleted: 0,
        countsFailed: 2,
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);
      vi.mocked(prisma.batch.update).mockResolvedValue(mockUpdatedBatch as any);

      const result = await updateBatchCounts('batch-1');

      expect(result.batch.status).toBe('FAILED');
      expect(result.isComplete).toBe(true);
    });
  });

  describe('computeBatchProgress', () => {
    it('devrait calculer la progression du batch (0-100)', async () => {
      const mockBatch = {
        id: 'batch-1',
        status: 'PROCESSING',
        countsQueued: 1,
        countsProcessing: 1,
        countsCompleted: 2,
        countsFailed: 0,
        photos: [
          { id: 'p1', filename: 'img1.jpg', status: 'DONE', roomType: null, errorCode: null, errorMessage: null, analysis: null },
          { id: 'p2', filename: 'img2.jpg', status: 'DONE', roomType: null, errorCode: null, errorMessage: null, analysis: null },
          { id: 'p3', filename: 'img3.jpg', status: 'PROCESSING', roomType: null, errorCode: null, errorMessage: null, analysis: null },
          { id: 'p4', filename: 'img4.jpg', status: 'PENDING', roomType: null, errorCode: null, errorMessage: null, analysis: null },
        ],
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);

      const result = await computeBatchProgress('batch-1');

      expect(result.progress).toBe(50); // 2 / 4 = 50%
      expect(result.counts.total).toBe(4);
      expect(result.counts.completed).toBe(2);
      expect(result.photos).toHaveLength(4);
    });

    it('devrait inclure l\'inventorySummary si batch COMPLETED', async () => {
      const mockBatch = {
        id: 'batch-1',
        status: 'COMPLETED',
        countsQueued: 0,
        countsProcessing: 0,
        countsCompleted: 2,
        countsFailed: 0,
        photos: [
          {
            id: 'p1',
            filename: 'img1.jpg',
            status: 'DONE',
            roomType: 'living_room',
            errorCode: null,
            errorMessage: null,
            analysis: {
              items: [{ name: 'Table' }, { name: 'Chaise' }],
              totals: { volume_m3: 1.5 },
            },
          },
          {
            id: 'p2',
            filename: 'img2.jpg',
            status: 'DONE',
            roomType: 'bedroom',
            errorCode: null,
            errorMessage: null,
            analysis: {
              items: [{ name: 'Lit' }],
              totals: { volume_m3: 2.0 },
            },
          },
        ],
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);

      const result = await computeBatchProgress('batch-1');

      expect(result.progress).toBe(100);
      expect(result.inventorySummary).toBeDefined();
      expect(result.inventorySummary?.totalItems).toBe(3);
      expect(result.inventorySummary?.totalVolume).toBe(3.5);
      expect(result.inventorySummary?.rooms).toHaveLength(2);
    });
  });

  describe('shouldTriggerInventorySync', () => {
    it('devrait retourner true si le batch est complet et pas encore déclenché', async () => {
      const mockBatch = {
        id: 'batch-1',
        inventoryQueued: false,
        countsQueued: 0,
        countsProcessing: 0,
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);
      vi.mocked(prisma.batch.update).mockResolvedValue({ ...mockBatch, inventoryQueued: true } as any);

      const result = await shouldTriggerInventorySync('batch-1');

      expect(result).toBe(true);
      expect(prisma.batch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { inventoryQueued: true },
      });
    });

    it('devrait retourner false si le batch est déjà déclenché', async () => {
      const mockBatch = {
        id: 'batch-1',
        inventoryQueued: true,
        countsQueued: 0,
        countsProcessing: 0,
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);

      const result = await shouldTriggerInventorySync('batch-1');

      expect(result).toBe(false);
      expect(prisma.batch.update).not.toHaveBeenCalled();
    });

    it('devrait retourner false si le batch n\'est pas complet', async () => {
      const mockBatch = {
        id: 'batch-1',
        inventoryQueued: false,
        countsQueued: 2,
        countsProcessing: 1,
      };

      vi.mocked(prisma.batch.findUnique).mockResolvedValue(mockBatch as any);

      const result = await shouldTriggerInventorySync('batch-1');

      expect(result).toBe(false);
      expect(prisma.batch.update).not.toHaveBeenCalled();
    });
  });
});




