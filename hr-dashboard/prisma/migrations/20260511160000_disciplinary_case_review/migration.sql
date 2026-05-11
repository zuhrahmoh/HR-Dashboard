-- CreateTable
CREATE TABLE "DisciplinaryCaseReview" (
    "odooLineId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplinaryCaseReview_pkey" PRIMARY KEY ("odooLineId")
);
