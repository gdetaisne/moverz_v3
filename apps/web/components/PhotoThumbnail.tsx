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
