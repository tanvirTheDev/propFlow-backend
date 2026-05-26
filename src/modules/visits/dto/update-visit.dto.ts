import {
  IsDateString,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VisitReason } from '@prisma/client';
import { VisitUnitDto } from './create-visit.dto';

export class UpdateVisitDto {
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsInt()
  @Min(15)
  @Max(480)
  @IsOptional()
  durationMin?: number;

  @IsEnum(VisitReason)
  @IsOptional()
  reason?: VisitReason;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VisitUnitDto)
  units?: VisitUnitDto[];
}
