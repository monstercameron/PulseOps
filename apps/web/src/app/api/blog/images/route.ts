import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const GALLERY_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "blog");

export async function GET(): Promise<NextResponse> {
  let files: string[];
  try {
    files = await readdir(UPLOAD_DIR);
  } catch {
    return NextResponse.json({ images: [] });
  }
  const images = files
    .filter((f) => GALLERY_EXTENSIONS.has(extname(f).toLowerCase()))
    .sort()
    .reverse()
    .map((filename) => ({ filename, url: `/uploads/blog/${filename}` }));
  return NextResponse.json({ images });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file provided" }, { status: 400 });
  }

  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File type not allowed. Use JPEG, PNG, GIF, or WebP." },
      { status: 400 },
    );
  }

  // Read into buffer so we can check size before writing
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 413 });
  }

  // Generate a safe filename — never use user-supplied name as path component
  const ext = EXT_MAP[file.type] ?? "jpg";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({ url: `/uploads/blog/${filename}` });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || typeof (body as Record<string, unknown>)["filename"] !== "string") {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const filename = (body as Record<string, unknown>)["filename"] as string;

  // Reject any path traversal or leading dots — only allow plain filenames with known extensions
  const safe = basename(filename);
  if (
    safe !== filename ||
    safe.startsWith(".") ||
    !GALLERY_EXTENSIONS.has(extname(safe).toLowerCase())
  ) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const target = join(UPLOAD_DIR, safe);

  try {
    await rm(target);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
