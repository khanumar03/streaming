import NodeMediaServer from "node-media-server";
import path from "node:path";

export type NMSConfig = ConstructorParameters<typeof NodeMediaServer>[number]

export const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 8 * 1024 * 1024,
    gop_cache: true, 
    ping: 15,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    allow_origin: "*",
    mediaroot: "./uploads/live"
  }
} as const satisfies NMSConfig
