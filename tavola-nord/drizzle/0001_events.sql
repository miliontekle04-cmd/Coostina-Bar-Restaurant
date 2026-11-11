CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'other' NOT NULL,
	"title_nb" text NOT NULL,
	"title_en" text NOT NULL,
	"description_nb" text DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"date" date NOT NULL,
	"start_time" text NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("date","start_time");