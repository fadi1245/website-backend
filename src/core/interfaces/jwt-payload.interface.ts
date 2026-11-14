import { Request } from 'express';

/** What is stored inside the access token. */
export interface JwtPayload {
  /** Admin id */
  sub: string;
  /** Token version. Logging out raises the admin's version, which invalidates older tokens. */
  ver: number;
  /** When the admin originally signed in (unix seconds). Refreshing never changes it. */
  loginAt: number;
  iat?: number;
  exp?: number;
}

/** The signed-in admin, attached to the request by JwtAuthGuard. */
export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string | null;
  tokenVersion: number;
  /** Unix seconds of the original sign-in (start of the session) */
  sessionStartedAt: number;
}

export interface AuthenticatedRequest extends Request {
  admin?: AuthenticatedAdmin;
}