import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { Reflector } from '@nestjs/core';
  import { JwtService } from '@nestjs/jwt';
  import { PrismaService } from '../../database/prisma.service';
  import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
  import {
    AuthenticatedRequest,
    JwtPayload,
  } from '../interfaces/jwt-payload.interface';
  import { getSessionLimits, nowInSeconds } from '../session.config';
  
  /**
   * Global guard: every route requires a valid admin token unless it is @Public().
   * Besides checking the token signature and expiry, it checks the database on every
   * request, so a disabled admin or a logged-out token stops working immediately.
   */
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(
      private readonly reflector: Reflector,
      private readonly jwtService: JwtService,
      private readonly prisma: PrismaService,
      private readonly config: ConfigService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) return true;
  
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const token = this.extractToken(request);
      if (!token) throw this.unauthenticated();
  
      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
          algorithms: ['HS256'],
        });
      } catch {
        // Bad signature, malformed, or expired
        throw this.unauthenticated();
      }
  
      // The 8-hour limit from the original sign-in
      const { maxSeconds } = getSessionLimits(this.config);
      if (
        typeof payload.loginAt !== 'number' ||
        payload.loginAt + maxSeconds <= nowInSeconds()
      ) {
        throw this.unauthenticated();
      }
  
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, isActive: true, tokenVersion: true },
      });
      if (!admin || !admin.isActive || admin.tokenVersion !== payload.ver) {
        throw this.unauthenticated();
      }
  
      request.admin = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        tokenVersion: admin.tokenVersion,
        sessionStartedAt: payload.loginAt,
      };
      return true;
    }
  
    private extractToken(request: AuthenticatedRequest): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' && token ? token : undefined;
    }
  
    private unauthenticated() {
      return new UnauthorizedException({
        error: 'unauthenticated',
        message: 'Please sign in to continue.',
      });
    }
  }