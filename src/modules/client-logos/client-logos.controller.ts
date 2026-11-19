import {BadRequestException, Body, Controller, Delete, FileTypeValidator, Get, Header, HttpCode, HttpStatus,
Ip, MaxFileSizeValidator, Param, ParseFilePipe, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseInterceptors} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {ApiBody,ApiConsumes,ApiCreatedResponse,ApiNoContentResponse,ApiNotFoundResponse,ApiOkResponse,ApiOperation,ApiTags} from '@nestjs/swagger';
import { ClientLogosService } from './client-logos.service';
import { ClientLogosListDto, ClientLogosResponseDto, CreateClientLogosDto, UpdateClientLogosDto} from './dtos/client-logos.dto';
import { CurrentAdmin } from 'src/core/decorators/current-admin.decorator';
import type { AuthenticatedAdmin } from 'src/core/interfaces/jwt-payload.interface';
import { AdminRoute } from 'src/core/decorators/admin-route.decorator';
import { Public } from 'src/core/decorators/public.decorator';
import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';


const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_REGEX = /^image\/(jpeg|png|webp)$/;

// The same image checks, used when updating a logo (the image is optional there)
const logoFilePipe = (fileIsRequired: boolean) =>
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE, message: 'File size must not exceed 2 MB' }),
      new FileTypeValidator({ fileType: ALLOWED_MIME_REGEX }),
    ],
    fileIsRequired,
    exceptionFactory: (error) => {
      if (error.includes('size')) {
        return new BadRequestException('File size must not exceed 2 MB');
      }
      if (error.includes('type')) {
        return new BadRequestException('Only JPG, PNG, and WebP files are allowed');
      }
      return new BadRequestException(error);
    },
  });

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
  async createClientLogo(
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
  )
  
  {
    const createdLogo = await this.clientLogosService.createLogos(
      dto,
      { adminId: admin.id, ip },
      image,
    );
  
    return {
      message: 'Client logo created successfully',
      data: createdLogo,
    };
  }

  @AdminRoute('Client Logo')
  @Patch('admin/client-logos/:id')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_FILE_SIZE } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a client logo (new name, new image, or both)' })
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
    },
  })
  @ApiOkResponse({ type: ClientLogosResponseDto })
  @ApiNotFoundResponse({ description: 'No client logo with this id' })
  async updateClientLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientLogosDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Ip() ip: string,
    @UploadedFile(logoFilePipe(false)) image?: Express.Multer.File,
  ) {
    const responedata =await this.clientLogosService.updateClientLogos(id, dto, { adminId: admin.id, ip }, image);
    {
      return{
        message:"Updated Clinet Logo",
        responedata
      }
    }
  }

  @AdminRoute('Client Logo')
  @Delete('admin/client-logos/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a client logo and its image' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiNotFoundResponse({ description: 'No client logo with this id' })
  async deleteClientLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Ip() ip: string,
  ) {
    await this.clientLogosService.deleteLogo(id, { adminId: admin.id, ip });
    return{
      message:"Client Logo Deleteds"
    }
  }
}
