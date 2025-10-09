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
