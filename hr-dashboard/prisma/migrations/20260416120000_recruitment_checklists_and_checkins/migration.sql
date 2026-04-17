-- CreateTable
CREATE TABLE "RecruitmentOnboardingChecklist" (
    "rowKey" TEXT NOT NULL,
    "taskStates" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentOnboardingChecklist_pkey" PRIMARY KEY ("rowKey")
);

-- CreateTable
CREATE TABLE "RecruitmentExitChecklist" (
    "rowKey" TEXT NOT NULL,
    "taskStates" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentExitChecklist_pkey" PRIMARY KEY ("rowKey")
);

-- CreateTable
CREATE TABLE "NewHireCheckinStatus" (
    "rowKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewHireCheckinStatus_pkey" PRIMARY KEY ("rowKey")
);
