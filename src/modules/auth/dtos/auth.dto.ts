import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@thijar.com' })
  // Emails are stored in lower case, so compare them in lower case
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(254, { message: 'Email is too long' })
  email: string;

  @ApiProperty({ example: 'your-password' })
  @IsString({ message: 'Enter your password' })
  @MinLength(1, { message: 'Enter your password' })
  // bcrypt only reads the first 72 bytes of a password
  @MaxLength(72, { message: 'Password is too long' })
  password: string;
}

export class AdminProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ nullable: true, type: String }) name: string | null;
}

export class AuthTokenResponseDto {
  @ApiProperty({ description: 'Send as Authorization: Bearer <accessToken>' })
  accessToken: string;

  @ApiProperty({ description: 'When this token expires (ISO, UTC)' })
  expiresAt: string;

  @ApiProperty({ type: AdminProfileDto })
  admin: AdminProfileDto;
}

export class MeResponseDto {
  @ApiProperty({ type: AdminProfileDto })
  admin: AdminProfileDto;
}