import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Every route needs a valid admin token unless it is marked @Public().
 * Use it on login and, later, on the public website endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);