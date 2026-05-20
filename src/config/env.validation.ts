import { plainToInstance } from 'class-transformer';
import { IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

class EnvVariables {
  @IsString() DATABASE_URL!: string;
  @IsString() JWT_SECRET!: string;
  @IsString() JWT_REFRESH_SECRET!: string;
  @IsString() JWT_EXPIRES_IN!: string;
  @IsString() JWT_REFRESH_EXPIRES_IN!: string;
  @IsString() FRONTEND_URL!: string;
  @IsString() SENTRY_DSN!: string;
  @IsNumber() PORT!: number;
  @IsString() MAIL_HOST!: string;
  @IsNumber() MAIL_PORT!: number;
  @IsString() MAIL_USER!: string;
  @IsString() MAIL_PASS!: string;
  @IsString() MAIL_FROM!: string;
  @IsString() MAIL_SECURE!: string;
  @IsString() CLOUDINARY_CLOUD_NAME!: string;
  @IsString() CLOUDINARY_API_KEY!: string;
  @IsString() CLOUDINARY_API_SECRET!: string;
  @IsOptional() @IsString() VAPID_PUBLIC_KEY?: string;
  @IsOptional() @IsString() VAPID_PRIVATE_KEY?: string;
  @IsOptional() @IsString() VAPID_EMAIL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
