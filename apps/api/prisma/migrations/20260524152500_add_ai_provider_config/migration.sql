CREATE TABLE "ai_provider_configs" (
    "id" TEXT NOT NULL DEFAULT 'openai',
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "encrypted_api_key" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "max_tokens" INTEGER NOT NULL DEFAULT 1500,
    "daily_limit" INTEGER NOT NULL DEFAULT 20,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_provider_configs_pkey" PRIMARY KEY ("id")
);
