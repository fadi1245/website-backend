import { ApiProperty } from '@nestjs/swagger';

export class InstallerDetailsDto {
  @ApiProperty({
    description: 'Unique installer release ID',
    example: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
  })
  id!: string;

  @ApiProperty({
    description: 'Original installer filename',
    example: 'THIJAR-ERP-Setup.exe',
  })
  fileName!: string;

  @ApiProperty({
    description: 'Installer version',
    example: '2.4.1',
  })
  version!: string;

  @ApiProperty({
    description: 'Installer file size in bytes',
    example: 115343360,
  })
  sizeBytes!: number;

  @ApiProperty({
    description: 'Date and time when the installer was uploaded',
    example: '2026-11-19T05:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  uploadedAt!: Date;
}

export class GetInstallerResponseDto {
  @ApiProperty({
    description: 'Current installer details. Null when no installer has been uploaded.',
    type: InstallerDetailsDto,
    nullable: true,
  })
  installer!: InstallerDetailsDto | null;
}