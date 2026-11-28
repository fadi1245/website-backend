import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { AdminRoute } from 'src/core/decorators/admin-route.decorator';
import { CurrentAdmin } from 'src/core/decorators/current-admin.decorator';

import type { AuthenticatedAdmin } from 'src/core/interfaces/jwt-payload.interface';
import { PushNotificationsService } from './push-notification.service';
import {
  PushNotificationsQueryDto,
  SendPushNotificationDto,
} from './dtos/push-notification.dto';

@Controller()
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @AdminRoute('Push notifications')
  @Post('admin/push-notifications')
  @ApiOperation({
    summary: 'Send push notification',
    description:
      'Allows an authenticated admin to send a browser push notification to all subscribed users.',
  })
  @ApiBody({
    type: SendPushNotificationDto,
    description: 'Notification details.',
  })
  @ApiCreatedResponse({
    description: 'Push notification submitted successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid notification details.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to send push notification.',
  })
  async sendNotification(
    @Body() dto: SendPushNotificationDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.pushNotificationsService.sendNotification(dto, admin.id);
  }

  @AdminRoute('Push notifications')
  @Get('admin/push-notifications')
  @ApiOperation({
    summary: 'Get all push notifications',
    description:
      'Returns paginated push notification history for the admin panel.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Cursor from the previous response.',
  })
  @ApiOkResponse({
    description: 'Push notification history retrieved successfully.',
  })
  async getAllNotifications(@Query() query: PushNotificationsQueryDto) {
    return this.pushNotificationsService.getAllNotifications(query);
  }



  @AdminRoute('Push notifications')
  @Get('admin/push-notifications/:id')
  @ApiOperation({
    summary: 'Get push notification by ID',
    description: 'Returns the details of a specific push notification.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the push notification.',
    example: 'b018dbc2-ab59-4af2-b766-e6bb16f5d759',
  })
  @ApiOkResponse({
    description: 'Push notification retrieved successfully.',
  })
  @ApiNotFoundResponse({
    description: 'Push notification not found.',
  })
  async getNotificationById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.pushNotificationsService.getNotificationById(id);
  }
}
