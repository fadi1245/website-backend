import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE } from '../../shared/utils/throttle.constant';

/**
 * Put on every admin route. It does three things in one line:
 *  - groups the route under "Admin / <tag>" in Swagger
 *  - shows the lock in Swagger, so you can send the token from the docs page
 *  - applies the admin rate limit (600 requests per minute)
 * The login itself is enforced by the global guard, not by this decorator.
 *
 *   @AdminRoute('Contact info')
 *   @Get('admin/contact-info')
 */
export const AdminRoute = (tag: string) =>
  applyDecorators(
    ApiTags(`Admin / ${tag}`),
    ApiBearerAuth('access-token'),
    Throttle(THROTTLE.admin),
  );