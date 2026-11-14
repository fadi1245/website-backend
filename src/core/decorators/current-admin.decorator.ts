import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedAdmin,
  AuthenticatedRequest,
} from '../interfaces/jwt-payload.interface';

/** Gives a controller method the signed-in admin: login(@CurrentAdmin() admin) */
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.admin as AuthenticatedAdmin;
  },
);