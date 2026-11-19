import { ApiProperty } from '@nestjs/swagger';

export class WebLinkDetailsDto {
  @ApiProperty({
    example: 'thijar_web',
    description: 'Setting key',
  })
  key!: string;

  @ApiProperty({
    example: 'https://www.example.com',
    description: 'Saved website URL',
  })
  value!: string;

  @ApiProperty({
    example: '2026-11-19T11:43:28.692Z',
    description: 'Last updated date and time',
  })
  updatedAt!: Date;
}

export class CreateWebLinkResponseDto {
  @ApiProperty({
    example: 'Web link added successfully',
  })
  message!: string;

  @ApiProperty({
    type: WebLinkDetailsDto,
  })
  WebLink!: WebLinkDetailsDto;
}