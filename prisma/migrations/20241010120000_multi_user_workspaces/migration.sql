-- Multi-user workspace migration
-- Introduces workspaces, memberships, invites, revisions, refresh tokens,
-- and converts project visibility to enum-based column with workspace scoping.

-- Enums ---------------------------------------------------------------------
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'CONTRIBUTOR', 'VIEWER');
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'PENDING', 'REVOKED');
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "ProjectVisibility" AS ENUM ('PRIVATE', 'WORKSPACE', 'PUBLIC');

-- Users ---------------------------------------------------------------------
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- Workspaces ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspaces_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'CONTRIBUTOR',
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_members_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "workspace_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "workspace_members_workspace_user_unique" UNIQUE ("workspaceId", "userId")
);

CREATE TABLE IF NOT EXISTS "workspace_invites" (
  "id" TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'CONTRIBUTOR',
  "token" TEXT NOT NULL UNIQUE,
  "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT NOT NULL,
  "acceptedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_invites_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "workspace_invites_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "workspace_invites_acceptedById_fkey"
    FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Projects ------------------------------------------------------------------
ALTER TABLE "projects" RENAME COLUMN "userId" TO "ownerId";
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "currentRevisionId" TEXT;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- Convert visibility column to enum
ALTER TABLE "projects"
  ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "projects"
  ALTER COLUMN "visibility" TYPE "ProjectVisibility"
  USING CASE UPPER("visibility")
    WHEN 'PUBLIC' THEN 'PUBLIC'::"ProjectVisibility"
    WHEN 'WORKSPACE' THEN 'WORKSPACE'::"ProjectVisibility"
    ELSE 'PRIVATE'::"ProjectVisibility"
  END;
ALTER TABLE "projects"
  ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE';

-- Seed default workspaces for legacy single-user projects
INSERT INTO "workspaces" ("id", "name", "slug", "createdById")
SELECT DISTINCT 'ws_' || u."id", COALESCE(NULLIF(u."name", ''), SPLIT_PART(u."email", '@', 1) || ' Workspace'), NULL, u."id"
FROM "users" u
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "workspace_members" ("id", "workspaceId", "userId", "role")
SELECT DISTINCT 'wm_' || u."id", 'ws_' || u."id", u."id", 'OWNER'
FROM "users" u
ON CONFLICT ("workspaceId", "userId") DO NOTHING;

UPDATE "projects" SET "workspaceId" = 'ws_' || "ownerId"
WHERE "workspaceId" IS NULL;

ALTER TABLE "projects"
  ALTER COLUMN "workspaceId" SET NOT NULL;

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "projects_workspaceId_idx" ON "projects"("workspaceId");

-- Project files -------------------------------------------------------------
ALTER TABLE "project_files" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "project_files" ADD COLUMN IF NOT EXISTS "uploadedById" TEXT;

UPDATE "project_files" pf
SET "workspaceId" = p."workspaceId"
FROM "projects" p
WHERE pf."projectId" = p."id" AND pf."workspaceId" IS NULL;

ALTER TABLE "project_files"
  ALTER COLUMN "workspaceId" SET NOT NULL;

ALTER TABLE "project_files"
  ADD CONSTRAINT "project_files_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "project_files"
  ADD CONSTRAINT "project_files_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL;

-- Project analysis ----------------------------------------------------------
ALTER TABLE "project_analyses" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "project_analyses" ADD COLUMN IF NOT EXISTS "triggeredById" TEXT;

UPDATE "project_analyses" pa
SET "workspaceId" = p."workspaceId"
FROM "projects" p
WHERE pa."projectId" = p."id" AND pa."workspaceId" IS NULL;

ALTER TABLE "project_analyses"
  ALTER COLUMN "workspaceId" SET NOT NULL;

ALTER TABLE "project_analyses"
  ADD CONSTRAINT "project_analyses_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "project_analyses"
  ADD CONSTRAINT "project_analyses_triggeredById_fkey"
    FOREIGN KEY ("triggeredById") REFERENCES "users"("id") ON DELETE SET NULL;

-- Project revisions ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS "project_revisions" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "summary" TEXT,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_revisions_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "project_revisions_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "project_revisions_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "project_revisions_project_number_unique" UNIQUE ("projectId", "number")
);

-- Refresh tokens ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revoked" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- Backfill workspace column on file analysis --------------------------------
ALTER TABLE "project_files"
  ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- (Ensured earlier, but double-check for repeated migrations)
UPDATE "project_files" pf
SET "workspaceId" = p."workspaceId"
FROM "projects" p
WHERE pf."projectId" = p."id" AND pf."workspaceId" IS NULL;

-- Housekeeping --------------------------------------------------------------
ALTER TABLE "project_files"
  ALTER COLUMN "workspaceId" SET NOT NULL;

-- Ensure updated timestamps refresh on change
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at
BEFORE UPDATE ON "workspaces"
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER set_workspace_member_updated_at
BEFORE UPDATE ON "workspace_members"
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
