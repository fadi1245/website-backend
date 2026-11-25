
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
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
    ApiTags,
    ApiUnauthorizedResponse,
  } from '@nestjs/swagger';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { Public } from 'src/core/decorators/public.decorator';  
import { JobApplicationService } from './job-application.service';
import { ApplicationQueryDto, CreateApplicationDto } from './dtos/job-application.dto';
import { applicationUploadOptions } from 'src/shared/utils/application-upload.config';
import { AdminRoute } from 'src/core/decorators/admin-route.decorator';
  @ApiTags('Job Applications')
  @Controller()
  export class JobApplicationController {
    constructor(
      private readonly applicationService: JobApplicationService,
    ) {}
  
    @Public()
    @Post('job-applications')
    @UseInterceptors(
      FileInterceptor('cv', applicationUploadOptions),
    )
    @ApiOperation({
      summary: 'Submit job application',
      description:
        'Allows a candidate to submit an application for an available job listing. Applicant details and CV are submitted using multipart/form-data. The CV is validated and uploaded to the private AWS S3 bucket, while application details and file metadata are stored in PostgreSQL.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      description: 'Applicant details and CV document.',
      schema: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
            description: 'ID of the job listing.',
          },
          name: {
            type: 'string',
            example: 'Mohammed Fadi',
            description: 'Applicant full name.',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'fadi@example.com',
            description: 'Applicant email address.',
          },
          phone: {
            type: 'string',
            example: '+919876543210',
            description: 'Applicant contact number.',
          },
          coverNote: {
            type: 'string',
            example: 'I am interested in applying for this position.',
            description: 'Optional cover note.',
          },
          cv: {
            type: 'string',
            format: 'binary',
            description: 'Applicant CV in PDF format. Maximum size 5 MB.',
          },
        },
        required: ['jobId', 'name', 'email', 'phone', 'cv'],
      },
    })
    @ApiCreatedResponse({
      description: 'Application submitted successfully.',
      schema: {
        example: {
          message: 'Application submitted successfully',
          application: {
            id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
            jobId: '550e8400-e29b-41d4-a716-446655440000',
            jobTitle: 'Junior Accountant',
            name: 'Mohammed Fadi',
            email: 'fadi@example.com',
            phone: '+919876543210',
            coverNote: 'I am interested in applying for this position.',
            cvFileName: 'Mohammed-Fadi-CV.pdf',
            cvContentType: 'application/pdf',
            cvSizeBytes: 245760,
            appliedAt: '2026-11-24T10:30:00.000Z',
          },
        },
      },
    })
    @ApiBadRequestResponse({
      description:
        'Missing CV, invalid applicant details, invalid PDF file, file size exceeded, or applications are closed for the selected job.',
      schema: {
        example: {
          statusCode: 400,
          message: 'Only PDF files are allowed',
          error: 'Bad Request',
        },
      },
    })
    @ApiNotFoundResponse({
      description: 'Job listing with the supplied ID was not found.',
      schema: {
        example: {
          statusCode: 404,
          message: 'Job listing not found',
          error: 'Not Found',
        },
      },
    })
    @ApiInternalServerErrorResponse({
      description:
        'Application submission failed because of an unexpected S3 or database error.',
      schema: {
        example: {
          statusCode: 500,
          message: 'Failed to submit application',
          error: 'Internal Server Error',
        },
      },
    })
    async createApplication(
      @UploadedFile() file: Express.Multer.File,
      @Body() dto: CreateApplicationDto,
    ) {
      if (!file) {
        throw new BadRequestException('No CV file received');
      }
  
      return this.applicationService.createApplication(file, dto);
    }


  @AdminRoute('Job Applications')
  @Get('admin/job-applications/:id')
  @ApiOperation({
    summary: 'Get job application by ID',
    description:
      'Retrieves a single job application using its UUID. Returns applicant details, job information and a temporary five-minute signed S3 URL for downloading the applicant CV. Only authenticated admins can access this endpoint.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique UUID of the job application',
    example: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
  })
  @ApiOkResponse({
    description: 'Application retrieved successfully.',
    schema: {
      example: {
        application: {
          id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
          jobId: '550e8400-e29b-41d4-a716-446655440000',
          jobTitle: 'Junior Accountant',
          name: 'Mohammed Fadi',
          email: 'fadi@example.com',
          phone: '+919876543210',
          coverNote: 'I am interested in this position.',
          cvFileName: 'Mohammed-Fadi-CV.pdf',
          cvContentType: 'application/pdf',
          cvSizeBytes: 245760,
          appliedAt: '2026-11-24T10:30:00.000Z',
          cvDownloadUrl: 'https://example-bucket.s3.amazonaws.com/...',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Application with the supplied ID was not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Application not found',
        error: 'Not Found',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication is required or the token is invalid.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description:
      'The authenticated user does not have permission to access job applications.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'An unexpected database or S3 error occurred while retrieving the application.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to fetch application',
        error: 'Internal Server Error',
      },
    },
  })
  async getApplicationById(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationService.getApplicationById(id);
  }


@AdminRoute('Job Applications')
@Get('admin/job-applications/:id/cv')
@ApiOperation({
  summary: 'Generate application CV download URL',
  description:
    'Generates a temporary five-minute AWS S3 signed URL for downloading an applicant CV. The application must exist. Only authenticated admins can access this endpoint.',
})
@ApiParam({
  name: 'id',
  description: 'Unique UUID of the job application',
  example: '941f3d84-a975-4d70-8adb-ad50410784e0',
})
@ApiOkResponse({
  description: 'CV download URL generated successfully.',
  schema: {
    example: {
      cvDownloadUrl: 'https://your-private-bucket.s3.amazonaws.com/...',
    },
  },
})
@ApiNotFoundResponse({
  description: 'Application with the supplied ID was not found.',
  schema: {
    example: {
      statusCode: 404,
      message: 'Application not found',
      error: 'Not Found',
    },
  },
})
@ApiUnauthorizedResponse({
  description: 'Authentication is required or the token is invalid.',
})
@ApiForbiddenResponse({
  description:
    'The authenticated user does not have permission to download application CVs.',
})
@ApiInternalServerErrorResponse({
  description: 'Failed to generate the CV download URL.',
})
async downloadApplicationCv(
  @Param('id', ParseUUIDPipe) id: string,
) {
  return this.applicationService.getApplicationCvDownloadUrl(id);
}



@AdminRoute('Job Applications')
@Get('admin/job-applications')
@ApiOperation({
  summary: 'Get all job applications',
  description:
    'Retrieves job applications using cursor-based pagination, ordered by application date (newest first). Returns only applicant name, applied-for job title, phone number, application date and ID. Only authenticated admins can access this endpoint.',
})
@ApiOkResponse({
  description: 'Applications retrieved successfully.',
  schema: {
    example: {
      items: [
        {
          id: '941f3d84-a975-4d70-8adb-ad50410784e0',
          name: 'Mohammed Fadi',
          jobTitle: 'Accountant',
          phone: '+919876543210',
          appliedAt: '2026-11-24T11:08:22.601Z',
        },
        {
          id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
          name: 'Ahmed',
          jobTitle: 'Software Developer',
          phone: '+919876543211',
          appliedAt: '2026-11-23T08:44:51.504Z',
        },
      ],
      nextCursor: null,
    },
  },
})
@ApiBadRequestResponse({
  description: 'Invalid pagination limit or cursor.',
  schema: {
    example: {
      statusCode: 400,
      message: 'Invalid pagination cursor',
      error: 'Bad Request',
    },
  },
})
@ApiUnauthorizedResponse({
  description: 'Authentication is required or the token is invalid.',
})
@ApiForbiddenResponse({
  description:
    'The authenticated user does not have permission to view applications.',
})
@ApiInternalServerErrorResponse({
  description: 'An unexpected error occurred while retrieving applications.',
  schema: {
    example: {
      statusCode: 500,
      message: 'Failed to fetch applications',
      error: 'Internal Server Error',
    },
  },
})
async getAllApplications(
  @Query() query: ApplicationQueryDto,
) {
  return this.applicationService.getAllApplications(query);
}



@AdminRoute('Job Applications')
@Delete('admin/job-applications/:id')
@ApiOperation({
  summary: 'Delete job application',
  description:
    'Deletes an applicant CV from the private AWS S3 bucket and removes the corresponding application record from PostgreSQL.',
})
@ApiParam({
  name: 'id',
  description: 'Unique UUID of the job application',
  example: '941f3d84-a975-4d70-8adb-ad50410784e0',
})
@ApiOkResponse({
  description: 'Application deleted successfully.',
  schema: {
    example: {
      message: 'Application deleted successfully',
    },
  },
})
@ApiNotFoundResponse({
  description: 'Application with the supplied ID was not found.',
  schema: {
    example: {
      statusCode: 404,
      message: 'Application not found',
      error: 'Not Found',
    },
  },
})
@ApiUnauthorizedResponse({
  description: 'Authentication is required or the token is invalid.',
})
@ApiForbiddenResponse({
  description:
    'The authenticated user does not have permission to delete applications.',
})
@ApiInternalServerErrorResponse({
  description:
    'S3 deletion or database deletion failed.',
  schema: {
    example: {
      statusCode: 500,
      message: 'CV was deleted from storage, but application record could not be deleted',
      error: 'Internal Server Error',
    },
  },
})
async deleteApplication(
  @Param('id', ParseUUIDPipe) id: string,
) {
  return this.applicationService.deleteApplication(id);
}


  }
  