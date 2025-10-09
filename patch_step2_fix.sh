#!/usr/bin/env bash
set -euo pipefail

# Petite aide pour les chemins
ROOT="$(pwd)"
WEB="apps/web"

echo "→ Patch UI Step2 (photos + inventaire)…"

mkdir -p "$WEB/lib" "$WEB/components"

# 1) Utilitaire d'URL: toAbsoluteApiUrl + resolvePhotoSrc
cat > "$WEB/lib/imageUrl.ts" <<'TS'
/**
 * Résout l'URL finale d'une image selon les champs possibles.
 * - Ne dépend pas de Next/Image (utilise <img> simple pour éviter les soucis de domaines).
 * - N'altère pas l'architecture existante (LOTS 5-18).
 */
export function toAbsoluteApiUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  // Déjà absolu
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  // URL base côté client
  const base =
    (typeof window !== "undefined" && window.location?.origin) ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001";

  // Normalisation /api/uploads vs /uploads
  if (pathOrUrl.startsWith("/uploads/")) {
    const filename = pathOrUrl.split("/").pop();
    return `${base}/api/uploads/${filename}`;
  }
  if (pathOrUrl.startsWith("/api/")) {
    return `${base}${pathOrUrl}`;
  }
  // Chemins relatifs divers
  if (!pathOrUrl.startsWith("/")) {
    return `${base}/${pathOrUrl}`;
  }
  return `${base}${pathOrUrl}`;
}

type AnyPhoto = {
  id?: string;
  photoId?: string;
  url?: string;
  fileUrl?: string;
  filePath?: string;
  file?: File;
};

/**
 * Résout la meilleure source d'image pour une photo.
 * - Priorité: blob File (upload récent) > url/fileUrl > filePath > id/photoId
 * - Retourne toujours une chaîne (absolue) quand c'est possible
 */
export function resolvePhotoSrc(p: AnyPhoto): string | null {
  if (!p) return null;

  // 1) Upload immédiat (blob)
  if (typeof window !== "undefined" && p.file instanceof File) {
    try {
      return URL.createObjectURL(p.file);
    } catch {
      /* noop */
    }
  }

  // 2) url / fileUrl (peuvent être absolues ou relatives)
  const direct = p.url || p.fileUrl;
  const directAbs = toAbsoluteApiUrl(direct);
  if (directAbs) return directAbs;

  // 3) filePath (/uploads/{id}.jpeg ou /api/uploads/{id}.jpeg)
  const viaPath = toAbsoluteApiUrl(p.filePath);
  if (viaPath) return viaPath;

  // 4) id -> /api/uploads/{id}.jpeg
  const id = p.photoId || p.id;
  if (id) {
    return toAbsoluteApiUrl(`/api/uploads/${id}.jpeg`);
  }

  return null;
}
TS

# 2) PhotoCard.tsx — force <img> simple + onError visible
cat > "$WEB/components/PhotoCard.tsx" <<'TSX'
"use client";
import * as React from "react";
import { resolvePhotoSrc, toAbsoluteApiUrl } from "@/lib/imageUrl";

type PhotoLike = {
  id?: string;
  photoId?: string;
  url?: string;
  fileUrl?: string;
  filePath?: string;
  file?: File;
  roomType?: string | null;
  analysis?: any;
};

type Props = { photo: PhotoLike; className?: string };

export default function PhotoCard({ photo, className }: Props) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const s = resolvePhotoSrc(photo);
    setSrc(s);
  }, [photo]);

  const final = toAbsoluteApiUrl(src || "");

  return (
    <div className={className ?? ""} style={{ position: "relative", width: "100%", height: 220, borderRadius: 12, overflow: "hidden", background: "#0b0b0b" }}>
      {final && !error ? (
        <img
          src={final}
          alt={photo?.roomType || "photo"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={() => {
            setError("load-failed");
            // Affiche clairement l'URL testée
            // eslint-disable-next-line no-console
            console.warn("[PhotoCard] image load failed:", final, { photo });
          }}
        />
      ) : (
        <div style={{ color: "#aaa", fontSize: 12, display: "grid", placeItems: "center", width: "100%", height: "100%" }}>
          {error ? "Image indisponible" : "Chargement…"}
        </div>
      )}
    </div>
  );
}
TSX

