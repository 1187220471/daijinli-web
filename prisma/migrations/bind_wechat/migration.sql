-- DropIndex
DROP INDEX "User_openid_key";

-- CreateTable
CREATE TABLE "bind_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bind_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bind_token_token_key" ON "bind_token"("token");

-- CreateIndex
CREATE INDEX "bind_token_userId_idx" ON "bind_token"("userId");

