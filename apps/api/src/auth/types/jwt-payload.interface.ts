import type { UserRole } from '@prisma/client';

// Payload nhúng trong JWT — chỉ chứa thông tin định danh tối thiểu.
// Vai trò user lưu vào để Guards check nhanh không phải query DB lại.
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
}

// Đối tượng request.user sau khi JwtStrategy.validate() chạy xong.
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
