import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Redirect,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AdminRoute } from '../../core/decorators/admin-route.decorator';
import { ErpDetailsService } from './erp-details.service';

import {
  UpdateInstallerDto,
  UploadInstallerDto,
} from './dtos/create-installer.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { installerUploadOptions } from 'src/shared/utils/installer-upload.config';
import { unlink } from 'fs/promises';
import { GetInstallerResponseDto } from './dtos/installer-response.dto';
import { Public } from 'src/core/decorators/public.decorator';
import { CreateWebDto } from './dtos/create-web.dto';
import { WebLinkResponseDto } from './dtos/web-link-resposne.dto';
import { CreateWebLinkResponseDto } from './dtos/create-installer-response.dto';

@ApiTags('ERP Details')
@Controller()
export class ErpDetailsController {
  constructor(private readonly erpDetailsService: ErpDetailsService) {}

  @AdminRoute('ERP Details')
  @Post('admin/erp-downloads/installer/upload')
  @UseInterceptors(FileInterceptor('file', installerUploadOptions))
  @ApiOperation({
    summary: 'Upload ERP installer',
    description:
      'Uploads a new ERP installer executable to S3 and saves its version and file metadata in the database. Only one current installer is maintained. The uploaded file is validated before storage.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'ERP installer version and executable file.',
    schema: {
      type: 'object',
      properties: {
        version: {
          type: 'string',
          example: '2.4.1',
          description: 'Version number of the ERP installer.',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'ERP installer executable (.exe), maximum size 500 MB.',
        },
      },
      required: ['version', 'file'],
    },
  })
  @ApiCreatedResponse({
    description: 'ERP installer uploaded successfully.',
    schema: {
      example: {
        message: 'ERP installer uploaded successfully',
        installer: {
          id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
          fileName: 'ERP-a1b2c3d4e5f6.exe',
          version: '2.4.1',
          sizeBytes: 115343360,
          uploadedAt: '2026-11-19T05:30:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Missing file, invalid version, invalid executable, or file size exceeds the allowed limit.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid installer file',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required or the token is invalid.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Please sign in to continue.',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Installer upload failed because of an unexpected S3 or database error.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to upload installer',
      },
    },
  })
  async uploadInstaller(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadInstallerDto,
  ) {
    if (!file) {
      throw new BadRequestException('No installer file received');
    }
  
    console.log('INSTALLER TEMP FILE CREATED:', file.path);
  
    try {
      return await this.erpDetailsService.uploadInstaller(file, dto);
    } finally {
      await unlink(file.path).catch(() => undefined);
      console.log('INSTALLER TEMP FILE DELETED:', file.path);
    }
  }

  @AdminRoute('ERP Details')
  @Get('admin/erp-downloads/installer')
  @ApiOperation({
    summary: 'Get current ERP installer',
    description:
      'Retrieves the currently uploaded ERP installer details for the admin panel. Returns installer as null if no installer has been uploaded.',
  })
  @ApiOkResponse({
    description: 'Installer details retrieved successfully.',
    type: GetInstallerResponseDto,
    schema: {
      example: {
        installer: {
          id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
          fileName: 'THIJAR-ERP-Setup.exe',
          version: '2.4.1',
          sizeBytes: 115343360,
          uploadedAt: '2026-11-19T05:30:00.000Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description:
      'The authenticated user does not have permission to access this resource.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'An unexpected server error occurred while retrieving the installer.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async getInstaller(): Promise<GetInstallerResponseDto> {
    return this.erpDetailsService.getInstaller();
  }

  @AdminRoute('ERP Details')
  @Delete('admin/erp-downloads/installer')
  @ApiOperation({
    summary: 'Delete current ERP installer',
    description:
      'Deletes the currently uploaded ERP installer from S3 and removes its database record. If no installer exists, returns 404.',
  })
  @ApiOkResponse({
    description: 'Installer deleted successfully.',
    schema: {
      example: {
        message: 'Installer deleted successfully',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No installer release was found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Installer not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description:
      'The authenticated user does not have permission to delete the installer.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'S3 deletion or database deletion failed. Check the error message to determine whether the file or database record remains.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Could not delete file from s3',
        error: 'Internal Server Error',
      },
    },
  })
  async deleteInstaller() {
    return this.erpDetailsService.deleteInstaller();
  }

  @AdminRoute('ERP Details')
  @Patch('admin/erp-downloads/installer/:id')
  @ApiOperation({
    summary: 'Update ERP installer version',
    description:
      'Updates only the version field of the current ERP installer. The executable file and its associated metadata remain unchanged.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique ID of the installer release',
    example: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
  })
  @ApiBody({
    type: UpdateInstallerDto,
  })
  @ApiOkResponse({
    description: 'Installer version updated successfully.',
    schema: {
      example: {
        message: 'Installer version updated successfully',
        installer: {
          id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
          fileName: 'THIJAR-ERP-Setup.exe',
          version: '2.5.0',
          sizeBytes: 115343360,
          uploadedAt: '2026-11-19T05:30:00.000Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Installer with the supplied ID was not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Installer not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required.',
  })
  @ApiForbiddenResponse({
    description:
      'The authenticated user does not have permission to update the installer.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or installer ID.',
  })
  @ApiInternalServerErrorResponse({
    description: 'An unexpected server error occurred.',
  })
  async updateInstaller(
    @Param('id') id: string,
    @Body() dto: UpdateInstallerDto,
  ) {
    return this.erpDetailsService.updateInstaller(id, dto);
  }

  @Public()
  @Get('erp-downloads/installer/download')
  @Redirect()
  @ApiOperation({
    summary: 'Download ERP installer',
    description:
      'Generates a temporary signed S3 URL and redirects the visitor to download the current ERP installer. No authentication is required.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects the visitor to the installer download URL.',
  })
  @ApiNotFoundResponse({
    description: 'No ERP installer is currently available.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Installer not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Could not generate the installer download URL.',
  })
  async downloadInstaller() {
    const url = await this.erpDetailsService.getInstallerDownloadUrl();

    return {
      url,
      statusCode: 302,
    };
  }

  @AdminRoute('ERP Details')
  @Put('admin/web-link')
  @ApiOperation({
    summary: 'Save Web Link',
    description:
      'Creates the web link if it does not exist, or updates it if it already exists.',
  })
  @ApiBody({ type: CreateWebDto })
  @ApiOkResponse({
    description: 'Web link saved successfully',
    type: CreateWebLinkResponseDto
  })
  @ApiBadRequestResponse({
    description: 'Invalid web link provided',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to save web link',
  })
  async createWebLink(@Body() dto: CreateWebDto) {
    return this.erpDetailsService.createWebLink(dto);
  }

  @AdminRoute('ERP Details')
  @Get('admin/web-link')
  @ApiOperation({
    summary: 'Get Web Link',
    description: 'Retrieve the currently configured website link.',
  })
  @ApiOkResponse({
    description: 'Web link retrieved successfully',
    type: WebLinkResponseDto,
  })  @ApiUnauthorizedResponse({
    description: 'Authentication required or invalid token',
  })
  @ApiNotFoundResponse({ description: 'Web link not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getWebLink() {
    return this.erpDetailsService.getWebLink();
  }

  @Public()
  @Get('web-link')
  @ApiOperation({
    summary: 'Get Public Web Link',
    description: 'Retrieve the website link for the public website.',
  })
  @ApiOkResponse({
    description: 'Web link retrieved successfully',
    type: WebLinkResponseDto,
  })  @ApiNotFoundResponse({ description: 'Web link not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  async getPublicWebLink() {
    return this.erpDetailsService.getWebLink();
  }
}
