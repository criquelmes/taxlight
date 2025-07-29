/*
  Warnings:

  - You are about to drop the `subscription_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `subscriptionTypeId` on the `order_subscriptions` table. All the data in the column will be lost.
  - Added the required column `subscriptionId` to the `order_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "subscription_types_name_idx";

-- DropIndex
DROP INDEX "subscription_types_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "subscription_types";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_order_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "orderId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    CONSTRAINT "order_subscriptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_subscriptions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_order_subscriptions" ("createdAt", "id", "orderId", "price", "quantity", "updatedAt") SELECT "createdAt", "id", "orderId", "price", "quantity", "updatedAt" FROM "order_subscriptions";
DROP TABLE "order_subscriptions";
ALTER TABLE "new_order_subscriptions" RENAME TO "order_subscriptions";
CREATE INDEX "order_subscriptions_orderId_idx" ON "order_subscriptions"("orderId");
CREATE INDEX "order_subscriptions_subscriptionId_idx" ON "order_subscriptions"("subscriptionId");
CREATE UNIQUE INDEX "order_subscriptions_orderId_subscriptionId_key" ON "order_subscriptions"("orderId", "subscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_name_key" ON "subscriptions"("name");

-- CreateIndex
CREATE INDEX "subscriptions_name_idx" ON "subscriptions"("name");
