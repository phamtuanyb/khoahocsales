// Helper timezone — Việt Nam UTC+7.
// MVP không dùng lib (date-fns-tz / dayjs) — offset đơn giản đủ cho streak + mission.
// Khi cần xử lý DST/timezone phức tạp hơn thì migrate sang IANA tz database.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7

// Trả về 00:00:00 ngày hôm nay theo giờ VN, biểu diễn dưới dạng Date UTC tương ứng.
// VD: 06:30 UTC ngày 23/05 → ở VN là 13:30 → ngày hôm nay = 23/05 → trả về 23/05 17:00 UTC (= 00:00 VN 24/05).
// Để chuẩn xác hơn ta tính: dịch thời điểm hiện tại sang VN, cắt về 00:00, rồi dịch ngược về UTC.
export function startOfDayVn(d: Date = new Date()): Date {
  const vnNow = new Date(d.getTime() + VN_OFFSET_MS);
  const vnMidnight = new Date(
    Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()),
  );
  // Quy đổi 00:00 VN về UTC.
  return new Date(vnMidnight.getTime() - VN_OFFSET_MS);
}

// 00:00 thứ Hai tuần này theo giờ VN.
export function startOfWeekVn(d: Date = new Date()): Date {
  const today = startOfDayVn(d);
  const vnDate = new Date(today.getTime() + VN_OFFSET_MS);
  const dayOfWeek = vnDate.getUTCDay() || 7; // CN=0 → 7
  const monday = new Date(today.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
  return monday;
}

// 00:00 ngày 1 của tháng hiện tại theo giờ VN.
export function startOfMonthVn(d: Date = new Date()): Date {
  const vnNow = new Date(d.getTime() + VN_OFFSET_MS);
  const firstOfMonth = new Date(
    Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), 1),
  );
  return new Date(firstOfMonth.getTime() - VN_OFFSET_MS);
}

// Trả ngày kế tiếp (cộng 24h).
export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}
