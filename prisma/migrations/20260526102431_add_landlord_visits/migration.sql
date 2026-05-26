-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitReason" AS ENUM ('ROUTINE_INSPECTION', 'METER_READING', 'MAINTENANCE_CHECK', 'VIEWING', 'OTHER');

-- CreateTable
CREATE TABLE "landlord_visits" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "reason" "VisitReason" NOT NULL DEFAULT 'OTHER',
    "note" TEXT,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "cancel_reason" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landlord_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landlord_visit_units" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "notify_tenant" BOOLEAN NOT NULL DEFAULT true,
    "email_sent_at" TIMESTAMP(3),

    CONSTRAINT "landlord_visit_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "landlord_visits_org_id_idx" ON "landlord_visits"("org_id");

-- CreateIndex
CREATE INDEX "landlord_visits_property_id_idx" ON "landlord_visits"("property_id");

-- CreateIndex
CREATE INDEX "landlord_visits_scheduled_at_idx" ON "landlord_visits"("scheduled_at");

-- CreateIndex
CREATE INDEX "landlord_visit_units_visit_id_idx" ON "landlord_visit_units"("visit_id");

-- CreateIndex
CREATE INDEX "landlord_visit_units_tenant_id_idx" ON "landlord_visit_units"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_visit_units_visit_id_unit_id_key" ON "landlord_visit_units"("visit_id", "unit_id");

-- AddForeignKey
ALTER TABLE "landlord_visits" ADD CONSTRAINT "landlord_visits_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_visits" ADD CONSTRAINT "landlord_visits_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_visits" ADD CONSTRAINT "landlord_visits_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_visit_units" ADD CONSTRAINT "landlord_visit_units_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "landlord_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_visit_units" ADD CONSTRAINT "landlord_visit_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlord_visit_units" ADD CONSTRAINT "landlord_visit_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
