-- CreateTable
CREATE TABLE "UpcomingContractExpiryStatus" (
    "rowKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpcomingContractExpiryStatus_pkey" PRIMARY KEY ("rowKey")
);
