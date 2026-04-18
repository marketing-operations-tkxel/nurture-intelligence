-- AlterTable: add unique constraint on Integration.platform
CREATE UNIQUE INDEX IF NOT EXISTS "Integration_platform_key" ON "Integration"("platform");
