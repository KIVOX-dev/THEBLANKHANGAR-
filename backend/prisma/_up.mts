import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { putB2Object, getB2Object } from "../src/storage";
const root = join(process.cwd(), "public", "uploads");
const types: Record<string,string> = {".svg":"image/svg+xml",".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp"};
let n=0;
for (const sub of ["seed","photos","products"]) {
  let files: string[] = []; try { files = readdirSync(join(root, sub)); } catch {}
  for (const f of files) { const t = types[extname(f).toLowerCase()]; if(!t) continue; await putB2Object(`${sub}/${f}`, readFileSync(join(root,sub,f)), t); n++; }
}
console.log("uploaded", n);
console.log("verify", !!(await getB2Object("photos/hero-essentials.jpg")));
