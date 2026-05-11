-- CreateTable
CREATE TABLE "ContractChangeReview" (
    "odooLineId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractChangeReview_pkey" PRIMARY KEY ("odooLineId")
);
