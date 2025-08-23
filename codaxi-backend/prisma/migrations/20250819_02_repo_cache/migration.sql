ALTER TABLE "github_repository_connections"
ADD COLUMN IF NOT EXISTS "cachedRepo" JSONB,
ADD COLUMN IF NOT EXISTS "cachedLanguages" JSONB,
ADD COLUMN IF NOT EXISTS "tarballFilePath" TEXT,
ADD COLUMN IF NOT EXISTS "tarballUpdatedAt" TIMESTAMP(3);

