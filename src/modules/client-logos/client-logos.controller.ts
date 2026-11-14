import {BadRequestException, Body, Controller, FileTypeValidator, Get, Header, HttpCode, HttpStatus,
Ip, MaxFileSizeValidator, ParseFilePipe, Post, Query, UploadedFile, UseInterceptors} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {ApiBody,ApiConsumes,ApiCreatedResponse,ApiOkResponse,ApiOperation,ApiTags} from '@nestjs/swagger';
import { ClientLogosService } from './client-logos.service';
import { ClientLogosListDto, ClientLogosResponseDto, CreateClientLogosDto} from './dtos/client-logos.dto';
import { CurrentAdmin } from 'src/core/decorators/current-admin.decorator';
import type { AuthenticatedAdmin } from 'src/core/interfaces/jwt-payload.interface';
import { AdminRoute } from 'src/core/decorators/admin-route.decorator';
import { Public } from 'src/core/decorators/public.decorator';
import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_REGEX = /^image\/(jpeg|png|webp)$/;

// One controller for the module. The base path is empty, so each route spells out its
// full path: public/... needs no login (@Public), admin/... is locked by the global guard.
@Controller()
export class ClientLogosController {
  constructor(private readonly clientLogosService: ClientLogosService) {}

  /* ---------- Public: what the website reads ---------- */

  @Public()
  @ApiTags('Public')
  @Get('public/client-logos')
  // Browsers and CDNs may reuse the answer for a minute
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Client logos shown on the website' })
  @ApiOkResponse({ type: ClientLogosListDto })
  listPublic(@Query() query: PaginationQueryDto) {
    return this.clientLogosService.getLogos(query);
  }

  /* ---------- Admin ---------- */

  @AdminRoute('Client Logo')
  @Get('admin/client-logos')
  @ApiOperation({ summary: 'List client logos' })
  @ApiOkResponse({ type: ClientLogosListDto })
  listAdmin(@Query() query: PaginationQueryDto) {
    return this.clientLogosService.getLogos(query);
  }

  @AdminRoute('Client Logo')
  @Post('admin/client-logos')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a client logo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'ABC Company',
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['name', 'image'],
    },
  })
  @ApiCreatedResponse({ type: ClientLogosResponseDto })
  createClientLogo(
    @Body() dto: CreateClientLogosDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Ip() ip: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE,
            message: 'File size must not exceed 2 MB',
          }),
          new FileTypeValidator({ fileType: ALLOWED_MIME_REGEX }),
        ],
        fileIsRequired: true,
        exceptionFactory: (error) => {
          if (error.includes('size')) {
            return new BadRequestException('File size must not exceed 2 MB');
          }

          if (error.includes('type')) {
            return new BadRequestException(
              'Only JPG, PNG, and WebP files are allowed',
            );
          }

          return new BadRequestException(error);
        },
      }),
    )
    image: Express.Multer.File,
  ) {
    return this.clientLogosService.createLogos(
      dto,
      { adminId: admin.id, ip },
      image,
    );
  }
}
