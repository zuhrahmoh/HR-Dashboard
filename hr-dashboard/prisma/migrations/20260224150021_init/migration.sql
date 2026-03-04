-- CreateTable
CREATE TABLE "Vacancy" (
    "id" UUID NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriticalRecruitment" (
    "id" UUID NOT NULL,
    "candidateName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CriticalRecruitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisciplinaryCase" (
    "id" UUID NOT NULL,
    "employeeName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisciplinaryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractChange" (
    "id" UUID NOT NULL,
    "employeeName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "changeTypes" TEXT[],
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalEnrollment" (
    "id" UUID NOT NULL,
    "employeeName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "enrollmentType" TEXT,
    "vendor" TEXT,
    "stage" TEXT NOT NULL,
    "dateInitiated" TEXT,
    "nextAction" TEXT,
    "hrRepresentative" TEXT,
    "notes" TEXT,
    "attachmentsUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EapReferral" (
    "id" UUID NOT NULL,
    "employeeName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "referralSource" TEXT,
    "referralDate" TEXT NOT NULL,
    "reasonCategory" TEXT NOT NULL,
    "reasonDetails" TEXT,
    "programStatus" TEXT NOT NULL,
    "startDate" TEXT,
    "lastFollowUpDate" TEXT,
    "nextFollowUpDate" TEXT,
    "outcomeNotes" TEXT,
    "ownerHr" TEXT,
    "referralDocsUrl" TEXT,
    "closeDate" TEXT,
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EapReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CPlayerNote" (
    "employeeKey" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CPlayerNote_pkey" PRIMARY KEY ("employeeKey")
);
