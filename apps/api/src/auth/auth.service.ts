import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type {
  AuthenticatedUser,
  JwtPayload,
  TokenPair,
} from './types/jwt-payload.interface';

export interface LoginResult extends TokenPair {
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // POST /auth/login — kiểm tra email + mật khẩu, phát hành cặp token.
  async login(dto: LoginDto): Promise<LoginResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== UserStatus.ACTIVE) {
      // Cố ý trả message mơ hồ — tránh lộ tài khoản tồn tại hay không
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: this.toAuthenticatedUser(user),
    };
  }

  // POST /auth/refresh — đổi cặp token mới (rotation) từ refresh token.
  // refreshToken có thể đến từ httpOnly cookie (chính) hoặc body (fallback).
  async refresh(refreshToken: string | undefined): Promise<TokenPair> {
    if (!refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token');
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.requireConfig('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản không hợp lệ');
    }

    return this.generateTokens(user);
  }

  // GET /auth/me — lấy hồ sơ hiển thị cho frontend.
  async me(userId: string): Promise<MeResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: { level: true },
        },
        department: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      department: user.department
        ? { id: user.department.id, name: user.department.name }
        : null,
      profile: user.profile
        ? {
            avatar: user.profile.avatar,
            exp: user.profile.exp,
            streakCount: user.profile.streakCount,
            stage: user.profile.stage,
            rank: user.profile.rank,
            level: user.profile.level
              ? {
                  id: user.profile.level.id,
                  order: user.profile.level.order,
                  name: user.profile.level.name,
                  expThreshold: user.profile.level.expThreshold,
                }
              : null,
          }
        : null,
      // Cờ first-time: avatar null nghĩa là chưa khởi tạo nhân vật (spec 5.1)
      needsCharacterSetup: !user.profile || user.profile.avatar === null,
    };
  }

  // ----- helpers -----

  private async generateTokens(user: Pick<User, 'id' | 'email' | 'role'>): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.requireConfig('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.requireConfig('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    };
  }

  private requireConfig(key: string): string {
    const value = this.config.get<string>(key);
    if (!value) {
      throw new Error(`Thiếu biến môi trường ${key}`);
    }
    return value;
  }
}

// Kiểu trả về cho /auth/me — frontend nhận dữ liệu hồ sơ đầy đủ.
export interface MeResult {
  id: string;
  email: string;
  name: string;
  role: User['role'];
  status: User['status'];
  department: { id: string; name: string } | null;
  profile: {
    avatar: string | null;
    exp: number;
    streakCount: number;
    stage: string;
    rank: number | null;
    level: { id: string; order: number; name: string; expThreshold: number } | null;
  } | null;
  needsCharacterSetup: boolean;
}
