import z from "zod"
import { mediaInsertSchema, mediaSchema } from "./schema.js";

export type Media = z.infer<typeof mediaSchema>
export type MediaInsertSchema = z.infer<typeof mediaInsertSchema>