# 3) PhotoThumbnail.tsx (même logique de fallback simple)
cat > "$WEB/components/PhotoThumbnail.tsx" <<'TSX'
"use client";
import * as React from "react";
import { resolvePhotoSrc, toAbsoluteApiUrl } from "@/lib/imageUrl";

export default function PhotoThumbnail({ photo, size = 72 }: { photo: any; size?: number }) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [err, setErr] = React.useState(false);

  React.useEffect(() => {
    setSrc(resolvePhotoSrc(photo));
  }, [photo]);

  const final = toAbsoluteApiUrl(src || "");

  return (
    <div style={{ width: size, height: size, borderRadius: 8, overflow: "hidden", background: "#111" }}>
      {final && !err ? (
        <img
          src={final}
          alt="thumb"
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => {
            setErr(true);
            // eslint-disable-next-line no-console
            console.warn("[PhotoThumbnail] image load failed", final, { photo });
          }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#888", fontSize: 10 }}>—</div>
      )}
    </div>
  );
}
TSX

# 4) RoomInventoryCard.tsx — mapping robuste des items + volume
cat > "$WEB/components/RoomInventoryCard.tsx" <<'TSX'
"use client";

import * as React from "react";

type PhotoLike = {
  id?: string;
  roomType?: string | null;
  analysis?: any;
};

function getItems(analysis: any): any[] {
  if (!analysis) return [];
  if (Array.isArray(analysis.items)) return analysis.items;
  if (analysis.data && Array.isArray(analysis.data.items)) return analysis.data.items;
  return [];
}

function getItemLabel(it: any): string {
  return it?.label || it?.name || "Objet";
}

function getItemVolume(it: any): number | null {
  // Supporte différents schémas: volume_m3, volume, volumeM3
  const v = it?.volume_m3 ?? it?.volume ?? it?.volumeM3;
  return typeof v === "number" ? v : null;
}

export default function RoomInventoryCard({ photo }: { photo: PhotoLike }) {
  const items = getItems(photo?.analysis);
  const volumes = items.map(getItemVolume).filter((v) => typeof v === "number") as number[];
  const total = volumes.reduce((acc, v) => acc + v, 0);

  return (
    <div style={{ border: "1px solid #222", borderRadius: 12, padding: 12, background: "#0b0b0b" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ color: "#d1d5db", fontSize: 14, fontWeight: 600 }}>
          {photo?.roomType || "Pièce"}
        </div>
        <div style={{ color: "#9ca3af", fontSize: 12 }}>Objets: {items.length} — Volume: {total.toFixed(2)} m³</div>
      </div>
      {items.length === 0 ? (
        <div style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic" }}>Aucun objet détecté</div>
      ) : (
        <ul style={{ display: "grid", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((it, idx) => {
            const v = getItemVolume(it);
            return (
              <li key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", padding: "8px 10px", borderRadius: 8 }}>
                <span style={{ color: "#e5e7eb" }}>{getItemLabel(it)}</span>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>{v == null ? "—" : `${v.toFixed(2)} m³`}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
TSX

# 5) (Optionnel) Petit test vite-fait en Node pour vérifier l'endpoint image
mkdir -p scripts
cat > scripts/probe-image.js <<'JS'
import http from "node:http";

const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const id = process.argv[2];
if (!id) {
  console.log("Usage: node scripts/probe-image.js <photoIdOrFilename>");
  process.exit(1);
}
const url = id.endsWith(".jpeg") ? `${base}/api/uploads/${id}` : `${base}/api/uploads/${id}.jpeg`;

http.get(url, (res) => {
  console.log("GET", url, "→", res.statusCode, res.headers["content-type"]);
}).on("error", (e) => {
  console.error("Request failed:", e.message);
});
JS

echo "✔ Fichiers écrits."
echo "→ Maintenant :"
echo "   1) pnpm dev"
echo "   2) Rafraîchir l'étape 2 : les photos doivent s'afficher (plus de vignettes noires)"
echo "   3) Les objets listés s'affichent; volume s'affiche quand présent (sinon —)"
