CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "closed_dates" (
	"date" date PRIMARY KEY NOT NULL,
	"reason" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"guests" integer NOT NULL,
	"date" date NOT NULL,
	"time" text,
	"allocations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_total_nok" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"company_invoice" boolean DEFAULT false NOT NULL,
	"company_name" text DEFAULT '' NOT NULL,
	"org_number" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"locale" text DEFAULT 'nb' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enquiries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "event_menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_nb" text NOT NULL,
	"name_en" text NOT NULL,
	"price_nok" integer NOT NULL,
	"starter" text NOT NULL,
	"main" text NOT NULL,
	"dessert" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"description_nb" text DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"price_nok" integer NOT NULL,
	"allergens" text[] DEFAULT '{}'::text[] NOT NULL,
	"vegetarian" boolean DEFAULT false NOT NULL,
	"gluten_free" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"art" text DEFAULT 'antipasti' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"manage_token_hash" text NOT NULL,
	"date" date NOT NULL,
	"time" text NOT NULL,
	"guests" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"locale" text DEFAULT 'nb' NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_code_unique" UNIQUE("code"),
	CONSTRAINT "reservations_manage_token_hash_unique" UNIQUE("manage_token_hash")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category","sort");--> statement-breakpoint
CREATE INDEX "reservations_date_idx" ON "reservations" USING btree ("date","time");