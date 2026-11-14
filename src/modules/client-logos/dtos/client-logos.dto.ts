import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';



export class CreateClientLogosDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ApiProperty({ description: 'Add company name', example: 'ABC company' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  // @ApiProperty({description:'Upload logo'})
  // @IsString()
  // imageKey: string
}

export class UpdateClientLogosDto extends PartialType(CreateClientLogosDto) {}

export class ClientLogosResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({
    description: 'Temporary link to the logo image. Use it directly as the <img> src.',
  })
  imageUrl!: string;
}
export class ClientLogosListDto {
  @ApiProperty({ type: [ClientLogosResponseDto] })
  items!: ClientLogosResponseDto[];

  @ApiProperty({ nullable: true, type: String })
  nextCursor!: string | null;
}