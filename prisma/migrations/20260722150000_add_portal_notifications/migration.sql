CREATE TABLE "PortalNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "actionPath" TEXT,
    "creatorId" TEXT,
    "targetUserId" TEXT,
    "targetRole" TEXT,
    "expiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PortalNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PortalNotificationReceipt" (
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    CONSTRAINT "PortalNotificationReceipt_pkey" PRIMARY KEY ("notificationId", "userId")
);

CREATE INDEX "PortalNotification_publishedAt_withdrawnAt_idx" ON "PortalNotification"("publishedAt", "withdrawnAt");
CREATE INDEX "PortalNotification_audience_publishedAt_idx" ON "PortalNotification"("audience", "publishedAt");
CREATE INDEX "PortalNotification_createdAt_idx" ON "PortalNotification"("createdAt");
CREATE INDEX "PortalNotification_targetUserId_idx" ON "PortalNotification"("targetUserId");
CREATE INDEX "PortalNotification_targetRole_idx" ON "PortalNotification"("targetRole");
CREATE INDEX "PortalNotification_expiresAt_idx" ON "PortalNotification"("expiresAt");
CREATE INDEX "PortalNotification_creatorId_idx" ON "PortalNotification"("creatorId");
CREATE INDEX "PortalNotificationReceipt_notificationId_idx" ON "PortalNotificationReceipt"("notificationId");
CREATE INDEX "PortalNotificationReceipt_userId_idx" ON "PortalNotificationReceipt"("userId");

ALTER TABLE "PortalNotification" ADD CONSTRAINT "PortalNotification_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortalNotification" ADD CONSTRAINT "PortalNotification_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PortalNotificationReceipt" ADD CONSTRAINT "PortalNotificationReceipt_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "PortalNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortalNotificationReceipt" ADD CONSTRAINT "PortalNotificationReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
