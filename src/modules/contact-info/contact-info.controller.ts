import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    HttpCode,
    HttpStatus,
    Ip,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
  } from '@nestjs/common';
  import {
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
  } from '@nestjs/swagger';
  import { AdminRoute } from '../../core/decorators/admin-route.decorator';
  import { CurrentAdmin } from '../../core/decorators/current-admin.decorator';
  import { Public } from '../../core/decorators/public.decorator';
  import type { AuthenticatedAdmin } from '../../core/interfaces/jwt-payload.interface';
  import { PaginationQueryDto } from '../../shared/dtos/pagination-query.dto';
  import { ContactInfoService } from './contact-info.service';
  import {
    ContactInfoListDto,
    ContactInfoResponseDto,
    CreateContactInfoDto,
    PublicContactInfoListDto,
    UpdateContactInfoDto,
  } from './dtos/contact-info.dto';
  
  // One controller for the module. The base path is empty, so each route spells out
  // its full path: public/... needs no login (@Public), admin/... is locked by the
  // global guard.
  @Controller()
  export class ContactInfoController {
    constructor(private readonly contactInfoService: ContactInfoService) {}
  
    /* ---------- Public: what the website reads ---------- */
  
    @Public()
    @ApiTags('Public')
    @Get('public/contact-info')
    // Browsers and CDNs may reuse the answer for a minute
    @Header('Cache-Control', 'public, max-age=60')
    @ApiOperation({ summary: 'Contact details shown on the Contact us page' })
    @ApiOkResponse({ type: PublicContactInfoListDto })
    listPublic(@Query() query: PaginationQueryDto) {
      return this.contactInfoService.listPublic(query);
    }
  
    /* ---------- Admin ---------- */
  
    @AdminRoute('Contact info')
    @Get('admin/contact-info')
    @ApiOperation({ summary: 'List contact details in display order' })
    @ApiOkResponse({ type: ContactInfoListDto })
    list(@Query() query: PaginationQueryDto) {
      return this.contactInfoService.list(query);
    }
  
    @AdminRoute('Contact info')
    @Post('admin/contact-info')
    @ApiOperation({ summary: 'Add a contact detail' })
    @ApiCreatedResponse({ type: ContactInfoResponseDto })
    create(
      @Body() dto: CreateContactInfoDto,
      @CurrentAdmin() admin: AuthenticatedAdmin,
      @Ip() ip: string,
    ) {
      return this.contactInfoService.create(dto, { adminId: admin.id, ip });
    }
  
    @AdminRoute('Contact info')
    @Patch('admin/contact-info/:id')
    @ApiOperation({ summary: 'Change a contact detail (send only the fields to change)' })
    @ApiOkResponse({ type: ContactInfoResponseDto })
    @ApiNotFoundResponse({ description: 'No contact detail with this id' })
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateContactInfoDto,
      @CurrentAdmin() admin: AuthenticatedAdmin,
      @Ip() ip: string,
    ) {
      return this.contactInfoService.update(id, dto, { adminId: admin.id, ip });
    }
  
    @AdminRoute('Contact info')
    @Delete('admin/contact-info/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a contact detail' })
    @ApiNoContentResponse()
    @ApiNotFoundResponse({ description: 'No contact detail with this id' })
    remove(
      @Param('id', ParseUUIDPipe) id: string,
      @CurrentAdmin() admin: AuthenticatedAdmin,
      @Ip() ip: string,
    ) {
      return this.contactInfoService.remove(id, { adminId: admin.id, ip });
    }
  }