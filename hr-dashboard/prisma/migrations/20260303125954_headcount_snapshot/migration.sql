-- CreateTable
CREATE TABLE "HeadcountSnapshot" (
    "id" UUID NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "headcount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeadcountSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeadcountSnapshot_month_key" ON "HeadcountSnapshot"("month");
