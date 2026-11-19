import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateWebDto {
  @ApiProperty({
    description: 'Website URL',
    example: 'https://www.example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
  })
  @MaxLength(255)
  WebLink!: string;
}

