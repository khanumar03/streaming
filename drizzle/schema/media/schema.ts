import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const mediaStatusEnum = pgEnum("media_status", [
  "PROCESSING",
  "ACTIVE",
  "FAILED",
  "STREAMING"
]);

export const streamTypeEnum = pgEnum("stream_type", ["live", "upload"]);

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  extension: text("extension").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  status: mediaStatusEnum("status").default("PROCESSING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stream = pgTable("stream", {
  id: uuid("id").defaultRandom().primaryKey(),
  mediaId: uuid("media_id")
    .references(() => media.id)
    .notNull(),
  type: streamTypeEnum("type").default("upload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
