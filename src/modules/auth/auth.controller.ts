import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentAdmin } from '../../core/decorators/current-admin.decorator';
import { Public } from '../../core/decorators/public.decorator';
import type { AuthenticatedAdmin } from '../../core/interfaces/jwt-payload.interface';
import { THROTTLE } from '../../shared/utils/throttle.constant';
import { AuthService } from './auth.service';
import { AuthTokenResponseDto, LoginDto, MeResponseDto } from './dtos/auth.dto';

@ApiTags('Admin / Auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle(THROTTLE.login)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get a new token. Valid 1 hour, but never beyond 8 hours after sign-in',
  })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  refresh(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.authService.refresh(admin);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Sign out. The current token stops working immediately' })
  @ApiNoContentResponse()
  async logout(@CurrentAdmin() admin: AuthenticatedAdmin) {
    await this.authService.logout(admin.id);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'The signed-in admin. Use it to check a stored token is still valid' })
  @ApiOkResponse({ type: MeResponseDto })
  me(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.authService.getProfile(admin);
  }
}