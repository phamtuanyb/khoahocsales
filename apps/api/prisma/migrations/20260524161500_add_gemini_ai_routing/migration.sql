ALTER TABLE "ai_provider_configs"
  ADD COLUMN "encrypted_gemini_api_key" TEXT,
  ADD COLUMN "coach_provider" TEXT NOT NULL DEFAULT 'gemini',
  ADD COLUMN "coach_model" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  ADD COLUMN "grading_provider" TEXT NOT NULL DEFAULT 'openai',
  ADD COLUMN "grading_model" TEXT NOT NULL DEFAULT 'gpt-4o-mini';
