/** Secure media validation, Cloudinary upload, R2 upload and local development storage. */
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { db, ensureDb } from "@/lib/db/store";
import { config } from "@/lib/config";
import { ValidationError } from "@/lib/validation";
import { isoNow } from "@/lib/utils";
import { isR2Configured } from "@/lib/cloudflare";

const ALLOWED = {
  "image/jpeg": { ext: "jpg", kind: "image", max: 8 * 1024 * 1024 },
  "image/png": { ext: "png", kind: "image", max: 8 * 1024 * 1024 },
  "image/webp": { ext: "webp", kind: "image", max: 8 * 1024 * 1024 },
  "image/gif": { ext: "gif", kind: "image", max: 8 * 1024 * 1024 },
  "image/avif": { ext: "avif", kind: "image", max: 8 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", kind: "video", max: 50 * 1024 * 1024 },
  "application/pdf": { ext: "pdf", kind: "pdf", max: 25 * 1024 * 1024 },
};

function startsWith(buffer, bytes) {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

export function verifyMagicBytes(buffer, mime) {
  if (!buffer || buffer.length < 12) return false;
  switch (mime) {
    case "image/jpeg":
      return startsWith(buffer, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/gif":
      return (
        buffer.slice(0, 6).toString("ascii") === "GIF87a" ||
        buffer.slice(0, 6).toString("ascii") === "GIF89a"
      );
    case "image/webp":
      return (
        buffer.slice(0, 4).toString("ascii") === "RIFF" &&
        buffer.slice(8, 12).toString("ascii") === "WEBP"
      );
    case "image/avif":
      return (
        buffer.slice(4, 8).toString("ascii") === "ftyp" &&
        buffer.slice(8, 12).toString("ascii").startsWith("avif")
      );
    case "application/pdf":
      return buffer.slice(0, 4).toString("ascii") === "%PDF";
    case "video/mp4":
      return buffer.slice(4, 8).toString("ascii") === "ftyp";
    default:
      return false;
  }
}

function cloudinarySignature(params, secret) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${sorted}${secret}`).digest("hex");
}

async function uploadToCloudinary({ buffer, filename, mime, kind }) {
  const { cloudName, apiKey, apiSecret, folder } = config.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinarySignature({ folder, timestamp }, apiSecret);
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), filename);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${kind}/upload`;
  const response = await fetch(endpoint, { method: "POST", body: form });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(`[media] Cloudinary error ${response.status}: ${text.slice(0, 300)}`);
    throw new ValidationError("Media upload failed. Please try again.");
  }
  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
    provider: "cloudinary",
    width: data.width || null,
    height: data.height || null,
    format: data.format || "",
  };
}

async function uploadToR2({ buffer, filename, mime, kind }) {
  if (!isR2Configured()) return null;
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl } =
    config.cloudflare.r2;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  const key = `mictech/${kind}/${Date.now()}-${filename}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mime,
    }),
  );
  const url = publicUrl
    ? `${publicUrl}/${key}`
    : `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;
  return {
    url,
    publicId: key,
    provider: "r2",
    width: null,
    height: null,
    format: mime.split("/").pop() || "",
  };
}

async function uploadLocally({ buffer, ext }) {
  if (config.isProd) {
    throw new ValidationError(
      "Cloud media is not configured. Set Cloudinary credentials before uploading in production.",
    );
  }
  const directory = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(directory, { recursive: true });
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  await fs.writeFile(path.join(directory, name), buffer, { flag: "wx" });
  return {
    url: `/uploads/${name}`,
    publicId: `local/${name}`,
    provider: "local",
    width: null,
    height: null,
    format: ext,
  };
}

export async function saveUpload({ file, user }) {
  await ensureDb();
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new ValidationError("Choose a file to upload.");
  }
  const mime = String(file.type || "").toLowerCase();
  const spec = ALLOWED[mime];
  if (!spec) {
    throw new ValidationError(
      "Unsupported file type. Use JPG, PNG, WebP, AVIF, GIF, MP4 or PDF.",
    );
  }
  if (file.size > spec.max) {
    throw new ValidationError(
      `File is too large. Maximum size is ${Math.round(spec.max / 1024 / 1024)} MB.`,
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!verifyMagicBytes(buffer, mime)) {
    throw new ValidationError("The file content does not match its type.");
  }
  const safeName = String(file.name || "upload")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w-]+/g, "-")
    .slice(0, 80);
  const filename = `${safeName || "upload"}.${spec.ext}`;
  const kind = spec.kind === "image" ? "image" : spec.kind === "video" ? "video" : "raw";
  // Prefer R2, then Cloudinary, then local fallback.
  const stored =
    (await uploadToR2({ buffer, filename, mime, kind })) ||
    (await uploadToCloudinary({ buffer, filename, mime, kind })) ||
    (await uploadLocally({ buffer, ext: spec.ext }));
  const now = isoNow();
  const media = {
    _id: randomUUID(),
    url: stored.url,
    publicId: stored.publicId,
    provider: stored.provider,
    resourceType: spec.kind,
    mime,
    format: stored.format || spec.ext,
    bytes: buffer.length,
    width: stored.width,
    height: stored.height,
    originalName: String(file.name || filename).slice(0, 200),
    alt: "",
    caption: "",
    uploadedBy: user?._id || "",
    createdAt: now,
    updatedAt: now,
  };
  return db.collection("media").insertOne(media);
}

export async function listMedia({ page = 1, limit = 24, type = "", q = "" } = {}) {
  await ensureDb();
  const filter = {};
  if (type) filter.resourceType = type;
  if (q) {
    const escaped = String(q).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { originalName: { $regex: escaped, $options: "i" } },
      { alt: { $regex: escaped, $options: "i" } },
    ];
  }
  const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const [items, total] = await Promise.all([
    db.collection("media").find(filter, {
      sort: { createdAt: -1 },
      skip: (safePage - 1) * safeLimit,
      limit: safeLimit,
    }),
    db.collection("media").count(filter),
  ]);
  return { items, total, page: safePage, pages: Math.max(1, Math.ceil(total / safeLimit)) };
}

async function findUsage(url) {
  const articles = await db.collection("articles").find(
    { deletedAt: null },
    { projection: { title: 1, coverImage: 1, blocks: 1 }, limit: 5000 },
  );
  return articles.find((article) => JSON.stringify(article).includes(String(url))) || null;
}

export async function deleteMedia(id) {
  await ensureDb();
  const media = await db.collection("media").findOne({ _id: String(id) });
  if (!media) throw new ValidationError("Media not found.");
  const used = await findUsage(media.url);
  if (used) {
    throw new ValidationError(`This file is used in "${used.title}". Remove it there first.`);
  }
  if (media.provider === "cloudinary" && media.publicId) {
    const { cloudName, apiKey, apiSecret } = config.cloudinary;
    if (cloudName && apiKey && apiSecret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = cloudinarySignature({ public_id: media.publicId, timestamp }, apiSecret);
      const kind =
        media.resourceType === "image"
          ? "image"
          : media.resourceType === "video"
            ? "video"
            : "raw";
      await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${kind}/destroy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            public_id: media.publicId,
            timestamp: String(timestamp),
            api_key: apiKey,
            signature,
          }),
        },
      ).catch((error) => console.warn(`[media] Cloudinary delete failed: ${error?.message}`));
    }
  } else if (media.provider === "local" && media.url.startsWith("/uploads/")) {
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    const target = path.resolve(process.cwd(), "public", media.url.slice(1));
    if (target.startsWith(uploadsDir)) await fs.unlink(target).catch(() => {});
  }
  await db.collection("media").deleteOne({ _id: media._id });
  return true;
}
