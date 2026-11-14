import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface AuditEntry {
  adminUserId?: string | null;
  /** For example contact_info.create, lead.delete, installer.upload */
  action: string;
  /** For example contact_info, lead, application */
  entityType: string;
  entityId?: string | null;
  /** Small context only. Never passwords, tokens or personal text. */
  metadata?: Record<string, string | number | boolean | null>;
  ipAddress?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Records an admin action. A failure here is logged but never breaks the request. */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          adminUserId: entry.adminUserId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Could not write audit log for ${entry.action}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}