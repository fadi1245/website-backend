
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PushNotificationCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SendPushNotificationDto {
  @ApiProperty({
    description: 'Title displayed in the browser notification.',
    example: 'New Job Vacancy!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: 'Message displayed in the browser notification.',
    example: 'We are hiring! Check out our latest job openings.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  message!: string;

  @ApiPropertyOptional({
    description: 'Optional URL opened when the user clicks the notification.',
    example: 'https://www.thijar.com/careers',
  })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(2048)
  url?: string;

  @ApiProperty({
    description: 'Category of the notification.',
    enum: PushNotificationCategory,
    example: PushNotificationCategory.job_vacancy,
  })
  @IsEnum(PushNotificationCategory)
  category!: PushNotificationCategory;
}



export class PushNotificationsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of notifications to retrieve per request.',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Cursor from the previous response.',
    example: 'eyJ...',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
