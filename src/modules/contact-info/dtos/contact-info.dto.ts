import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const CONTACT_KINDS = ['email', 'phone', 'location', 'other'] as const;
export type ContactKindValue = (typeof CONTACT_KINDS)[number];

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateContactInfoDto {
  @ApiProperty({ enum: CONTACT_KINDS, description: 'Sets the icon shown on the website' })
  @IsIn(CONTACT_KINDS, { message: 'Choose email, phone, location or other' })
  kind!: ContactKindValue;

  @ApiProperty({ maxLength: 60, example: 'Sales email' })
  @Transform(trim)
  @IsString({ message: 'Enter a label' })
  @MinLength(1, { message: 'Enter a label' })
  @MaxLength(60, { message: 'Label can be up to 60 characters' })
  label!: string;

  @ApiProperty({ maxLength: 300, example: 'sales@thijar.com' })
  @Transform(trim)
  @IsString({ message: 'Enter the contact detail' })
  @MinLength(1, { message: 'Enter the contact detail' })
  @MaxLength(300, { message: 'Contact detail can be up to 300 characters' })
  value!: string;
}

/** PATCH: every field is optional; only the fields sent are changed. */
export class UpdateContactInfoDto extends PartialType(CreateContactInfoDto) {}

export class ContactInfoResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: CONTACT_KINDS }) kind!: ContactKindValue;
  @ApiProperty() label!: string;
  @ApiProperty() value!: string;
  @ApiProperty() sortOrder!: number;
}

export class PublicContactInfoResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: CONTACT_KINDS }) kind!: ContactKindValue;
  @ApiProperty() label!: string;
  @ApiProperty() value!: string;
}

export class ContactInfoListDto {
  @ApiProperty({ type: [ContactInfoResponseDto] }) items!: ContactInfoResponseDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

export class PublicContactInfoListDto {
  @ApiProperty({ type: [PublicContactInfoResponseDto] })
  items!: PublicContactInfoResponseDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}