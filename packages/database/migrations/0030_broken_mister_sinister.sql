CREATE TABLE "saved_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"message_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"language" text,
	"metadata" jsonb,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"free_budget_id" text,
	"free_budget_key" text,
	"subscription_budget_id" text,
	"subscription_budget_key" text,
	"package_budget_id" text,
	"package_budget_key" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_id" text,
	"currency" text,
	"pricing" integer,
	"billing_paid_at" integer,
	"billing_cycle_start" integer,
	"billing_cycle_end" integer,
	"cancel_at_period_end" boolean,
	"cancel_at" integer,
	"next_billing" jsonb,
	"plan" text,
	"recurring" text,
	"storage_limit" integer,
	"status" integer,
	"lewis_access" boolean DEFAULT false,
	"lewis_subscription_tier" text DEFAULT 'free',
	"lewis_subscription_start" timestamp with time zone,
	"lewis_subscription_end" timestamp with time zone,
	"lewis_payment_status" text DEFAULT 'inactive',
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ALTER COLUMN "opening_questions" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "agents" ALTER COLUMN "opening_questions" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_installed_plugins" ALTER COLUMN "manifest" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user_installed_plugins" ALTER COLUMN "settings" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user_installed_plugins" ALTER COLUMN "custom_params" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "user_budgets" ADD CONSTRAINT "user_budgets_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;