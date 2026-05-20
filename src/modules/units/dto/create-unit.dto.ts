import { IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @Length(1, 20)
  unitNumber!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  floor?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  sizeM2?: number;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
