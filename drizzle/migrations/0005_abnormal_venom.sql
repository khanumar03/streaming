ALTER TYPE "public"."media_status" ADD VALUE 'STREAMING';--> statement-breakpoint
ALTER TABLE "stream" DROP CONSTRAINT "stream_id_media_id_fk";
--> statement-breakpoint
ALTER TABLE "stream" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "stream" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "stream" ADD COLUMN "media_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "stream" ADD CONSTRAINT "stream_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE no action ON UPDATE no action;