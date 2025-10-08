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
  source: z.enum(["estimated","catalog","user","reasoned"]).default("estimated"),
});

export const InventoryItem = z.object({
  label: z.string(),
  category: z.enum(["furniture","appliance","box","art","misc"]).default("misc"),
  confidence: z.number().min(0).max(1).default(0.5),
  quantity: z.number().int().positive().default(1),
  dimensions_cm: DimensionsCm,
  volume_m3: z.number().nonnegative().default(0),
  fragile: z.boolean().default(false),
  stackable: z.boolean().default(true),
  notes: z.string().nullable().optional(),
  bounding_boxes: z.array(BoundingBox).optional(),
  // Nouveaux champs pour l'emballage
  packaged_volume_m3: z.number().nonnegative().optional(),
  packaging_display: z.string().optional(),
  is_small_object: z.boolean().optional(),
  packaging_calculation_details: z.string().optional(),
  // Nouveaux champs pour la démontabilité
  dismountable: z.boolean().optional(),
  dismountable_confidence: z.number().min(0).max(1).optional(),
  dismountable_source: z.enum(['database', 'ai', 'hybrid', 'user']).optional(),
  // 🎯 SUPPRIMÉ : Plus de détection de doublons nécessaire
  // Nouveaux champs pour les analyses spécialisées
  detected_features: z.any().optional(), // Caractéristiques détectées (nb_chaises, nb_portes, nb_places, etc.)
  reasoning: z.string().optional(), // Raisonnement de l'IA
});

export const SpecialRules = z.object({
  autres_objets: z.object({
    present: z.boolean().default(false),
    listed_items: z.array(z.string()).default([]),
    volume_m3: z.number().nonnegative().default(0),
  }),
});

export const PhotoAnalysis = z.object({
  version: z.literal("1.0.0"),
  photo_id: z.string(),
  items: z.array(InventoryItem),
  totals: z.object({
    count_items: z.number().int().nonnegative(),
    volume_m3: z.number().nonnegative(),
  }),
  special_rules: SpecialRules.optional(),
  warnings: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
});

export type TPhotoAnalysis = z.infer<typeof PhotoAnalysis>;
export type TInventoryItem = z.infer<typeof InventoryItem>;
