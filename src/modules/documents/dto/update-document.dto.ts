import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const DOCUMENT_CATEGORIES = [
  'LEASE_CONTRACT', 'FLOOR_PLAN', 'ENERGY_CERTIFICATE', 'HOUSE_RULES',
  'HANDOVER_REPORT', 'UTILITY_BILL', 'INSPECTION_REPORT', 'INSURANCE',
  'INVOICE', 'CORRESPONDENCE', 'OTHER',
] as const;
type DocCategory = typeof DOCUMENT_CATEGORIES[number];

const DOCUMENT_VISIBILITIES = ['LANDLORD_ONLY', 'SHARED_WITH_TENANT'] as const;
type DocVisibility = typeof DOCUMENT_VISIBILITIES[number];

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(DOCUMENT_CATEGORIES)
  @IsOptional()
  category?: DocCategory;

  @IsEnum(DOCUMENT_VISIBILITIES)
  @IsOptional()
  visibility?: DocVisibility;
}
