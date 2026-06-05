import type { Config } from 'tailwindcss';

// ==========================================
// Tailwind config — Design System MKT Academy (spec mục 8)
// Bộ màu thương hiệu Phần mềm MKT: gradient xanh dương,
// điểm nhấn cam/vàng/hồng. Nền KHÔNG dùng màu trắng.
// ==========================================

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette mới — softer, modern (Tailwind blue/orange family thay vì MUI saturated).
        // Bộ xanh — bớt đậm hơn navy MUI, hài hòa với nền trắng.
        'navy-deep': '#4F83D9', // Xanh nền dịu hơn — sidebar/card chính
        navy:        '#5F96EA', // Xanh nền phụ, bớt đậm
        blue:        '#6FA9F9', // Xanh phụ mới — dùng cho gradient/khối phụ
        sky:         '#6FA9F9', // Xanh nhấn — viền, label, glow
        ice:         '#A9C9FA', // Xanh nhạt — chữ phụ/surface trên nền tối

        // Accent — bớt rực hơn FF8C00/FFD700
        orange:      '#F97316', // Orange-500 — CTA chính, EXP, cảnh báo
        gold:        '#F59E0B', // Amber-500 — KPI, badge (vàng có pha cam, dịu mắt)
        pink:        '#EC4899', // Pink-500 — streak/lửa, hồng modern
      },
      backgroundImage: {
        // Gradient nền chuẩn — dùng cho hero card 3D, boss battle (dark contexts).
        'mkt-gradient':
          'linear-gradient(135deg, #4F83D9 0%, #5F96EA 42%, #6FA9F9 82%, #A9C9FA 100%)',
        // Pill cam — nhẹ hơn FF8C00 → F97316
        'mkt-pill-orange':
          'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
        'mkt-pill-gold':
          'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        // Thanh EXP — cam → vàng có sáng chạy
        'mkt-exp-bar':
          'linear-gradient(90deg, #F97316 0%, #F59E0B 100%)',
      },
      fontFamily: {
        // Font đậm cho heading; chữ tiếng Việt có dấu đầy đủ
        sans: [
          'var(--font-be-vietnam-pro)',
          'Be Vietnam Pro',
          'Inter',
          'Segoe UI',
          'Roboto',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        display: [
          'var(--font-be-vietnam-pro)',
          'Be Vietnam Pro',
          'Inter',
          'Segoe UI',
          'sans-serif',
        ],
      },
      fontSize: {
        // Heading lớn theo spec 8.4
        'h1-mkt': ['72px', { lineHeight: '1.05', fontWeight: '900', letterSpacing: '-0.02em' }],
        'h1-mkt-sm': ['48px', { lineHeight: '1.1', fontWeight: '900', letterSpacing: '-0.01em' }],
        'h2-mkt': ['36px', { lineHeight: '1.15', fontWeight: '700' }],
        'h2-mkt-sm': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'body-mkt': ['18px', { lineHeight: '1.6', fontWeight: '500' }],
        'badge-mkt': ['28px', { lineHeight: '1', fontWeight: '700' }],
      },
      borderRadius: {
        card: '20px',
        pill: '9999px',
      },
      boxShadow: {
        // Glow xanh sky — bớt rực, soft hơn cho nền trắng
        'mkt-glow':  '0 0 20px rgba(111, 169, 249, 0.22), 0 6px 20px rgba(79, 131, 217, 0.12)',
        // Glow vàng cho badge phát sáng — dùng amber-400
        'mkt-badge': '0 0 18px rgba(245, 158, 11, 0.55), 0 0 36px rgba(245, 158, 11, 0.22)',
        // Đổ bóng khối 3D
        'mkt-3d':    '0 12px 32px rgba(79, 131, 217, 0.18), 0 3px 10px rgba(0, 0, 0, 0.10)',
        // CTA orange glow — dùng orange-500
        'mkt-cta':   '0 6px 18px rgba(249, 115, 22, 0.35), 0 0 12px rgba(249, 115, 22, 0.2)',
      },
      keyframes: {
        // Hiệu ứng EXP bay vào thanh
        'exp-shine': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Badge phát sáng khi đạt — dùng amber-400 softer
        'badge-pulse': {
          '0%, 100%': { boxShadow: '0 0 18px rgba(245, 158, 11, 0.55)' },
          '50%':       { boxShadow: '0 0 32px rgba(245, 158, 11, 0.9), 0 0 50px rgba(245, 158, 11, 0.45)' },
        },
        // Level Up — tia sáng nổ ra
        'level-up': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Streak fire flicker
        'fire-flicker': {
          '0%, 100%': { transform: 'scale(1) rotate(-2deg)' },
          '50%': { transform: 'scale(1.05) rotate(2deg)' },
        },
      },
      animation: {
        'exp-shine': 'exp-shine 2s linear infinite',
        'badge-pulse': 'badge-pulse 2s ease-in-out infinite',
        'level-up': 'level-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fire-flicker': 'fire-flicker 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
