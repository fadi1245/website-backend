import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Query parameters shared by every list endpoint (cursor pagination). */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    description: 'How many items to return. Each list has its own default.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be a whole number' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit cannot be more than 100' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'The nextCursor from the previous response. Leave out for the first page.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cursor?: string;
}