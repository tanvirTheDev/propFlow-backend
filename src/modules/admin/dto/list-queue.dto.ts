import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListQueueDto {
  @IsOptional() @IsString()
  status?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt() @Min(1) @Max(200)
  limit?: number = 50;
}
