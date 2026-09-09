import fs from "fs"

export interface StreamInfo {
  stream: fs.ReadStream;
  contentLength: number;
  contentRange?: string;
  contentType: string;
  isPartial: boolean;
  fileSize: number;
}