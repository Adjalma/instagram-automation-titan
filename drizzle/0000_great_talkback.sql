CREATE TYPE "public"."accountType" AS ENUM('personal', 'business');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('ativo', 'em_desenvolvimento', 'em_breve');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('servico', 'projeto');--> statement-breakpoint
CREATE TYPE "public"."log_status" AS ENUM('success', 'failed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('instagram', 'linkedin', 'facebook', 'tiktok', 'youtube');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'pending', 'approved', 'scheduled', 'published', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."research_run_status" AS ENUM('success', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tone" AS ENUM('personal', 'corporate');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"url" text NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"mimeType" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_themes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_themes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"description" text,
	"icon" varchar(64),
	"color" varchar(32),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_themes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "instagram_accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "instagram_accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"handle" varchar(128) NOT NULL,
	"displayName" varchar(256) NOT NULL,
	"platform" "platform" DEFAULT 'instagram' NOT NULL,
	"accountType" "accountType" NOT NULL,
	"tone" "tone" NOT NULL,
	"avatarUrl" text,
	"bio" text,
	"profileUrl" text,
	"accessToken" text,
	"tokenExpiresAt" timestamp,
	"linkedinUrn" varchar(256),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "instagram_accounts_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "post_media" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "post_media_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"postId" integer NOT NULL,
	"mediaUrl" text NOT NULL,
	"media_type" "media_type" DEFAULT 'image' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"accountId" integer NOT NULL,
	"caption" text,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"theme" text,
	"scheduledAt" timestamp,
	"publishedAt" timestamp,
	"instagramPostId" varchar(256),
	"instagramPermalink" text,
	"mcpPending" integer DEFAULT 0 NOT NULL,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"nextRetryAt" timestamp,
	"linkedinPublished" integer DEFAULT 0 NOT NULL,
	"facebookPublished" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publication_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "publication_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"postId" integer NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"log_status" "log_status" NOT NULL,
	"instagramPostId" varchar(256),
	"permalink" text,
	"error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "research_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"topicId" integer NOT NULL,
	"postId" integer,
	"headlines" text,
	"research_run_status" "research_run_status" NOT NULL,
	"error" text,
	"ranAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_topics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "research_topics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"accountId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"query" varchar(512) NOT NULL,
	"language" varchar(8) DEFAULT 'pt' NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"publishHour" integer DEFAULT 8 NOT NULL,
	"autoPublish" integer DEFAULT 0 NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "triac_content" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "triac_content_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"content_type" "content_type" NOT NULL,
	"name" varchar(256) NOT NULL,
	"subtitle" varchar(256),
	"description" text NOT NULL,
	"category" varchar(128),
	"technologies" text,
	"highlights" text,
	"content_status" "content_status" DEFAULT 'ativo' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordHash" varchar(256),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
