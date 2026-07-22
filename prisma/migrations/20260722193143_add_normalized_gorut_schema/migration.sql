-- CreateEnum
CREATE TYPE "GorutOperationalRole" AS ENUM ('PC', 'UPZIS', 'RANTING', 'PLPK');

-- CreateEnum
CREATE TYPE "GorutTransactionState" AS ENUM ('DRAFT', 'WAITING_RANTING_VERIFICATION', 'RETURNED_TO_PLPK', 'WAITING_UPZIS_VERIFICATION', 'RETURNED_TO_RANTING', 'WAITING_PC_APPROVAL', 'RETURNED_TO_UPZIS', 'FINAL_APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GorutWorkflowStage" AS ENUM ('RANTING', 'UPZIS', 'PC');

-- CreateEnum
CREATE TYPE "GorutWorkflowAction" AS ENUM ('SUBMIT', 'APPROVE', 'RETURN', 'REJECT', 'FINAL_CLOSE', 'CANCEL');

-- CreateTable
CREATE TABLE "GorutKecamatan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutKecamatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorutRanting" (
    "id" TEXT NOT NULL,
    "kecamatanId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutRanting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorutPlpk" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "rantingId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "legacyScope" TEXT,
    "legacyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutPlpk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorutOperationalAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GorutOperationalRole" NOT NULL,
    "kecamatanId" TEXT,
    "rantingId" TEXT,
    "plpkId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutOperationalAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorutMunfiq" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "gender" TEXT,
    "birthDate" TIMESTAMP(3),
    "rantingId" TEXT NOT NULL,
    "plpkId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3),
    "legacyScope" TEXT,
    "legacyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutMunfiq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorutTransaction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(19,2) NOT NULL,
    "sourceChannel" TEXT NOT NULL,
    "notes" TEXT,
    "currentState" "GorutTransactionState" NOT NULL,
    "kecamatanId" TEXT NOT NULL,
    "rantingId" TEXT NOT NULL,
    "plpkId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "finalApprovedAt" TIMESTAMP(3),
    "legacyScope" TEXT,
    "legacyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GorutTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorutTransactionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "munfiqId" TEXT NOT NULL,
    "amount" DECIMAL(19,2) NOT NULL,
    "periodLabel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GorutTransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorutWorkflowEvent" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "previousState" "GorutTransactionState",
    "resultingState" "GorutTransactionState" NOT NULL,
    "action" "GorutWorkflowAction" NOT NULL,
    "stage" "GorutWorkflowStage",
    "reason" TEXT,
    "actorUserId" TEXT NOT NULL,
    "actorAssignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GorutWorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GorutKecamatan_code_key" ON "GorutKecamatan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GorutKecamatan_name_key" ON "GorutKecamatan"("name");

-- CreateIndex
CREATE INDEX "GorutRanting_kecamatanId_idx" ON "GorutRanting"("kecamatanId");

-- CreateIndex
CREATE UNIQUE INDEX "GorutRanting_kecamatanId_code_key" ON "GorutRanting"("kecamatanId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "GorutRanting_kecamatanId_name_key" ON "GorutRanting"("kecamatanId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "GorutPlpk_code_key" ON "GorutPlpk"("code");

-- CreateIndex
CREATE INDEX "GorutPlpk_rantingId_idx" ON "GorutPlpk"("rantingId");

-- CreateIndex
CREATE UNIQUE INDEX "GorutPlpk_legacyScope_legacyKey_key" ON "GorutPlpk"("legacyScope", "legacyKey");

-- CreateIndex
CREATE INDEX "GorutOperationalAssignment_userId_isActive_idx" ON "GorutOperationalAssignment"("userId", "isActive");

-- CreateIndex
CREATE INDEX "GorutOperationalAssignment_role_isActive_idx" ON "GorutOperationalAssignment"("role", "isActive");

-- CreateIndex
CREATE INDEX "GorutOperationalAssignment_kecamatanId_idx" ON "GorutOperationalAssignment"("kecamatanId");

-- CreateIndex
CREATE INDEX "GorutOperationalAssignment_rantingId_idx" ON "GorutOperationalAssignment"("rantingId");

-- CreateIndex
CREATE INDEX "GorutOperationalAssignment_plpkId_idx" ON "GorutOperationalAssignment"("plpkId");

-- CreateIndex
CREATE UNIQUE INDEX "GorutMunfiq_code_key" ON "GorutMunfiq"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GorutMunfiq_nik_key" ON "GorutMunfiq"("nik");

-- CreateIndex
CREATE INDEX "GorutMunfiq_rantingId_idx" ON "GorutMunfiq"("rantingId");

-- CreateIndex
CREATE INDEX "GorutMunfiq_plpkId_idx" ON "GorutMunfiq"("plpkId");

-- CreateIndex
CREATE UNIQUE INDEX "GorutMunfiq_legacyScope_legacyKey_key" ON "GorutMunfiq"("legacyScope", "legacyKey");

-- CreateIndex
CREATE UNIQUE INDEX "GorutTransaction_code_key" ON "GorutTransaction"("code");

-- CreateIndex
CREATE INDEX "GorutTransaction_currentState_idx" ON "GorutTransaction"("currentState");

-- CreateIndex
CREATE INDEX "GorutTransaction_transactionDate_idx" ON "GorutTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "GorutTransaction_kecamatanId_idx" ON "GorutTransaction"("kecamatanId");

-- CreateIndex
CREATE INDEX "GorutTransaction_rantingId_idx" ON "GorutTransaction"("rantingId");

-- CreateIndex
CREATE INDEX "GorutTransaction_plpkId_idx" ON "GorutTransaction"("plpkId");

-- CreateIndex
CREATE UNIQUE INDEX "GorutTransaction_legacyScope_legacyKey_key" ON "GorutTransaction"("legacyScope", "legacyKey");

-- CreateIndex
CREATE INDEX "GorutTransactionItem_munfiqId_idx" ON "GorutTransactionItem"("munfiqId");

-- CreateIndex
CREATE UNIQUE INDEX "GorutTransactionItem_transactionId_munfiqId_key" ON "GorutTransactionItem"("transactionId", "munfiqId");

-- CreateIndex
CREATE INDEX "GorutWorkflowEvent_transactionId_idx" ON "GorutWorkflowEvent"("transactionId");

-- CreateIndex
CREATE INDEX "GorutWorkflowEvent_actorUserId_idx" ON "GorutWorkflowEvent"("actorUserId");

-- CreateIndex
CREATE INDEX "GorutWorkflowEvent_actorAssignmentId_idx" ON "GorutWorkflowEvent"("actorAssignmentId");

-- AddForeignKey
ALTER TABLE "GorutRanting" ADD CONSTRAINT "GorutRanting_kecamatanId_fkey" FOREIGN KEY ("kecamatanId") REFERENCES "GorutKecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutPlpk" ADD CONSTRAINT "GorutPlpk_rantingId_fkey" FOREIGN KEY ("rantingId") REFERENCES "GorutRanting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutOperationalAssignment" ADD CONSTRAINT "GorutOperationalAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutOperationalAssignment" ADD CONSTRAINT "GorutOperationalAssignment_kecamatanId_fkey" FOREIGN KEY ("kecamatanId") REFERENCES "GorutKecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutOperationalAssignment" ADD CONSTRAINT "GorutOperationalAssignment_rantingId_fkey" FOREIGN KEY ("rantingId") REFERENCES "GorutRanting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutOperationalAssignment" ADD CONSTRAINT "GorutOperationalAssignment_plpkId_fkey" FOREIGN KEY ("plpkId") REFERENCES "GorutPlpk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutMunfiq" ADD CONSTRAINT "GorutMunfiq_rantingId_fkey" FOREIGN KEY ("rantingId") REFERENCES "GorutRanting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutMunfiq" ADD CONSTRAINT "GorutMunfiq_plpkId_fkey" FOREIGN KEY ("plpkId") REFERENCES "GorutPlpk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutTransaction" ADD CONSTRAINT "GorutTransaction_kecamatanId_fkey" FOREIGN KEY ("kecamatanId") REFERENCES "GorutKecamatan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutTransaction" ADD CONSTRAINT "GorutTransaction_rantingId_fkey" FOREIGN KEY ("rantingId") REFERENCES "GorutRanting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutTransaction" ADD CONSTRAINT "GorutTransaction_plpkId_fkey" FOREIGN KEY ("plpkId") REFERENCES "GorutPlpk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutTransaction" ADD CONSTRAINT "GorutTransaction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutTransactionItem" ADD CONSTRAINT "GorutTransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "GorutTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutTransactionItem" ADD CONSTRAINT "GorutTransactionItem_munfiqId_fkey" FOREIGN KEY ("munfiqId") REFERENCES "GorutMunfiq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutWorkflowEvent" ADD CONSTRAINT "GorutWorkflowEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "GorutTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutWorkflowEvent" ADD CONSTRAINT "GorutWorkflowEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorutWorkflowEvent" ADD CONSTRAINT "GorutWorkflowEvent_actorAssignmentId_fkey" FOREIGN KEY ("actorAssignmentId") REFERENCES "GorutOperationalAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
