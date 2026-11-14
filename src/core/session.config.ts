import { ConfigService } from '@nestjs/config';

/**
 * Session rules (see the API plan):
 *  - an access token lasts 1 hour (the idle limit; the frontend refreshes it while the admin is active)
 *  - a session never lasts more than 8 hours from the original sign-in
 * Both can be changed with JWT_ACCESS_TTL_SECONDS and SESSION_MAX_HOURS in .env.
 */
export function getSessionLimits(config: ConfigService) {
  return {
    ttlSeconds: Number(config.get('JWT_ACCESS_TTL_SECONDS') ?? 3600),
    maxSeconds: Number(config.get('SESSION_MAX_HOURS') ?? 8) * 3600,
  };
}

export const nowInSeconds = () => Math.floor(Date.now() / 1000);