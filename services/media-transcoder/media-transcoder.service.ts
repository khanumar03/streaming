import path from "node:path";
import fs from "node:fs/promises";
import ffmpeg from "fluent-ffmpeg";
import { MediaService } from "../media/media.service.js";
import { Media_Resolution_Profiles } from "../../types/resolution.profiles.js";
import { RESOLUTION_PROFILES } from "../../data/default.js";

export class MediaTranscoderService {
  private static async transcodeToHLS(
    mediaId: string,
    profile: Media_Resolution_Profiles,
  ): Promise<string> {
    const _media = await MediaService.getById(mediaId);
    if (!_media) throw new Error("MEDIA_NOT_FOUND", { cause: { status: 404 } });

    const fileId = path.parse(_media.media!.path).name;

    const inputPath = path.resolve("uploads", _media.media!.path);
    const targetFolder = path.resolve("uploads", "hls", fileId, profile.name);

    await fs.mkdir(targetFolder, { recursive: true });

    const playlistPath = path.join(targetFolder, "index.m3u8");
    const segmentFilename = path.join(targetFolder, "segment_%03d.ts");

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf scale='min(${profile.width}\\,iw)':-2`,
          `-c:v libx264`,
          `-b:v ${profile.videoBitrate}`,
          `-c:a aac`,
          `-b:a ${profile.audioBitrate}`,
          `-hls_time 6`,
          `-hls_playlist_type vod`,
          `-hls_segment_filename ${segmentFilename}`,
        ])
        .output(playlistPath)
        .on("start", (commandLine) => {
          console.log(`[FFmpeg Start ${profile.name}]: ${commandLine}`);
        })
        .on("progress", (progress) => {
          console.log(
            `[FFmpeg Processing ${profile.name}]: ${Math.round(progress.percent || 0)}% done`,
          );
        })
        .on("end", () => {
          console.log(`[FFmpeg Done]: Transcoded ${profile.name}`);
          resolve(playlistPath);
        })
        .on("error", (err) => {
          console.error(`[FFmpeg Error ${profile.name}]:`, err);
          reject(err);
        })
        .run();
    });
  }

  public static async transcode(mediaId: string) {
    try {
      for (const profile of RESOLUTION_PROFILES) {
        await this.transcodeToHLS(mediaId, profile);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }
}
