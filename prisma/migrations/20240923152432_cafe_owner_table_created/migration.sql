-- CreateTable
CREATE TABLE "CafeOwnerUser" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CafeOwnerUser_pkey" PRIMARY KEY ("id")
);
