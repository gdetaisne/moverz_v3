import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const ROOT = path.resolve(process.cwd(), "uploads");
export function ensureRoot(){ if(!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true }); }

export async function saveLocalFile(file: File){
  ensureRoot();
  const id = randomUUID();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const p = path.join(ROOT, `${id}.${ext}`);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(p, buf);
  return { id, path: p, url: `/uploads/${id}.${ext}` };
}
