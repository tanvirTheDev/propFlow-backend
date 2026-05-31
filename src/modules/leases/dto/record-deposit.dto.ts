import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RecordDepositDto {
  @IsDateString()
  receivedDate!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReturnDepositDto {
  @IsDateString()
  returnedDate!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class TerminateLeaseDto {
  @IsDateString()
  terminatedDate!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
