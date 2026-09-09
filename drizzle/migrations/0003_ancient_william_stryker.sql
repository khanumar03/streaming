CREATE TYPE "public"."media_status" AS ENUM('PROCESSING', 'ACTIVE', 'FAILED');--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "status" "media_status" DEFAULT 'PROCESSING' NOT NULL;