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
import { LeadsService } from './leads.service';
import { Public } from 'src/core/decorators/public.decorator';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateLeadsDto,
  CreateLeadsResponseDto,
  LeadsQueryDto,
  UpdateLeadsDto,
} from './dtos/leads.dto';
import { AdminRoute } from 'src/core/decorators/admin-route.decorator';

@Controller()
export class LeadsController {
  constructor(private readonly LeadsService: LeadsService) {}

  @Public()
  @Post('leads')
  @ApiOperation({
    summary: 'Submit a lead',
    description:
      'Allows a visitor to submit an enquiry through the public website.',
  })
  @ApiBody({
    type: CreateLeadsDto,
    description: 'Customer enquiry details.',
  })
  @ApiCreatedResponse({
    type: CreateLeadsResponseDto,
    description: 'Lead submitted successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid lead details. At least one of email or phone must be provided.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Lead submission failed because of an unexpected server error.',
  })
  async addLeadPublic(@Body() dto: CreateLeadsDto) {
    return this.LeadsService.createLeads(dto);
  }

  @AdminRoute('leads:update')
  @Patch('admin/leads/:id')
  @ApiOperation({
    summary: 'Update lead status',
    description:
      'Allows an admin to update the status of an existing lead. Supported statuses are new, contacted, and closed.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead to update.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateLeadsDto,
    description: 'Updated lead status.',
  })
  @ApiOkResponse({
    description: 'Lead status updated successfully.',
    schema: {
      example: {
        message: 'Lead updated successfully',
        lead: {
          id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
          name: 'Mohammed Fadi',
          email: 'fadi@example.com',
          phone: '+919876543210',
          company: 'My Company',
          service: 'Accounting',
          phoneConsent: false,
          phoneConsentAt: null,
          message: 'Interested in your services.',
          status: 'contacted',
          receivedAt: '2026-11-25T10:30:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid lead ID or invalid status value.',
  })
  @ApiNotFoundResponse({
    description: 'Lead with the supplied ID was not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Lead not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Lead update failed because of an unexpected server error.',
  })
  async updateLeads(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadsDto,
  ) {
    return this.LeadsService.updateLeads(id, dto);
  }

  @AdminRoute('leads:view')
  @Get('admin/leads')
  @ApiOperation({
    summary: 'Get all leads',
    description:
      'Retrieves all customer leads with cursor-based pagination. Leads are ordered by received date, newest first.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of leads to retrieve per request. Defaults to 20.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    example: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
    description:
      'Cursor ID from the previous response for fetching the next page.',
  })
  @ApiOkResponse({
    description: 'Leads retrieved successfully.',
    schema: {
      example: {
        data: [
          {
            id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
            name: 'Mohammed Fadi',
            email: 'fadi@example.com',
            phone: '+919876543210',
            company: 'My Company',
            service: 'Accounting',
            phoneConsent: true,
            status: 'new',
            receivedAt: '2026-11-25T10:30:00.000Z',
          },
        ],
        nextCursor: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
        hasMore: true,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination limit or cursor.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Failed to retrieve leads because of an unexpected server error.',
  })
  async getAllLeads(@Query() query: LeadsQueryDto) {
    return this.LeadsService.getAllLeads(query);
  }

  @AdminRoute('leads:view')
  @Get('admin/leads/:id')
  @ApiOperation({
    summary: 'Get lead by ID',
    description:
      'Retrieves complete details of a specific customer lead, including contact information, requested service, message, and phone consent details.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead.',
    example: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
  })
  @ApiOkResponse({
    description: 'Lead details retrieved successfully.',
    schema: {
      example: {
        id: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
        name: 'Mohammed Fadi',
        email: 'fadi@example.com',
        phone: '+919876543210',
        company: 'My Company',
        service: 'Accounting',
        phoneConsent: true,
        phoneConsentAt: '2026-11-25T10:30:00.000Z',
        message: 'I am interested in your accounting services.',
        status: 'new',
        receivedAt: '2026-11-25T10:30:00.000Z',
        updatedAt: '2026-11-25T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid lead ID. A valid UUID is required.',
  })
  @ApiNotFoundResponse({
    description: 'Lead with the supplied ID was not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Lead not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Failed to retrieve lead because of an unexpected server error.',
  })
  async getLeadById(@Param('id', ParseUUIDPipe) id: string) {
    return this.LeadsService.getLeadById(id);
  }

  @AdminRoute('leads:delete')
  @Delete('admin/leads/:id')
  @ApiOperation({
    summary: 'Delete lead',
    description: 'Permanently deletes a customer lead from the database.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the lead to delete.',
    example: 'd7b27d92-e744-44dc-ac16-445a5bb67ef9',
  })
  @ApiOkResponse({
    description: 'Lead deleted successfully.',
    schema: {
      example: {
        message: 'Lead deleted successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid lead ID. A valid UUID is required.',
  })
  @ApiNotFoundResponse({
    description: 'Lead with the supplied ID was not found.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Lead not found',
        error: 'Not Found',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete lead because of an unexpected server error.',
  })
  async deleteLead(@Param('id', ParseUUIDPipe) id: string) {
    return this.LeadsService.deleteLead(id);
  }
}
