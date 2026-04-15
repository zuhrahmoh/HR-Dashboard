CREATE TABLE IF NOT EXISTS "DisciplinaryCaseInclude" (
    "odooCaseKey" TEXT NOT NULL,
    "includeInReport" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisciplinaryCaseInclude_pkey" PRIMARY KEY ("odooCaseKey")
);
