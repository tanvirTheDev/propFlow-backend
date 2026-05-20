import { Role } from '@prisma/client';

export interface CreateUserDto {
  orgId: string;
  role: Role;
  name: string;
  email: string;
  password: string;
  phone?: string;
  language?: string;
}
