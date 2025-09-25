import { z } from "zod";

export const BoundingBox = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});

export const DimensionsCm = z.object({
  length: z.number().positive().nullable(),
  width: z.number().positive().nullable(),
  height: z.number().positive().nullable(),
  source: z.enum(["estimated","catalog","user"]).default("estimated"),
});

export const InventoryItem = z.object({
  label: z.string(),
  category: z.enum(["furniture","appliance","fragile","box","misc"]).default("misc"),
  confidence: z.number().min(0).max(1).default(0.5),
  quantity: z.number().int().positive().default(1),
  dimensions_cm: DimensionsCm,
  volume_m3: z.number().nonnegative().default(0),
  fragile: z.boolean().default(false),
  stackable: z.boolean().default(true),
  notes: z.string().optional(),
  bounding_boxes: z.array(BoundingBox).optional(),
});

export const PhotoAnalysis = z.object({
  version: z.literal("1.0.0"),
  photo_id: z.string(),
  items: z.array(InventoryItem),
  totals: z.object({
    count_items: z.number().int().nonnegative(),
    volume_m3: z.number().nonnegative(),
  }),
  warnings: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
});

export type TPhotoAnalysis = z.infer<typeof PhotoAnalysis>;
export type TInventoryItem = z.infer<typeof InventoryItem>;
