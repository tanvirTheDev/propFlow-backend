-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "geocoded_at" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
