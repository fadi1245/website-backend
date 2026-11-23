import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { JobListingService } from './job-listing.service';
import { AdminRoute } from 'src/core/decorators/admin-route.decorator';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CreateJobListingDto,
  CreateJobResponseDto,
  GetJobListingDto,
  JobListingQueryDto,
  UpdateJobListingDto,
} from './dtos/job-listing.dto';
import { Public } from 'src/core/decorators/public.decorator';

@Controller()
export class JobListingController {
  constructor(private readonly jobListingService: JobListingService) {}



  @Public()
  @Get('job-listings/jobs')
  @ApiOperation({
    summary: 'Get all job listings',
    description: 'Retrieve job listings using cursor-based pagination.',
  })
  @ApiOkResponse({
    description: 'Job listings retrieved successfully.',
  })
  async getAllJoblistingPublic(@Query() query: JobListingQueryDto) {
    return this.jobListingService.getallJob(query);
  }

  @Public()
  @Get('job-listings/:id')
  @ApiOperation({
    summary: 'Get job listing by ID',
  })
  @ApiOkResponse({
    description: 'Job listing retrieved successfully.',
    type: GetJobListingDto,
  })
  @ApiNotFoundResponse({
    description: 'Job listing not found.',
  })
  async getJobListByIdPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobListingService.getById(id);
  }

  @AdminRoute('Job-listing')
  @Post('admin/job-listing')
  @ApiOperation({ summary: 'Add Job title' })
  @ApiCreatedResponse({ type: CreateJobResponseDto })
  createJob(@Body() dto: CreateJobListingDto) {
    return this.jobListingService.createJobListing(dto);
  }

  @AdminRoute('Job-listing')
  @Get('admin/job-listings/:id')
  @ApiOkResponse({
    description: 'Job lisings retieved successfully.',
    type: GetJobListingDto,
    schema: {
      example: {
        job: {
          id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
          title: 'Jnr Accountant',
          location: 'Wayanad',
          employmentType: 'full_time',
          experience: '4-6',
          description: 'We are looking for an experienced accountant.',
          status: 'open',
          createdAt: '2026-11-23T08:44:51.504Z',
          updatedAt: '2026-11-23T08:47:56.339Z',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Job listing not found.',
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
      'An unexpected server error occurred while retrieving the Job.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async getJobListById(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobListingService.getById(id);
  }

  @AdminRoute('Job-listing')
  @Get('admin/job-listings/jobs')
  @ApiOperation({
    summary: 'Get all job-listing',
    description: 'Retreive all job-listing ',
  })
  @ApiOkResponse({
    description: 'Job listings retrieved successfully.',
    schema: {
      example: [
        {
          id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
          title: 'Junior Accountant',
          location: 'Wayanad',
          employmentType: 'full_time',
          experience: '4-6',
          description: 'We are looking for an experienced accountant.',
          status: 'open',
        },
      ],
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
      'An unexpected server error occurred while retrieving the Jobs.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async getAllJoblisting(@Query() query: JobListingQueryDto) {
    return this.jobListingService.getallJob(query);
  }

  @AdminRoute('Job-listing')
  @Patch('admin/job-listing/:id')
  @ApiOperation({ summary: 'Update Job listing' })
  @ApiOkResponse({ type: CreateJobResponseDto })
  @ApiNotFoundResponse({ description: 'No Job with this id' })
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
      'An unexpected server error occurred while retrieving the Jobs.',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobListingDto,
  ) {
    return this.jobListingService.updateJobListing(id, dto);
  }

  @AdminRoute('Job-listing')
  @Delete('admin/job-listing/:id')
  @ApiOperation({
    summary: 'Delete Job Listing by id',
    description:
      'Delete Job-listing by given id, If no installer exists, returns 404.',
  })
  @ApiOkResponse({
    description: 'Job-listing deleted successfully.',
    schema: {
      example: {
        message: 'Job-listing deleted successfully.',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No job was found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Job not found',
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
      'The authenticated user does not have permission to delete the job Listing.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Job Listing deletion failed',
    schema: {
      example: {
        statusCode: 500,
        message: 'Could not delete job-listing',
        error: 'Internal Server Error',
      },
    },
  })
  async deleteJobListing(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobListingService.deleteJobListing(id);
  }
}
