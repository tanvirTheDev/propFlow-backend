import {
  IsString,
  IsDateString,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VisitReason } from '@prisma/client';

export class VisitUnitDto {
  @IsString()
  unitId!: string;

  @IsBoolean()
  notifyTenant!: boolean;
}

export class CreateVisitDto {
  @IsString()
  propertyId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsInt()
  @Min(15)
  @Max(480)
  @IsOptional()
  durationMin?: number;

  @IsEnum(VisitReason)
  reason!: VisitReason;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VisitUnitDto)
  units!: VisitUnitDto[];
}
