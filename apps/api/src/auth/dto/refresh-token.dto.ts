import { IsJWT, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  // Optional — nếu trống thì service đọc từ httpOnly cookie (risk #1).
  @IsOptional()
  @IsJWT({ message: 'Refresh token không hợp lệ' })
  refreshToken?: string;
}
