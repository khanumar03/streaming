import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { media } from "../../../drizzle/schema/media/schema.js";

export const mediaSchema = createSelectSchema(media)
export const mediaInsertSchema = createInsertSchema(media).omit({id: true, updatedAt: true, createdAt: true})