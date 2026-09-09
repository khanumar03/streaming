import { Queue } from "bullmq";
import { ITranscoderJobs } from "./types.js";


export const tq = new Queue<ITranscoderJobs>("video-transcoding", {
  connection: {
    host: "localhost",
    port: 6378,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
  },
});
