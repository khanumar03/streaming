import { Job, Worker } from "bullmq";
import { db } from "../db/index.js";
import { media, stream } from "../drizzle/index.js";
import { and, eq, exists, sql } from "drizzle-orm";
import { ITranscoderJobs } from "./types.js";
import { MediaTranscoderService } from "../services/media-transcoder/media-transcoder.service.js";

const tw = new Worker<ITranscoderJobs>(
  "video-transcoding",
  async (job) => {
    const { id } = job.data;
    await db
      .update(media)
      .set({ status: "PROCESSING" })
      .where(
        exists(
          db
            .select({ one: sql`1` })
            .from(stream)
            .where(
              and(eq(stream.id, job.data.id), eq(stream.mediaId, media.id)),
            ),
        ),
      );
    return await MediaTranscoderService.transcode(id);
  },
  {
    connection: {
      host: "localhost",
      port: 6378,
    },
    concurrency: 3,
  },
);

tw.on("failed", async (job, err) => {
  if (!job) return;
  console.error(`worker-error Job ${job.id} failed:`, err.message);

  await db
    .update(media)
    .set({ status: "FAILED" })
    .where(
      exists(
        db
          .select({ one: sql`1` })
          .from(stream)
          .where(and(eq(stream.id, job.data.id), eq(stream.mediaId, media.id))),
      ),
    );
});

tw.on("completed", async (job) => {
  if (!job) return;
  console.error(`worker job completed: `, job.id);
  await db
    .update(media)
    .set({ status: "ACTIVE" })
    .where(
      exists(
        db
          .select({ one: sql`1` })
          .from(stream)
          .where(and(eq(stream.id, job.data.id), eq(stream.mediaId, media.id))),
      ),
    );
});
