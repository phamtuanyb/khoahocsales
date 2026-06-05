import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { AuthenticatedUser } from './types/jwt-payload.interface';

// Tên cookie httpOnly cho refresh token (risk #1 — chống XSS đọc token).
// Access token vẫn trả qua body để FE đính kèm Bearer header.
const REFRESH_COOKIE_NAME = 'mkt_refresh';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // POST /api/v1/auth/login — accessToken qua body + refreshToken qua httpOnly cookie.
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);
    // Backward-compat: vẫn trả refreshToken trong body để FE cũ dùng được.
    return result;
  }

  // POST /api/v1/auth/refresh — ưu tiên đọc refresh từ cookie httpOnly, fallback body.
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    const refreshToken = cookieToken ?? dto.refreshToken;
    const result = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  // POST /api/v1/auth/logout — xóa cookie refresh trên browser.
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
    return { ok: true };
  }

  // GET /api/v1/auth/me — yêu cầu JWT hợp lệ
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  // ---- helpers ----

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      ...this.cookieOptions(),
      maxAge: REFRESH_MAX_AGE_MS,
    });
  }

  private cookieOptions() {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd, // HTTPS only trên production
      sameSite: isProd ? ('strict' as const) : ('lax' as const),
      path: '/',
    };
  }
}
