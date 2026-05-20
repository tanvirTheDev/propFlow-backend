import { IsObject } from 'class-validator';

export class SavePushSubscriptionDto {
  @IsObject()
  subscription!: Record<string, unknown>;
}
