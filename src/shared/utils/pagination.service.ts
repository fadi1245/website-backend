import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export interface SortField {
  field: string;
  direction: 'asc' | 'desc';
  type: 'number' | 'date' | 'string';
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

// Prisma's where and orderBy types differ per model, so they are loosely typed here.
/* eslint-disable @typescript-eslint/no-explicit-any */
interface FetchArgs {
  where?: any;
  orderBy: any[];
  take: number;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cursor pagination for every list in the API.
 *
 *   return this.pagination.paginate({
 *     order: LEAD_ORDER,                      // the sort fields, ending with id
 *     limit: query.limit ?? 20,
 *     cursor: query.cursor,
 *     where: { status: 'new' },               // optional filters
 *     fetch: (args) => this.prisma.lead.findMany({ ...args, select: LIST_SELECT }),
 *     map: (row) => toResponse(row),          // optional: shape each item for the response
 *   });
 *
 * IMPORTANT: the fetched rows must include every sort field (for example createdAt),
 * because the cursor is built from them. Use `map` to leave such fields out of the response.
 *
 * The cursor holds the last item's sort values. It is signed, so it cannot be
 * edited, and it stays valid if that item is deleted before the next page.
 * The last sort field must be unique (the id) so that items with equal sort
 * values keep a stable order.
 */
@Injectable()
export class PaginationService {
  constructor(private readonly config: ConfigService) {}

  async paginate<T extends Record<string, any>, R = T>(options: { // eslint-disable-line @typescript-eslint/no-explicit-any
    order: SortField[];
    limit: number;
    cursor?: string;
    where?: Record<string, unknown>;
    fetch: (args: FetchArgs) => Promise<T[]>;
    map?: (row: T) => R | Promise<R>;
    }): Promise<Page<R>> {
    const { order, limit, cursor, where, fetch, map } = options;

    const values = this.decode(cursor, order);
    const keyset = values ? this.keysetWhere(order, values) : undefined;
    const combinedWhere =
      keyset && where ? { AND: [where, keyset] } : (keyset ?? where);

    // One extra row tells us whether there is a next page
    const rows = await fetch({
      where: combinedWhere,
      orderBy: order.map((o) => ({ [o.field]: o.direction })),
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    return {
      // The cursor is built from the raw row, then each item is shaped for the response
      nextCursor: hasMore && last ? this.encode(order, last) : null,
      items: await Promise.all(
        items.map((row) => (map ? map(row) : (row as unknown as R))),
      ),    };
  }

  /** "Rows after this one": for fields a, b, id this builds
   *  a > x OR (a = x AND b > y) OR (a = x AND b = y AND id > z)  (< when descending). */
  private keysetWhere(order: SortField[], values: unknown[]) {
    const branches = order.map((field, i) => {
      const equalBefore = order
        .slice(0, i)
        .map((previous, j) => ({ [previous.field]: values[j] }));
      const comparison = {
        [field.field]: { [field.direction === 'asc' ? 'gt' : 'lt']: values[i] },
      };
      return equalBefore.length ? { AND: [...equalBefore, comparison] } : comparison;
    });
    return { OR: branches };
  }

  private sign(payload: string): string {
    const secret = `cursor:${this.config.getOrThrow<string>('JWT_SECRET')}`;
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }

  private encode(order: SortField[], row: Record<string, unknown>): string {
    const payload = Buffer.from(
      JSON.stringify({
        f: order.map((o) => o.field),
        v: order.map((o) => {
          const value = row[o.field];
          if (value === undefined) {
            // A developer mistake, not a client error: add the field to the select
            throw new Error(`Pagination: sort field "${o.field}" is missing from the fetched rows`);
          }
          return value instanceof Date ? value.toISOString() : value;
        }),
      }),
    ).toString('base64url');
    return `${payload}.${this.sign(payload)}`;
  }

  /** null when there is no cursor; 400 invalid_cursor if it is damaged or from another list. */
  private decode(cursor: string | undefined, order: SortField[]): unknown[] | null {
    if (!cursor) return null;

    const invalid = () =>
      new BadRequestException({ error: 'invalid_cursor', message: 'Invalid cursor.' });

    const [payload, signature] = cursor.split('.');
    if (!payload || !signature) throw invalid();

    const expected = Buffer.from(this.sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw invalid();
    }

    let parsed: { f?: unknown; v?: unknown };
    try {
      parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      throw invalid();
    }

    const fields = parsed.f;
    const values = parsed.v;
    if (
      !Array.isArray(fields) ||
      !Array.isArray(values) ||
      fields.length !== order.length ||
      values.length !== order.length ||
      fields.some((name, i) => name !== order[i].field)
    ) {
      throw invalid();
    }

    return values.map((value, i) => {
      const { type, field } = order[i];
      if (type === 'number' && typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (type === 'date' && typeof value === 'string') {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return date;
      }
      if (type === 'string' && typeof value === 'string') {
        if (field === 'id' && !UUID_PATTERN.test(value)) throw invalid();
        return value;
      }
      throw invalid();
    });
  }
}