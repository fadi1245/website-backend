import { ApiProperty } from '@nestjs/swagger';
import { EmploymentType, JobStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// CREATE JOB REQUEST DTO
export class CreateJobListingDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Accountant',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Job location',
    example: 'Wayanad',
  })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({
    enum: EmploymentType,
    example: EmploymentType.full_time,
  })
  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @ApiProperty({
    description: 'Required experience',
    example: '4-6',
  })
  @IsString()
  @IsNotEmpty()
  experience!: string;

  @ApiProperty({
    description: 'Job description',
    example: 'We are looking for an experienced accountant.',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    enum: JobStatus,
    example: JobStatus.open,
  })
  @IsEnum(JobStatus)
  status!: JobStatus;
}

// CREATED JOB DETAILS RESPONSE DTO
export class CreatedJobDetailsDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: 'Accountant',
  })
  title!: string;

  @ApiProperty({
    example: 'Wayanad',
  })
  location!: string;

  @ApiProperty({
    enum: EmploymentType,
    example: EmploymentType.full_time,
  })
  employmentType!: EmploymentType;

  @ApiProperty({
    example: '4-6',
  })
  experience!: string;

  @ApiProperty({
    example: 'We are looking for an experienced accountant.',
  })
  description!: string;

  @ApiProperty({
    enum: JobStatus,
    example: JobStatus.open,
  })
  status!: JobStatus;

  @ApiProperty({
    example: '2026-11-20T10:30:00.000Z',
  })
  createdAt!: Date;
}

// CREATE JOB RESPONSE DTO
export class CreateJobResponseDto {
  @ApiProperty({
    example: 'Job added successfully',
  })
  message!: string;

  @ApiProperty({
    type: CreatedJobDetailsDto,
  })
  created!: CreatedJobDetailsDto;
}

export class UpdateJobListingDto extends CreateJobListingDto{}

export class GetJobListingDto {
  @ApiProperty({
    description: 'Job-listing',
    type:CreateJobListingDto,
    nullable: true
  })
  job!: CreateJobListingDto | null;
}


export class JobListingQueryDto {

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @IsString()
    cursor?: string;

}