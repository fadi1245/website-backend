import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isEmail } from 'class-validator';
import { PrismaService } from '../../database/prisma.service';
import { PaginationQueryDto } from '../../shared/dtos/pagination-query.dto';
import { AuditService } from '../../shared/utils/audit.service';
import {
  Page,
  PaginationService,
  SortField,
} from '../../shared/utils/pagination.service';
import {
  ContactInfoResponseDto,
  ContactKindValue,
  CreateContactInfoDto,
  PublicContactInfoResponseDto,
  UpdateContactInfoDto,
} from './dtos/contact-info.dto';

/** Who made the change, for the audit log. */
export interface Actor {
  adminId: string;
  ip?: string;
}

// Display order: sortOrder, then creation date, then id so ties are stable
const CONTACT_ORDER: SortField[] = [
  { field: 'sortOrder', direction: 'asc', type: 'number' },
  { field: 'createdAt', direction: 'asc', type: 'date' },
  { field: 'id', direction: 'asc', type: 'string' },
];

const ADMIN_SELECT = {
  id: true,
  kind: true,
  label: true,
  value: true,
  sortOrder: true,
} as const;

// Lists also fetch createdAt, because the cursor is built from the sort fields.
// toAdmin / toPublic then leave it out of the response.
const LIST_SELECT = { ...ADMIN_SELECT, createdAt: true } as const;

const toAdmin = (row: ContactInfoResponseDto): ContactInfoResponseDto => ({
  id: row.id,
  kind: row.kind,
  label: row.label,
  value: row.value,
  sortOrder: row.sortOrder,
});

const toPublic = (row: ContactInfoResponseDto): PublicContactInfoResponseDto => ({
  id: row.id,
  kind: row.kind,
  label: row.label,
  value: row.value,
});

// Contact details are short lists, so one call normally returns all of them
const DEFAULT_LIMIT = 100;

@Injectable()
export class ContactInfoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
    private readonly audit: AuditService,
  ) {}

  list(query: PaginationQueryDto): Promise<Page<ContactInfoResponseDto>> {
    return this.pagination.paginate({
      order: CONTACT_ORDER,
      limit: query.limit ?? DEFAULT_LIMIT,
      cursor: query.cursor,
      fetch: (args) => this.prisma.contactInfo.findMany({ ...args, select: LIST_SELECT }),
      map: toAdmin,
    });
  }

  /** What the website shows: no sortOrder or other internals. */
  listPublic(query: PaginationQueryDto): Promise<Page<PublicContactInfoResponseDto>> {
    return this.pagination.paginate({
      order: CONTACT_ORDER,
      limit: query.limit ?? DEFAULT_LIMIT,
      cursor: query.cursor,
      fetch: (args) => this.prisma.contactInfo.findMany({ ...args, select: LIST_SELECT }),
      map: toPublic,
    });
  }

  async create(dto: CreateContactInfoDto, actor: Actor): Promise<ContactInfoResponseDto> {
    this.assertValueMatchesKind(dto.kind, dto.value);

    const created = await this.prisma.contactInfo.create({
      data: { kind: dto.kind, label: dto.label, value: dto.value },
      select: ADMIN_SELECT,
    });

    await this.audit.log({
      adminUserId: actor.adminId,
      action: 'contact_info.create',
      entityType: 'contact_info',
      entityId: created.id,
      metadata: { kind: created.kind, label: created.label },
      ipAddress: actor.ip,
    });
    return created;
  }

  async update(
    id: string,
    dto: UpdateContactInfoDto,
    actor: Actor,
  ): Promise<ContactInfoResponseDto> {
    const existing = await this.findOrThrow(id);

    // Only the fields that were actually sent
    const data: Partial<Pick<CreateContactInfoDto, 'kind' | 'label' | 'value'>> = {};
    if (dto.kind !== undefined) data.kind = dto.kind;
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.value !== undefined) data.value = dto.value;
    if (Object.keys(data).length === 0) return existing;

    this.assertValueMatchesKind(data.kind ?? existing.kind, data.value ?? existing.value);

    const updated = await this.prisma.contactInfo.update({
      where: { id },
      data,
      select: ADMIN_SELECT,
    });

    await this.audit.log({
      adminUserId: actor.adminId,
      action: 'contact_info.update',
      entityType: 'contact_info',
      entityId: id,
      metadata: { kind: updated.kind, label: updated.label },
      ipAddress: actor.ip,
    });
    return updated;
  }

  async remove(id: string, actor: Actor): Promise<void> {
    const existing = await this.findOrThrow(id);
    await this.prisma.contactInfo.delete({ where: { id } });

    await this.audit.log({
      adminUserId: actor.adminId,
      action: 'contact_info.delete',
      entityType: 'contact_info',
      entityId: id,
      metadata: { kind: existing.kind, label: existing.label },
      ipAddress: actor.ip,
    });
  }

  private async findOrThrow(id: string): Promise<ContactInfoResponseDto> {
    const item = await this.prisma.contactInfo.findUnique({
      where: { id },
      select: ADMIN_SELECT,
    });
    if (!item) {
      throw new NotFoundException({
        error: 'not_found',
        message: 'Contact detail not found.',
      });
    }
    return item;
  }
 
  // An email entry must be a real email address (checked here because it depends on two fields)
  private assertValueMatchesKind(kind: ContactKindValue, value: string) {
    if (kind === 'email' && !isEmail(value)) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'Please check the highlighted fields.',
        fieldErrors: { value: 'Enter a valid email address' },
      });
    }
  }
}