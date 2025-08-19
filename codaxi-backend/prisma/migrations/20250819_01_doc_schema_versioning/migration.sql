-- Add EDITOR role to enum (Postgres requires careful enum alteration)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'UserRole' AND e.enumlabel = 'EDITOR') THEN
    ALTER TYPE "UserRole" ADD VALUE 'EDITOR';
  END IF;
END $$;

-- Add schemaVersion column to doc_nodes
ALTER TABLE "doc_nodes" ADD COLUMN IF NOT EXISTS "schemaVersion" INTEGER NOT NULL DEFAULT 0;

-- Create doc_schema_versions table
CREATE TABLE IF NOT EXISTS "doc_schema_versions" (
  "id" TEXT PRIMARY KEY,
  "docNodeId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "params" JSONB,
  "requestSchema" JSONB,
  "requestExample" JSONB,
  "responses" JSONB,
  "errors" JSONB,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "doc_schema_versions_docNodeId_version_idx" ON "doc_schema_versions" ("docNodeId", "version");

