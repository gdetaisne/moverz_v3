import { CATALOG } from "./catalog";

export function normalizeLabel(label: string) {
  return label.trim().toLowerCase();
}

export function mapToCatalog(label: string) {
  const n = normalizeLabel(label);
  for (const row of CATALOG) {
    if (row.aliases.some(a => normalizeLabel(a) === n || n.includes(normalizeLabel(a)))) {
      return row;
    }
  }
  return undefined;
}

export function volumeFromDims(length?:number|null,width?:number|null,height?:number|null) {
  if (!length || !width || !height) return 0;
  return (length*width*height)/1_000_000;
}
