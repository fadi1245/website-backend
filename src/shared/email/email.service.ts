
import {
    Injectable,
    InternalServerErrorException,
    Logger,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import * as nodemailer from 'nodemailer';
  import { Transporter } from 'nodemailer';
  
  @Injectable()
  export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: Transporter;
  
    constructor(private readonly configService: ConfigService) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.getOrThrow<string>('SMTP_HOST'),
        port: this.configService.getOrThrow<number>('SMTP_PORT'),
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.getOrThrow<string>('SMTP_USER'),
          pass: this.configService.getOrThrow<string>('SMTP_PASS'),
        },
      });
    }
  
    async verifyConnection(): Promise<boolean> {
      try {
        await this.transporter.verify();
        this.logger.log('Brevo SMTP connection verified successfully');
        return true;
      } catch (error) {
        this.logger.error('Brevo SMTP connection failed', error);
        throw new InternalServerErrorException(
          'Unable to connect to the email service',
        );
      }
    }
  
    async sendTestEmail(to: string) {
      try {
        const fromEmail =
          this.configService.getOrThrow<string>('MAIL_FROM');
  
        const fromName =
          this.configService.get<string>('MAIL_FROM_NAME') ??
          'Thijar Development';
  
        const result = await this.transporter.sendMail({
          from: {
            name: fromName,
            address: fromEmail,
          },
          to,
          subject: 'Brevo SMTP Integration Test',
          text: 'Hello! This is a test email sent from your NestJS backend using Brevo SMTP.',
          html: `
            <h2>Brevo SMTP Integration Test</h2>
            <p>Hello!</p>
            <p>This email was successfully sent from your NestJS backend using Brevo SMTP.</p>
            <p>Your email integration is working.</p>
          `,
        });
  
        this.logger.log(`Test email accepted by SMTP: ${result.messageId}`);
  
        return {
          message: 'Test email submitted successfully',
          messageId: result.messageId,
        };
      } catch (error) {
        this.logger.error('Failed to send test email', error);
        throw new InternalServerErrorException(
          'Failed to send test email',
        );
      }
    }


async sendLeadNotification(lead: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    service: string;
    phoneConsent: boolean;
    message: string | null;
    receivedAt: Date;
  }) {
    const recipient = this.configService.getOrThrow<string>(
      'LEADS_NOTIFICATION_EMAIL',
    );
  
    const fromEmail =
      this.configService.getOrThrow<string>('MAIL_FROM');
  
    const fromName =
      this.configService.get<string>('MAIL_FROM_NAME') ??
      'Thijar Development';
  
    const details = [
      'A new contact form submission has been received.',
      '',
      `Lead ID: ${lead.id}`,
      `Name: ${lead.name}`,
      `Email: ${lead.email ?? 'Not provided'}`,
      `Phone: ${lead.phone ?? 'Not provided'}`,
      `Company: ${lead.company ?? 'Not provided'}`,
      `Service interested in: ${lead.service}`,
      `Phone consent: ${lead.phoneConsent ? 'Yes' : 'No'}`,
      `Received at: ${lead.receivedAt.toISOString()}`,
      '',
      'Message:',
      lead.message ?? 'Not provided',
    ];
  
    return await this.transporter.sendMail({
      from: {
        name: fromName,
        address: fromEmail,
      },
      to: recipient,
      replyTo: lead.email ?? undefined,
      subject: `New Website Enquiry - ${lead.name}`,
      text: details.join('\n'),
    });
  }
  
  }
  