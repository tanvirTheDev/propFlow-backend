import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class CreateInviteDto {
  @IsUUID()
  unitId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(2, 100)
  name!: string;
}
