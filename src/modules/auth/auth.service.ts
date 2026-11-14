import {
    Injectable,
    OnModuleInit,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  import { PrismaService } from '../../database/prisma.service';
  import {
    AuthenticatedAdmin,
    JwtPayload,
  } from '../../core/interfaces/jwt-payload.interface';
  import { getSessionLimits, nowInSeconds } from '../../core/session.config';
  import {
    AuthTokenResponseDto,
    LoginDto,
    MeResponseDto,
  } from './dtos/auth.dto';
  
  export const BCRYPT_ROUNDS = 12;
  
  @Injectable()
  export class AuthService implements OnModuleInit {
    // Used so a wrong email takes as long to reject as a wrong password
    private dummyHash = '';
  
    constructor(
      private readonly prisma: PrismaService,
      private readonly jwtService: JwtService,
      private readonly config: ConfigService,
    ) {}
  
    async onModuleInit() {
      this.dummyHash = await bcrypt.hash('not-a-real-password', BCRYPT_ROUNDS);
    }
  
    async login(dto: LoginDto): Promise<AuthTokenResponseDto> {
      const admin = await this.prisma.adminUser.findUnique({
        where: { email: dto.email },
      });
  
      // Always run one comparison, whether or not the email exists
      const passwordMatches = await bcrypt.compare(
        dto.password,
        admin?.passwordHash ?? this.dummyHash,
      );
      if (!admin || !admin.isActive || !passwordMatches) {
        // One message for every case, so nobody can learn which emails exist
        throw new UnauthorizedException({
          error: 'invalid_credentials',
          message: 'Invalid email or password.',
        });
      }
  
      await this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });
  
      return this.issueToken(admin, nowInSeconds());
    }
  
    /** New token valid for up to 1 hour, but never beyond 8 hours after the original sign-in. */
    async refresh(admin: AuthenticatedAdmin): Promise<AuthTokenResponseDto> {
      return this.issueToken(admin, admin.sessionStartedAt);
    }
  
    /** Raises the token version, so every token issued before this moment stops working. */
    async logout(adminId: string): Promise<void> {
      await this.prisma.adminUser.update({
        where: { id: adminId },
        data: { tokenVersion: { increment: 1 } },
      });
    }
  
    getProfile(admin: AuthenticatedAdmin): MeResponseDto {
      return { admin: { id: admin.id, email: admin.email, name: admin.name } };
    }
  
    private async issueToken(
      admin: { id: string; email: string; name: string | null; tokenVersion: number },
      loginAt: number,
    ): Promise<AuthTokenResponseDto> {
      const { ttlSeconds, maxSeconds } = getSessionLimits(this.config);
      const now = nowInSeconds();
  
      const secondsLeftInSession = loginAt + maxSeconds - now;
      if (secondsLeftInSession <= 0) {
        throw new UnauthorizedException({
          error: 'unauthenticated',
          message: 'Your session has ended. Please sign in again.',
        });
      }
      const expiresIn = Math.min(ttlSeconds, secondsLeftInSession);
  
      const payload: JwtPayload = {
        sub: admin.id,
        ver: admin.tokenVersion,
        loginAt,
      };
      const accessToken = await this.jwtService.signAsync(payload, { expiresIn });
  
      return {
        accessToken,
        expiresAt: new Date((now + expiresIn) * 1000).toISOString(),
        admin: { id: admin.id, email: admin.email, name: admin.name },
      };
    }
  }