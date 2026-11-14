/**
 * Rate limits from the API plan, for use with @Throttle on a route:
 *   @Throttle(THROTTLE.login)
 * Routes without a decorator use the global default set in AppModule.
 * ttl is in milliseconds.
 */
export const THROTTLE = {
    admin: { default: { limit: 600, ttl: 60_000 } },
    login: { default: { limit: 5, ttl: 15 * 60_000 } },
    leadSubmit: { default: { limit: 5, ttl: 10 * 60_000 } },
    applicationSubmit: { default: { limit: 3, ttl: 60 * 60_000 } },
  } as const;