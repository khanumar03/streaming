import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import path from "path";
import NodeMediaServer from "node-media-server";
import { eq } from "drizzle-orm";
import { nmsConfig } from "./default.js";
import { db } from "../db/index.js";
import { media, stream } from "../drizzle/index.js";

const nms = new NodeMediaServer(nmsConfig);

interface ActiveSession {
  process: ChildProcess;
  mediaId: string;
  out: string;
  size: number;
}

const activeProcesses = new Map<string, ActiveSession>();
const RTMP_PORT = nmsConfig?.rtmp?.port || 1935;

export function startLiveServer() {
  nms.run();

  nms.on("postPublish", async (session: any) => {
    const sessionId = session?.id;
    const streamPath = session?.streamPath;

    if (!sessionId || !streamPath) {
      console.error("[NMS ERROR]: Missing session ID or streamPath", {
        sessionId,
        streamPath,
      });
      if (typeof session.stop === "function") session.stop();
      return;
    }

    console.log(
      `[NMS] Publisher connected -> Stream: ${streamPath} | Session: ${sessionId}`,
    );

    const outDir = path.resolve(`./uploads/live/${sessionId}`);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const m3u8Path = path.join(outDir, "index.m3u8");
    const segmentPattern = path.join(outDir, "segment_%03d.ts");

    const clientPlaybackPath = `/uploads/live/${sessionId}/index.m3u8`;

    let newMediaId: string;

    try {
      const [insertedRecord] = await db
        .insert(media)
        .values({
          name: `live-${sessionId}-${streamPath.replace(/\//g, "-")}`,
          extension: "m3u8",
          path: clientPlaybackPath,
          mimeType: "application/vnd.apple.mpegurl",
          size: 0,
          status: "STREAMING",
        })
        .returning({ id: media.id });

      newMediaId = insertedRecord.id;

      await db.insert(stream).values({
        mediaId: newMediaId,
        type: "live",
      });
    } catch (dbErr) {
      console.error("[DB ERROR] Failed to create stream record:", dbErr);
      return;
    }

    const rtmpUrl = `rtmp://127.0.0.1:${RTMP_PORT}${streamPath}`;

    setTimeout(() => {
      const ffmpegProc = spawn("ffmpeg", [
        "-re",  
        "-fflags", "+genpts+nobuffer",
        "-i",
        rtmpUrl,
        "-progress",
        "pipe:1",
        "-c:v",
        "copy",
        "-preset",
        "ultrafast",
        "-tune",
        "zerolatency",
        "-g",
        "30",
        "-keyint_min",
        "30",
        "-sc_threshold",
        "0",
        "-c:a",
        "aac",
        "-f",
        "hls",
        "-hls_time",
        "1",
        "-hls_list_size",
        "3",
        "-hls_flags",
        "delete_segments+omit_endlist+split_by_time",
        "-hls_segment_filename",
        segmentPattern,
        m3u8Path,
      ]);

      activeProcesses.set(sessionId, {
        process: ffmpegProc,
        mediaId: newMediaId,
        out: outDir,
        size: 0,
      });

      // ffmpegProc.stdout.on("data", (chunk: Buffer) => {
      // });

      ffmpegProc.stderr.on("data", (data: Buffer) => {
       console.log(`[FFmpeg ${sessionId}]:`, data.toString());
      });

      ffmpegProc.on("error", (err) => {
        console.error(`[FFmpeg ${sessionId} Error]:`, err);
      });

      ffmpegProc.on("close", (code) => {
        console.log(
          `[FFmpeg] Session ${sessionId} process closed with code ${code}`,
        );
        activeProcesses.delete(sessionId);
      });
    }, 300);
  });

  nms.on("donePublish", async (session: any) => {
    const sessionId = session?.id;
    if (!sessionId) return;
    console.log(`[NMS] Stream went offline for Session: ${sessionId}`);

    const sessionData = activeProcesses.get(sessionId);

    if (sessionData) {
      let totalDiskBytes = 0;
      try {
        if (fs.existsSync(sessionData.out)) {
          const files = fs.readdirSync(sessionData.out);
          totalDiskBytes = files.reduce((acc, file) => {
            const stats = fs.statSync(path.join(sessionData.out, file));
            return acc + stats.size;
          }, 0);
        }
      } catch (fsErr) {
        console.error(`[FS ERROR] Could not calculate folder size:`, fsErr);
      }

      try {
        await db
          .update(media)
          .set({
            size: totalDiskBytes,
            status: "ACTIVE",
            updatedAt: new Date(),
          })
          .where(eq(media.id, sessionData.mediaId));
      } catch (dbErr) {
        console.error(
          `[DB ERROR] Failed to finalize media ${sessionData.mediaId}:`,
          dbErr,
        );
      }

      sessionData.process.kill("SIGTERM");
      activeProcesses.delete(sessionId);
    }
  });

  nms.on("doneConnect", (session: any) => {
    console.log("[NMS]: Client connected:", session?.id || session);
  });

  nms.on("log", (msg: any) => {
    // console.log("[NMS LOG]:", msg);
  });
}
