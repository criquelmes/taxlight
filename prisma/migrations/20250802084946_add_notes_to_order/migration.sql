-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('ASTROBOT', 'BITE');

-- CreateEnum
CREATE TYPE "SubscriptionAction" AS ENUM ('CREATED', 'ACTIVATED', 'RENEWED', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'REACTIVATED');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" "ProductType" NOT NULL,
    "subscriptionId" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "type" "SubscriptionType" NOT NULL DEFAULT 'MONTHLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "mpSubscriptionId" TEXT,
    "notes" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_subscriptions" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "renewalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,

    CONSTRAINT "order_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_logs" (
    "id" TEXT NOT NULL,
    "action" "SubscriptionAction" NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_subscriptionId_idx" ON "products"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_subscriptionId_key" ON "products"("name", "subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_name_key" ON "subscriptions"("name");

-- CreateIndex
CREATE INDEX "subscriptions_name_idx" ON "subscriptions"("name");

-- CreateIndex
CREATE INDEX "subscriptions_type_idx" ON "subscriptions"("type");

-- CreateIndex
CREATE INDEX "subscriptions_isActive_idx" ON "subscriptions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_isPaid_idx" ON "orders"("isPaid");

-- CreateIndex
CREATE INDEX "orders_isActive_idx" ON "orders"("isActive");

-- CreateIndex
CREATE INDEX "orders_expiresAt_idx" ON "orders"("expiresAt");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "order_subscriptions_orderId_idx" ON "order_subscriptions"("orderId");

-- CreateIndex
CREATE INDEX "order_subscriptions_subscriptionId_idx" ON "order_subscriptions"("subscriptionId");

-- CreateIndex
CREATE INDEX "order_subscriptions_isActive_idx" ON "order_subscriptions"("isActive");

-- CreateIndex
CREATE INDEX "order_subscriptions_endDate_idx" ON "order_subscriptions"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "order_subscriptions_orderId_subscriptionId_key" ON "order_subscriptions"("orderId", "subscriptionId");

-- CreateIndex
CREATE INDEX "subscription_logs_orderId_idx" ON "subscription_logs"("orderId");

-- CreateIndex
CREATE INDEX "subscription_logs_userId_idx" ON "subscription_logs"("userId");

-- CreateIndex
CREATE INDEX "subscription_logs_action_idx" ON "subscription_logs"("action");

-- CreateIndex
CREATE INDEX "subscription_logs_createdAt_idx" ON "subscription_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_subscriptions" ADD CONSTRAINT "order_subscriptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_subscriptions" ADD CONSTRAINT "order_subscriptions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
