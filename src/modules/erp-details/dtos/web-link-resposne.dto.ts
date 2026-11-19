import { ApiProperty } from '@nestjs/swagger';

export class WebLinkResponseDto {
  @ApiProperty({
    example: 'https://www.examplenew.com',
    description: 'Currently configured website URL',
  })
  webLink!: string;

  @ApiProperty({
    example: '2026-11-19T10:53:28.594Z',
    description: 'Date and time when the URL was last updated',
  })
  updatedAt!: Date;
}