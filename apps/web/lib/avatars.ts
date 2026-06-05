// Bộ avatar dựng sẵn cho màn khởi tạo nhân vật (spec mục 5.1).
// Mỗi avatar có key (lưu DB), emoji + tên hiển thị + cặp màu khung brand MKT.

export interface AvatarPreset {
  key: string;
  name: string;
  emoji: string;
  // Cặp màu nền card avatar — đều thuộc dải brand xanh dương MKT
  bg: string;
  ring: string;
}

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { key: 'sales-warrior', name: 'Chiến Binh Sales', emoji: '⚔️', bg: 'from-navy-deep to-navy', ring: 'ring-orange' },
  { key: 'closer', name: 'Sát Thủ Chốt Đơn', emoji: '🎯', bg: 'from-navy to-blue', ring: 'ring-gold' },
  { key: 'speaker', name: 'Bậc Thầy Tư Vấn', emoji: '🎙️', bg: 'from-blue to-sky', ring: 'ring-pink' },
  { key: 'rocket', name: 'Tên Lửa Khởi Nghiệp', emoji: '🚀', bg: 'from-navy-deep to-blue', ring: 'ring-gold' },
  { key: 'shield', name: 'Khiên Văn Hóa', emoji: '🛡️', bg: 'from-navy to-sky', ring: 'ring-orange' },
  { key: 'crown', name: 'Vương Giả Leader', emoji: '👑', bg: 'from-navy-deep to-navy', ring: 'ring-gold' },
  { key: 'lightning', name: 'Tia Chớp Phản Xạ', emoji: '⚡', bg: 'from-blue to-sky', ring: 'ring-orange' },
  { key: 'flame', name: 'Ngọn Lửa Bền Bỉ', emoji: '🔥', bg: 'from-navy to-blue', ring: 'ring-pink' },
] as const;

export const DEFAULT_AVATAR_KEY = AVATAR_PRESETS[0]!.key;

export function findAvatar(key: string | null): AvatarPreset {
  if (!key) return AVATAR_PRESETS[0]!;
  return AVATAR_PRESETS.find((a) => a.key === key) ?? AVATAR_PRESETS[0]!;
}
