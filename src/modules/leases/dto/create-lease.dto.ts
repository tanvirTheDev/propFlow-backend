import {
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeaseDto {
  @IsString()
  unitId!: string;

  @IsString()
  tenantId!: string;

  @IsEnum(['UNLIMITED', 'FIXED_TERM'])
  leaseType!: 'UNLIMITED' | 'FIXED_TERM';

  @IsDateString()
  startDate!: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  coldRent!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  utilitiesAdvance!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  depositAmount!: number;

  @IsDateString()
  @IsOptional()
  depositReceivedDate?: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  @IsOptional()
  @Type(() => Number)
  noticePeriodMonths?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
