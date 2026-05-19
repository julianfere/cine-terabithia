CREATE TABLE "attendances" (
	"id" serial PRIMARY KEY NOT NULL,
	"screening_id" integer,
	"user_id" integer NOT NULL,
	"created_at" bigint,
	CONSTRAINT "attendances_screening_id_user_id_unique" UNIQUE("screening_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_id" integer,
	"title" text NOT NULL,
	"original_title" text,
	"year" integer,
	"director" text,
	"poster_path" text,
	"synopsis" text,
	"poster_hue" integer DEFAULT 200,
	"duration" integer,
	"genre" text,
	"created_at" bigint,
	CONSTRAINT "movies_tmdb_id_unique" UNIQUE("tmdb_id")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text DEFAULT '/' NOT NULL,
	"sent_by_user_id" integer,
	"recipient_type" text DEFAULT 'all' NOT NULL,
	"recipient_user_ids" text,
	"sent" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"sent_at" bigint
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" bigint,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "recommendation_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"recommendation_id" integer,
	"user_id" integer NOT NULL,
	"created_at" bigint,
	CONSTRAINT "recommendation_votes_recommendation_id_user_id_unique" UNIQUE("recommendation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_id" integer NOT NULL,
	"suggested_by_id" integer NOT NULL,
	"reason" text,
	"featured" boolean DEFAULT false,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"screening_id" integer,
	"user_id" integer NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" bigint,
	CONSTRAINT "scores_screening_id_user_id_unique" UNIQUE("screening_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "screening_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"screening_id" integer,
	"recommendation_id" integer,
	"user_id" integer NOT NULL,
	"created_at" bigint,
	CONSTRAINT "screening_votes_screening_id_user_id_unique" UNIQUE("screening_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "screenings" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_id" integer,
	"scheduled_date" text NOT NULL,
	"hour" text,
	"notes" text,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"snack" text,
	"location" text,
	"curated_by" text,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"display_name" text,
	"avatar" text,
	"created_at" bigint,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_screening_id_screenings_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_sent_by_user_id_users_id_fk" FOREIGN KEY ("sent_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_votes" ADD CONSTRAINT "recommendation_votes_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_votes" ADD CONSTRAINT "recommendation_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_suggested_by_id_users_id_fk" FOREIGN KEY ("suggested_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_screening_id_screenings_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_votes" ADD CONSTRAINT "screening_votes_screening_id_screenings_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screenings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_votes" ADD CONSTRAINT "screening_votes_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_votes" ADD CONSTRAINT "screening_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE no action ON UPDATE no action;