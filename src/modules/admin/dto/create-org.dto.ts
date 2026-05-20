import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateOrgDto {
  @IsString() @MinLength(2)
  orgName!: string;

  @IsString() @MinLength(2)
  landlordName!: string;

  @IsEmail()
  landlordEmail!: string;

  @IsString() @MinLength(8)
  landlordPassword!: string;
}
