
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OneSignalNotificationResponse {
  id?: string;
  recipients?: number;
  errors?: unknown;
}

@Injectable()
export class OneSignalService {
  private readonly appId: string;
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.onesignal.com/notifications';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.appId = this.configService.getOrThrow<string>(
      'ONESIGNAL_APP_ID',
    );

    this.apiKey = this.configService.getOrThrow<string>(
      'ONESIGNAL_REST_API_KEY',
    );
  }

  async sendNotification(
    title: string,
    message: string,
    url?: string,
  ): Promise<OneSignalNotificationResponse> {
    const payload = {
      app_id: this.appId,
      target_channel: 'push',
      included_segments: ['Subscribed Users'],
      headings: {
        en: title,
      },
      contents: {
        en: message,
      },
      ...(url && { url }),
    };

    const response = await firstValueFrom(
      this.httpService.post<OneSignalNotificationResponse>(
        this.apiUrl,
        payload,
        {
          headers: {
            Authorization: `Key ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }
}
