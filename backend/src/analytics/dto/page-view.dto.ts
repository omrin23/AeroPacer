import { IsString, IsOptional, IsObject } from 'class-validator';

export class PageViewDto {
  @IsString()
  page: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  referrer?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsObject()
  @IsOptional()
  customProperties?: Record<string, any>;
}