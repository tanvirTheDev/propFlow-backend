import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { TicketCategory, TicketPriority, EmergencyType } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  unitId!: string;

  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photos?: string[];

  @IsBoolean()
  isEmergency!: boolean;

  @ValidateIf((o: CreateTicketDto) => o.isEmergency === true)
  @IsEnum(EmergencyType)
  emergencyType?: EmergencyType;
}
