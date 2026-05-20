import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @Length(2, 200)
  name!: string;

  @IsString()
  @Length(2, 200)
  street!: string;

  @IsString()
  @Length(2, 100)
  city!: string;

  @IsString()
  @Matches(/^\d{5}$/, { message: 'postalCode must be a valid German postal code (5 digits)' })
  postalCode!: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
