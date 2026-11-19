import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AuditService } from 'src/shared/utils/audit.service';
import { Page, PaginationService, SortField } from 'src/shared/utils/pagination.service';
import { ClientLogosResponseDto, CreateClientLogosDto, UpdateClientLogosDto } from './dtos/client-logos.dto';
import { PaginationQueryDto } from 'src/shared/dtos/pagination-query.dto';
import { S3Service } from 'src/shared/utils/S3.service';

export interface Actor {
  adminId: string;
  ip?: string;
}

// What the DB returns
interface ClientLogoRow {
  id: string;
  name: string;
  imageKey: string;
}

const CLIENT_ORDER: SortField[] = [
  { field: 'sortOrder', direction: 'asc', type: 'number' },
  { field: 'createdAt', direction: 'asc', type: 'date' },
  { field: 'id', direction: 'asc', type: 'string' },
];

const ADMIN_SELECT = { id: true, name: true, imageKey: true } as const;
const LIST_SELECT = { ...ADMIN_SELECT, createdAt: true, sortOrder: true } as const;
const DEFAULT_LIMIT = 100;

@Injectable()
export class ClientLogosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
    private readonly audit: AuditService,
    private readonly s3Service: S3Service,
  ) {}

  // Row -> DTO. The bucket is private, so each logo gets a temporary signed link.
  // Arrow property keeps `this` bound when passed as `map: this.toDto`.
  private toDto = async (row: ClientLogoRow): Promise<ClientLogosResponseDto> => ({
    id: row.id,
    name: row.name,
    imageUrl: await this.s3Service.getSignedUrlObject(row.imageKey),
  });

  getLogos(query: PaginationQueryDto): Promise<Page<ClientLogosResponseDto>> {
    return this.pagination.paginate({
      order: CLIENT_ORDER,
      limit: query.limit ?? DEFAULT_LIMIT,
      cursor: query.cursor,
      fetch: (args) =>
        this.prisma.clientLogo.findMany({ ...args, select: LIST_SELECT }),
      map: this.toDto,
    });
  }

  async createLogos(
    dto: CreateClientLogosDto,
    actor: Actor,
    image: Express.Multer.File,
  ): Promise<ClientLogosResponseDto> {
    // uploadObject already throws proper HTTP errors (400 for bad type, 500 for S3 failure)
    const imageKey = await this.s3Service.uploadImage(image);

    let created: ClientLogoRow;
    try {
      created = await this.prisma.clientLogo.create({
        data: { name: dto.name, imageKey },
        select: ADMIN_SELECT,
      });
    } catch (error) {
      console.error('Prisma create failed:', error);

      // Only runs if the DB insert failed, so the S3 file is orphaned and safe to remove
      try {
        await this.s3Service.deleteObject(imageKey);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded logo from S3:', cleanupError);
      }

      throw new InternalServerErrorException('Failed to save client logo to database');
    }

    // The record now exists. Nothing below may delete the S3 file.
    // Add audit logging here if needed, e.g.:
    // await this.audit.log({ adminId: actor.adminId, ip: actor.ip, ... });

    return this.toDto(created);
  }

  async updateClientLogos(
    id: string,
    dto: UpdateClientLogosDto,
    actor: Actor,
    image?: Express.Multer.File,
  ): Promise<ClientLogosResponseDto> {
    if (dto.name === undefined && !image) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'Send a new name, a new image, or both.',
      });
    }

    const existing = await this.prisma.clientLogo.findUnique({
      where: { id },
      select: ADMIN_SELECT,
    });
    if (!existing) {
      throw new NotFoundException({ error: 'not_found', message: 'Client logo not found.' });
    }

    // Upload the new image first. If this fails, nothing has changed yet.
    const newKey = image ? await this.s3Service.uploadImage(image) : undefined;

    // Only the fields that were sent
    const data: { name?: string; imageKey?: string } = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (newKey) data.imageKey = newKey;

    let updated: ClientLogoRow;
    try {
      updated = await this.prisma.clientLogo.update({
        where: { id },
        data,
        select: ADMIN_SELECT,
      });
    } catch (error) {
      console.error('Prisma update failed:', error);

      // The new file is not attached to any logo, so remove it
      if (newKey) {
        try {
          await this.s3Service.deleteObject(newKey);
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded logo from S3:', cleanupError);
        }
      }

      // Someone deleted this logo while we were working on it
      if ((error as { code?: string }).code === 'P2025') {
        throw new NotFoundException({ error: 'not_found', message: 'Client logo not found.' });
      }
      throw new InternalServerErrorException('Failed to update client logo');
    }

    // The logo now points at the new image, so the old file is no longer needed.
    // If this delete fails it only leaves an unused file behind, so it must not fail the request.
    if (newKey) {
      try {
        await this.s3Service.deleteObject(existing.imageKey);
      } catch (cleanupError) {
        console.error('Failed to delete the old logo from S3:', cleanupError);
      }
    }

    // Add audit logging here if needed, same as in create

    return this.toDto(updated);
  }

  async deleteLogo(id: string, actor: Actor): Promise<void> {
    const existing = await this.prisma.clientLogo.findUnique({
      where: { id },
      select: ADMIN_SELECT,
    });
    if (!existing) {
      throw new NotFoundException({ error: 'not_found', message: 'Client logo not found.' });
    }

    // Delete the database record first, so a logo never points at a missing file
    try {
      await this.prisma.clientLogo.delete({ where: { id } });
    } catch (error) {
      console.error('Prisma delete failed:', error);

      // Someone else deleted this logo while we were working on it
      if ((error as { code?: string }).code === 'P2025') {
        throw new NotFoundException({ error: 'not_found', message: 'Client logo not found.' });
      }
      throw new InternalServerErrorException('Failed to delete client logo');
    }

    // The record is gone, so the image file is no longer needed.
    // If this delete fails it only leaves an unused file behind, so it must not fail the request.
    try {
      await this.s3Service.deleteObject(existing.imageKey);
    } catch (cleanupError) {
      console.error('Failed to delete the logo from S3:', cleanupError);
    }

    // Add audit logging here if needed, same as in create
  }
}