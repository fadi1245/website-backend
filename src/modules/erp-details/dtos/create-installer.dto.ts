import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';



  export class UploadInstallerDto {
    @ApiProperty({
      description: 'Installer version entered by admin',
      example: '2.4.1',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    version!: string;
  }

  export class UpdateInstallerDto {
    @ApiProperty({
      description: 'New installer version',
      example: '2.5.0',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    version!: string;
  }