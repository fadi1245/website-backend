import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LeadStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateLeadsDto{
    @ApiProperty({
        description: 'name',
        example: 'customer'
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name!: string;

    @ApiPropertyOptional({
        description:'email',
        example:"customer@gmail.com"
    })
    @IsOptional()
    @IsEmail()
    @MaxLength(250)
    email!:string

    @ApiPropertyOptional({
        description:'phone number',
        example:"1234567890"
    })
    @IsString()
    @IsOptional()
    @MaxLength(20)
    phone!:string

    @ApiPropertyOptional({
        description:"company name",
        example:'my company'
    })
    @IsString()
    @IsOptional()
    @MaxLength(150)
    company!: string

    @ApiProperty({
        description:"Service requested",
        example:"Accounting"
    })
    @IsString()
    @IsNotEmpty()
    service!: string

    @ApiProperty({
        description:'consent to contact via phone',
        example:true
    })
    @IsBoolean()
    phoneConsent!: boolean

    @ApiPropertyOptional({
        description:"Attaching messege",
        example:"this is a messege"
    })
    @IsString()
    @IsOptional()
    @MaxLength(5000)
    message!: string
}

export class CreateLeadsResponseDataDto {
    @ApiProperty()
    id!: string;
  
    @ApiProperty()
    name!: string;
  
    @ApiProperty({ nullable: true })
    email!: string | null;
  
    @ApiProperty({ nullable: true })
    phone!: string | null;
  
    @ApiProperty({ nullable: true })
    company!: string | null;
  
    @ApiProperty()
    service!: string;
  
    @ApiProperty()
    phoneConsent!: boolean;
  
    @ApiProperty({ nullable: true })
    phoneConsentAt!: Date | null;
  
    @ApiProperty({ nullable: true })
    message!: string | null;
  
    @ApiProperty()
    receivedAt!: Date;
  }

  export class CreateLeadsResponseDto {
    @ApiProperty({
      example: 'Lead added successfully',
    })
    message!: string;
  
    @ApiProperty({
      type: CreateLeadsResponseDataDto,
    })
    created!: CreateLeadsResponseDataDto;
  }

  
  export class UpdateLeadsDto {
    @ApiProperty({
      description: 'Updated lead status',
      enum: LeadStatus,
      example: LeadStatus.contacted,
    })
    @IsEnum(LeadStatus)
    status!: LeadStatus;
  }

  export class LeadsQueryDto {

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