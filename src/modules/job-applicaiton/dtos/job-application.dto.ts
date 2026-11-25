
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// CREATE APPLICATION REQUEST DTO
export class CreateApplicationDto {
  @ApiProperty({
    description: 'ID of the job listing',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({
    description: 'Applicant full name',
    example: 'Mohammed Fadi',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    description: 'Applicant email address',
    example: 'fadi@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Applicant phone number',
    example: '+919876543210',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @ApiProperty({
    description: 'Optional cover note from the applicant',
    example: 'I am interested in applying for this position.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  coverNote?: string;
}


export class CreatedApplicationDetailsDto {
    @ApiProperty()
    id!: string;
  
    @ApiProperty()
    jobId!: string | null;
  
    @ApiProperty({
      example: 'Accountant',
    })
    jobTitle!: string;
  
    @ApiProperty({
      example: 'Mohammed Fadi',
    })
    name!: string;
  
    @ApiProperty({
      example: 'fadi@example.com',
    })
    email!: string;
  
    @ApiProperty({
      example: '+919876543210',
    })
    phone!: string;
  
    @ApiProperty({
      example: 'I am interested in this position.',
    })
    coverNote!: string;
  
    @ApiProperty({
      example: 'Mohammed-Fadi-CV.pdf',
    })
    cvFileName!: string;
  
    @ApiProperty({
      example: 'application/pdf',
    })
    cvContentType!: string;
  
    @ApiProperty({
      example: 245760,
    })
    cvSizeBytes!: number;
  
    @ApiProperty({
      example: '2026-11-24T10:30:00.000Z',
    })
    appliedAt!: Date;
  }

  
export class CreateApplicationResponseDto {
    @ApiProperty({
      example: 'Application submitted successfully',
    })
    message!: string;
  
    @ApiProperty({
      type: CreatedApplicationDetailsDto,
    })
    application!: CreatedApplicationDetailsDto;
  }


export class ApplicationQueryDto {
  @ApiPropertyOptional({
    description: 'Number of applications to retrieve',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Cursor for retrieving the next page',
    example: 'eyJ...',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
  