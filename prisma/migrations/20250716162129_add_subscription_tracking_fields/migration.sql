-- CreateTable
CREATE TABLE "subscription_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_order_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "orderId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    CONSTRAINT "order_subscriptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_subscriptions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_order_subscriptions" ("createdAt", "id", "orderId", "price", "quantity", "subscriptionId", "updatedAt") SELECT "createdAt", "id", "orderId", "price", "quantity", "subscriptionId", "updatedAt" FROM "order_subscriptions";
DROP TABLE "order_subscriptions";
ALTER TABLE "new_order_subscriptions" RENAME TO "order_subscriptions";
CREATE INDEX "order_subscriptions_orderId_idx" ON "order_subscriptions"("orderId");
CREATE INDEX "order_subscriptions_subscriptionId_idx" ON "order_subscriptions"("subscriptionId");
CREATE INDEX "order_subscriptions_isActive_idx" ON "order_subscriptions"("isActive");
CREATE INDEX "order_subscriptions_endDate_idx" ON "order_subscriptions"("endDate");
CREATE UNIQUE INDEX "order_subscriptions_orderId_subscriptionId_key" ON "order_subscriptions"("orderId", "subscriptionId");
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL,
    "total" REAL NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" DATETIME,
    "startsAt" DATETIME,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "mpSubscriptionId" TEXT,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("createdAt", "id", "isPaid", "mpSubscriptionId", "paidAt", "subtotal", "tax", "total", "transactionId", "updatedAt", "userId") SELECT "createdAt", "id", "isPaid", "mpSubscriptionId", "paidAt", "subtotal", "tax", "total", "transactionId", "updatedAt", "userId" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE INDEX "orders_userId_idx" ON "orders"("userId");
CREATE INDEX "orders_isPaid_idx" ON "orders"("isPaid");
CREATE INDEX "orders_isActive_idx" ON "orders"("isActive");
CREATE INDEX "orders_expiresAt_idx" ON "orders"("expiresAt");
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
CREATE TABLE "new_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'MONTHLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_subscriptions" ("createdAt", "id", "name", "price", "updatedAt") SELECT "createdAt", "id", "name", "price", "updatedAt" FROM "subscriptions";
DROP TABLE "subscriptions";
ALTER TABLE "new_subscriptions" RENAME TO "subscriptions";
CREATE UNIQUE INDEX "subscriptions_name_key" ON "subscriptions"("name");
CREATE INDEX "subscriptions_name_idx" ON "subscriptions"("name");
CREATE INDEX "subscriptions_type_idx" ON "subscriptions"("type");
CREATE INDEX "subscriptions_isActive_idx" ON "subscriptions"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "subscription_logs_orderId_idx" ON "subscription_logs"("orderId");

-- CreateIndex
CREATE INDEX "subscription_logs_userId_idx" ON "subscription_logs"("userId");

-- CreateIndex
CREATE INDEX "subscription_logs_action_idx" ON "subscription_logs"("action");

-- CreateIndex
CREATE INDEX "subscription_logs_createdAt_idx" ON "subscription_logs"("createdAt");
