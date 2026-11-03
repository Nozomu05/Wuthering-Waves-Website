import { readFileSync } from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join(__dirname, "..", "cache");

export function loadCache<T>(fileName: string): T {
  const filePath = path.join(CACHE_DIR, fileName);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}
