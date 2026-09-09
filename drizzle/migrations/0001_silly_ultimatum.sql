ALTER TABLE "media" RENAME COLUMN "filename" TO "name";--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;