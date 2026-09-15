import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const MAX_BYTES = 4 * 1024 * 1024;

export async function saveUpload(file: File, folder: string) {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new Error("Envie JPEG, PNG, WebP ou PDF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("O arquivo deve ter no máximo 4 MB.");
  }
  const directory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(directory, { recursive: true });
  const filename = `${randomBytes(12).toString("hex")}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(directory, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}
