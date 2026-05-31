-- CreateEnum
CREATE TYPE "LeaseType" AS ENUM ('UNLIMITED', 'FIXED_TERM');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED');

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lease_type" "LeaseType" NOT NULL DEFAULT 'UNLIMITED',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "notice_period_months" INTEGER NOT NULL DEFAULT 3,
    "cold_rent" DECIMAL(10,2) NOT NULL,
    "utilities_advance" DECIMAL(10,2) NOT NULL,
    "total_rent" DECIMAL(10,2) NOT NULL,
    "deposit_amount" DECIMAL(10,2) NOT NULL,
    "deposit_received_date" TIMESTAMP(3),
    "deposit_returned_date" TIMESTAMP(3),
    "deposit_notes" TEXT,
    "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "terminated_date" TIMESTAMP(3),
    "termination_reason" TEXT,
    "alert_90_sent_at" TIMESTAMP(3),
    "alert_60_sent_at" TIMESTAMP(3),
    "alert_30_sent_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leases_unit_id_key" ON "leases"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "leases_tenant_id_key" ON "leases"("tenant_id");

-- CreateIndex
CREATE INDEX "leases_org_id_idx" ON "leases"("org_id");

-- CreateIndex
CREATE INDEX "leases_tenant_id_idx" ON "leases"("tenant_id");

-- CreateIndex
CREATE INDEX "leases_status_idx" ON "leases"("status");

-- CreateIndex
CREATE INDEX "leases_end_date_idx" ON "leases"("end_date");

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
