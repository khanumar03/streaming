CREATE TYPE "public"."stream_type" AS ENUM('live', 'upload');--> statement-breakpoint
CREATE TABLE "stream" (
	"id" uuid NOT NULL,
	"type" "stream_type" DEFAULT 'upload' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stream" ADD CONSTRAINT "stream_id_media_id_fk" FOREIGN KEY ("id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;