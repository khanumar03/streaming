import fs from "fs";
import path from "path";
import { Request } from "express";
import { UPLOAD_DIR } from "../../utils/file.utils.js";
import { StreamInfo } from "./types.js";
import { Media, MediaInsertSchema } from "../../types/db/media/types.js";
import { db } from "../../db/index.js";
import { media, stream } from "../../drizzle/schema/media/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export class MediaService {
  public static async create(req: Request) {
    let metadata: MediaInsertSchema | undefined = undefined;
    try {
      metadata = await this.save(req);
      if (!metadata) throw new Error("MEDIA_META_DATA_NOT_RECEIVED");

      const data = await db.transaction(async (tx) => {
        const [_media] = await tx
          .insert(media)
          .values({
            size: metadata!.size,
            extension: metadata!.extension,
            mimeType: metadata!.mimeType,
            name: metadata!.name,
            path: metadata!.path,
            status: metadata!.status,
          })
          .returning();

        const [_stream] = await tx
          .insert(stream)
          .values({
            mediaId: _media.id,
            type: "upload",
          })
          .returning();
        return { _media, _stream };
      });
      return data;
    } catch (error) {
      if (metadata && fs.existsSync(path.join(UPLOAD_DIR, metadata.path)))
        fs.unlinkSync(path.join(UPLOAD_DIR, metadata.path));
      throw error;
    }
  }

  public static async get() {
    const _media = await db
      .select()
      .from(stream)
      .leftJoin(media, eq(stream.mediaId, media.id));
    return _media;
  }

  public static async getById(id: string) {
    const [_media] = await db
      .select()
      .from(stream)
      .leftJoin(media, eq(stream.mediaId, media.id))
      .where(eq(stream.id, id));

    return _media ?? null;
  }
  private static save(req: Request): Promise<MediaInsertSchema> {
    const T: Promise<MediaInsertSchema> = new Promise((resolve, reject) => {
      const rawName =
        (req.headers["x-file-name"] as string) || "unknown_media.mp4";
      const name = path.basename(rawName);

      const extension = path.extname(name).toLowerCase() || ".mp4";

      const mimeType =
        (req.headers["content-type"] as string) ||
        `video/${extension.replace(".", "")}`;

      const mediaId = crypto.randomUUID();
      const _path = `${mediaId}${extension}`;
      const filePath = path.join(UPLOAD_DIR, _path);

      const writeStream = fs.createWriteStream(filePath);
      let bytesReceived = 0;

      req.on("data", (chunk: Buffer) => {
        bytesReceived += chunk.length;
      });

      req.pipe(writeStream);

      writeStream.on("finish", () => {
        const metadata: MediaInsertSchema = {
          name,
          path: _path,
          extension,
          mimeType,
          size: bytesReceived,
        };

        resolve(metadata);
      });

      writeStream.on("error", (error) => {
        reject(error);
      });

      req.on("error", (error) => {
        writeStream.destroy();
        reject(error);
      });
    });
    return T;
  }

  public static async stream(req: Request, id: string): Promise<StreamInfo> {
  const _media = await this.getById(id);
  if (!_media) {
    throw new Error("metadata_not_found", { cause: { status: 404 } });
  }

  // 1. Extract the wildcard parameter (handles array or string formats safely)
  const rawParam = req.params[0] || (req.params as any).path;
  
  // 2. Normalize to a plain string path
  const relativePath = Array.isArray(rawParam) 
    ? rawParam.join("/") 
    : String(rawParam || "");

  if (!relativePath) {
    throw new Error("file_path_required", { cause: { status: 400 } });
  }

  const fileId = path.parse(_media.media!.path).name;
  
  // 3. Now path.join safely receives plain strings
  const filePath = path.join(
    UPLOAD_DIR,
    "hls",
    fileId,
    relativePath
  );

  if (!fs.existsSync(filePath)) {
    throw new Error("media_not_found", { cause: { status: 404 } });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  let contentType = "application/octet-stream";
  if (relativePath.endsWith(".m3u8")) {
    contentType = "application/vnd.apple.mpegurl";
  } else if (relativePath.endsWith(".ts")) {
    contentType = "video/MP2T";
  }

  return {
    stream: fs.createReadStream(filePath),
    contentLength: fileSize,
    contentType,
    isPartial: false,
    fileSize,
  };
}
}
