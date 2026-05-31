import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const DOCUMENT_CATEGORIES = [
  'LEASE_CONTRACT', 'FLOOR_PLAN', 'ENERGY_CERTIFICATE', 'HOUSE_RULES',
  'HANDOVER_REPORT', 'UTILITY_BILL', 'INSPECTION_REPORT', 'INSURANCE',
  'INVOICE', 'CORRESPONDENCE', 'OTHER',
] as const;
type DocCategory = typeof DOCUMENT_CATEGORIES[number];

const DOCUMENT_VISIBILITIES = ['LANDLORD_ONLY', 'SHARED_WITH_TENANT'] as const;
type DocVisibility = typeof DOCUMENT_VISIBILITIES[number];

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  fileUrl!: string;

  @IsString()
  fileType!: string;

  @IsNumber()
  @IsPositive()
  fileSizeBytes!: number;

  @IsEnum(DOCUMENT_CATEGORIES)
  category!: DocCategory;

  @IsEnum(DOCUMENT_VISIBILITIES)
  visibility!: DocVisibility;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  leaseId?: string;

  // At least one scope must be set — validated in service
  @ValidateIf((o: CreateDocumentDto) => !o.propertyId && !o.unitId && !o.tenantId)
  @IsString({ message: 'At least one of propertyId, unitId, or tenantId must be provided' })
  _scopeCheck?: string;
}
