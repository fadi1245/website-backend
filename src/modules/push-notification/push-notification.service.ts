
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
  } from '@nestjs/common';
  import { PrismaService } from 'src/database/prisma.service';
  import { OneSignalService } from './onesignal.service';
  import { PushNotificationsQueryDto, SendPushNotificationDto } from './dtos/push-notification.dto';
  import { isAxiosError } from 'axios';
import { PaginationService, SortField } from 'src/shared/utils/pagination.service';
  

  const PUSH_NOTIFICATIONS_ORDER: SortField[] = [
    { field: 'createdAt', direction: 'desc', type: 'date' },
    { field: 'id', direction: 'desc', type: 'string' },
  ];

  @Injectable()
  export class PushNotificationsService {
    private readonly logger = new Logger(PushNotificationsService.name);
  
    constructor(
      private readonly prismaService: PrismaService,
      private readonly oneSignalService: OneSignalService,
      private readonly pagination: PaginationService,
    ) {}
  
    async sendNotification(
      dto: SendPushNotificationDto,
      adminId: string,
    ) {
      // Step 1: Save notification history.
      const notification = await this.prismaService.pushNotification.create({
        data: {
          title: dto.title,
          message: dto.message,
          url: dto.url || null,
          category: dto.category,
          status: 'pending',
          sentById: adminId,
        },
      });
  
      // Step 2: Mark notification as sending.
      await this.prismaService.pushNotification.update({
        where: {
          id: notification.id,
        },
        data: {
          status: 'sending',
        },
      });
  
      // Step 3: Send through OneSignal.
      let oneSignalResponse;
  
      try {
        oneSignalResponse =
          await this.oneSignalService.sendNotification(
            dto.title,
            dto.message,
            dto.url,
          );
  
        // HTTP 200 does not always mean a notification was created.
        if (!oneSignalResponse.id) {
          throw new Error(
            `OneSignal did not create the notification: ${JSON.stringify(
              oneSignalResponse.errors ?? 'No notification ID returned',
            )}`,
          );
        }
      } catch (error) {
        const errorDetails = isAxiosError(error)
          ? error.response?.data
          : error instanceof Error
            ? error.message
            : error;
  
        this.logger.error(
          'OneSignal notification failed',
          JSON.stringify(errorDetails),
        );
  
        try {
          await this.prismaService.pushNotification.update({
            where: {
              id: notification.id,
            },
            data: {
              status: 'failed',
            },
          });
        } catch (updateError) {
          this.logger.error(
            'Failed to update notification status',
            updateError instanceof Error ? updateError.stack : String(updateError),
          );
        }
  
        throw new InternalServerErrorException(
          'Failed to send push notification',
        );
      }
  
      // Step 4: OneSignal accepted the notification.
      // Update history separately so we don't mark an accepted
      // notification as failed if this database update fails.
      try {
        const updatedNotification =
          await this.prismaService.pushNotification.update({
            where: {
              id: notification.id,
            },
            data: {
              status: 'sent',
              oneSignalId: oneSignalResponse.id,
              sentAt: new Date(),
            },
          });
  
        return {
          message: 'Push notification submitted successfully',
          notification: updatedNotification,
        };
      } catch (error) {
        this.logger.error(
          `OneSignal accepted notification ${oneSignalResponse.id}, but database history update failed`,
          error instanceof Error ? error.stack : String(error),
        );
  
        throw new InternalServerErrorException(
          'Notification was accepted by OneSignal, but its history could not be updated',
        );
      }
    }


async getAllNotifications(query: PushNotificationsQueryDto) {
    try {
      return await this.pagination.paginate({
        order: PUSH_NOTIFICATIONS_ORDER,
        limit: query.limit ?? 20,
        cursor: query.cursor,
  
        fetch: (args) =>
          this.prismaService.pushNotification.findMany({
            ...args,
            select: {
              id: true,
              title: true,
              message: true,
              url: true,
              category: true,
              status: true,
              oneSignalId: true,
              sentAt: true,
              createdAt: true,
              sentBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          }),
  
        map: (row) => row,
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
  
      this.logger.error(
        'Failed to fetch push notification history',
        error instanceof Error ? error.stack : String(error),
      );
  
      throw new InternalServerErrorException(
        'Failed to fetch push notification history',
      );
    }
  }
  

  async getNotificationById(id: string) {
    try {
      const notification =
        await this.prismaService.pushNotification.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            message: true,
            url: true,
            category: true,
            status: true,
            oneSignalId: true,
            sentAt: true,
            createdAt: true,
            updatedAt: true,
            sentBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
  
      if (!notification) {
        throw new NotFoundException('Push notification not found');
      }
  
      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
  
      this.logger.error(
        'Failed to fetch push notification',
        error instanceof Error ? error.stack : String(error),
      );
  
      throw new InternalServerErrorException(
        'Failed to fetch push notification',
      );
    }
  }
  }
  