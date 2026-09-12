import { Request, Response } from "express";
import { MediaService } from "../../services/media/media.service.js";
import { isUUID } from "../../utils/index.js";
import { treeifyError } from "zod";
import { MediaTranscoderService } from "../../services/media-transcoder/media-transcoder.service.js";
import { tq } from "../../workers/transcoder.queue.js";

export class MediaController {
  public static async get(req: Request, res: Response) {
    try {
      const _media_ = await MediaService.get();
      res.status(200).json({ message: "", data: _media_ });
      return;
    } catch (error) {
      console.error("MEDIA_API_GET_ERROR:", error);
      res
        .status(500)
        .json({ error: "something went wrong, failed to fetch data" });
    }
  }

  public static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validation = isUUID.safeParse(id);
      if (validation.error) {
        return res
          .status(400)
          .json({ message: treeifyError(validation.error) });
      }

      const _media_ = await MediaService.getById(id as string);

      if (!_media_) {
        res.status(404).json({ message: `media not found for id: ${id}` });
        return;
      }
      res.status(200).json({ message: "", data: _media_ });
    } catch (error) {
      console.error("MEDIA_API_GET_ERROR:", error);
      res
        .status(500)
        .json({ error: "something went wrong, failed to fetch media" });
    }
  }

  public static async upload(req: Request, res: Response): Promise<void> {
    try {
      const metadata = await MediaService.create(req);

      // MediaTranscoderService.transcode(metadata._stream.id).catch((reason) =>
      //   console.log(reason),
      // );

      tq.add("transcode-hls", { id: metadata._stream.id } );

      res.status(201).json({
        message: "media uploaded successfully",
        data: metadata,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({
        error: "Failed to process media stream",
      });
    }
  }

  public static async stream(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: "media id parameter is required" });
        return;
      }

      const data = await MediaService.stream(req, id as string);

      if (data.isPartial) {
        res.status(206).set({
          "Content-Range": data.contentRange,
          "Accept-Ranges": "bytes",
          "Content-Length": data.contentLength,
          "Content-Type": data.contentType,
        });
      } else {
        res.status(200).set({
          "Content-Length": data.contentLength,
          "Content-Type": data.contentType,
        });
      }

      data.stream.pipe(res);
    } catch (error: any) {
      console.error("Streaming Error:", error);
      if (error.message) {
        res.status(error.cause?.status || 404).json({ error: error?.message || "" });
        return;
      }

      res.status(500).json({ error: "Failed to stream video" });
    }
  }
}
