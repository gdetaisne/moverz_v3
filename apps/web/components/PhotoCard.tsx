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
