/* node scripts/step2-quick-check.mjs
 * Prints first project's rooms with photos -> resolved upload URL guess + item counts/volumes
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function j(url, init) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

function toUploadUrl(p) {
  if (p?.url?.startsWith('/')) return new URL(p.url, api).toString();
  if (p?.url?.startsWith('http')) return p.url;
  if (p?.filePath) {
    const filename = p.filePath.split('/').pop();
    return `${api}/api/uploads/${filename}`;
  }
  const id = p.photoId || p.id;
  return id ? `${api}/api/uploads/${id}.jpeg` : '';
}

function getItems(a) {
  if (!a) return [];
  if (Array.isArray(a)) return a;
  if (Array.isArray(a.items)) return a.items;
  return [];
}

(async () => {
  const rooms = await j(`${api}/api/room-groups?user=temp-user`);
  console.log('rooms:', rooms?.length);
  for (const r of rooms || []) {
    const photos = r.photos || [];
    const items = photos.flatMap((p) => getItems(p.analysis));
    const vol = items.reduce((acc, it) => acc + (it.volume_m3 ?? it.volume ?? 0), 0);
    console.log(`- ${r.name}: photos=${photos.length} items=${items.length} vol=${vol.toFixed(2)} m3`);
    const first = photos[0];
    if (first) console.log('  firstPhotoURLGuess:', toUploadUrl(first));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

