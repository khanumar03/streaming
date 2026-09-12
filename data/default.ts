import { Media_Resolution_Profiles } from "../types/resolution.profiles.js";

export const RESOLUTION_PROFILES: Media_Resolution_Profiles[] = [
  {
    name: "240p",
    width: 426,
    height: 240,
    videoBitrate: "400k",
    audioBitrate: "64k",
  },
  {
    name: "360p",
    width: 640,
    height: 360,
    videoBitrate: "800k",
    audioBitrate: "96k",
  },
  {
    name: "480p",
    width: 854,
    height: 480,
    videoBitrate: "1400k",
    audioBitrate: "128k",
  },
  {
    name: "720p",
    width: 1280,
    height: 720,
    videoBitrate: "2800k",
    audioBitrate: "128k",
  },
  {
    name: "1080p",
    width: 1920,
    height: 1080,
    videoBitrate: "5000k",
    audioBitrate: "192k",
  },
  {
    name: "4k",
    width: 3840,
    height: 2160,
    videoBitrate: "14000k",
    audioBitrate: "320k",
  },
];
