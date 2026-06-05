'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BrandLogo } from '@/components/brand-logo';

interface LandingPageProps {
  isLoggedIn: boolean;
  loginHref: string;
}

const navItems = [
  { label: 'Training', href: '#training' },
  { label: 'Missions', href: '#missions' },
  { label: 'Leaderboard', href: '#leaderboard' },
  { label: 'Rewards', href: '#rewards' },
];

const loopSteps = [
  { icon: '📘', title: 'Học bài', text: 'Video + tài liệu' },
  { icon: '🎯', title: 'Quiz', text: '2 dạng + Boss' },
  { icon: '⚡', title: 'EXP', text: '+ điểm mỗi ngày' },
  { icon: '🕹️', title: 'Level Up', text: 'Tự động' },
  { icon: '🏆', title: 'Reward', text: 'Badge + quà' },
  { icon: '📊', title: 'Leaderboard', text: 'So tài' },
  { icon: '🔓', title: 'Unlock', text: 'Mở khóa' },
];

const levels = [
  { level: 'Level 1', title: 'Tân Binh', note: 'Vào nghề Sales và học nền tảng cốt lõi.', exp: '0 EXP' },
  { level: 'Level 2', title: 'Thực Chiến', note: 'Thực hành kịch bản và xử lý tình huống.', exp: '200 EXP' },
  { level: 'Level 3', title: 'Chiến Binh', note: 'Kỹ năng chốt đơn và tạo uy tín với khách.', exp: '1.000 EXP', active: true },
  { level: 'Level 4', title: 'Elite', note: 'Tối ưu quy trình và phản xạ tư vấn.', exp: '2.000 EXP' },
  { level: 'Level 5', title: 'Leader', note: 'Dẫn dắt đội nhóm và nâng chuẩn hiệu suất.', exp: '4.000 EXP' },
];

const features = [
  {
    icon: '🧩',
    title: 'Cây khóa học Sales',
    text: '5 mô-đun theo đúng lộ trình: từ nhập môn, tư vấn, xử lý từ chối đến chốt đơn.',
  },
  {
    icon: '📈',
    title: '3 dạng Quiz',
    text: 'Trắc nghiệm, tình huống và mini game giúp đội sales luyện phản xạ nhanh.',
  },
  {
    icon: '⚡',
    title: 'Boss Battle',
    text: 'Case khó theo kịch bản thật để kiểm tra kỹ năng xử lý áp lực.',
  },
  {
    icon: '🤖',
    title: 'AI Coach 24/7',
    text: 'Luyện tập hội thoại với AI, nhận góp ý theo SOP và phong cách MKT.',
  },
  {
    icon: '🔥',
    title: 'Mission + Streak',
    text: 'Nhiệm vụ mỗi ngày giúp duy trì thói quen học và nhân EXP.',
  },
  {
    icon: '🏅',
    title: 'Leaderboard',
    text: 'Bảng xếp hạng cập nhật liên tục để đội nhóm cạnh tranh lành mạnh.',
  },
];

const rewards = [
  'Chứng chỉ điện tử in được PDF',
  'Thăng tiến mốc điểm đạt KPI level',
  'Quà tặng công nghệ cho Top 3 tháng',
  'Cơ hội đề bạt sớm lên Leader',
];

const badges = [
  { icon: '⭐', title: 'Bậc thầy tư vấn' },
  { icon: '📘', title: 'Kỷ luật học tập' },
  { icon: '🏆', title: 'SOP xuất sắc' },
  { icon: '🚀', title: 'Kích hoạt bán hàng' },
  { icon: '⚔️', title: 'Vượt thử thách' },
  { icon: '🎖️', title: 'Sales Hunter' },
  { icon: '🎓', title: 'Tốt nghiệp' },
  { icon: '🔥', title: '7 ngày liên tục' },
  { icon: '👑', title: 'Bậc thầy MKT' },
];

const faqs = [
  {
    question: 'Tôi có cần đăng ký tài khoản không?',
    answer: 'Không. HR sẽ cấp tài khoản cho bạn ngay khi vào công ty. Bạn nhận email kèm mật khẩu mặc định.',
  },
  {
    question: 'Học xong bao lâu thì nâng cấp Tân Binh?',
    answer: 'Hệ thống tự cộng EXP sau mỗi bài học, quiz và nhiệm vụ. Khi đủ điểm, cấp bậc sẽ tự động cập nhật.',
  },
  {
    question: 'AI Coach có chấm điểm chính xác không?',
    answer: 'AI Coach dựa trên SOP, kịch bản bán hàng và tiêu chí chấm điểm do quản trị viên cấu hình.',
  },
];

export function LandingPage({ isLoggedIn, loginHref }: LandingPageProps): JSX.Element {
  return (
    <div className="min-h-screen bg-[#FCF8FB] text-[#1B1B1D]">
      <Navbar isLoggedIn={isLoggedIn} loginHref={loginHref} />
      <main>
        <Hero isLoggedIn={isLoggedIn} loginHref={loginHref} />
        <GameLoopSection />
        <LevelJourneySection />
        <FeaturesSection />
        <RewardsSection />
        <FaqSection />
        <FinalCtaSection isLoggedIn={isLoggedIn} loginHref={loginHref} />
      </main>
      <FooterSection />
    </div>
  );
}

function Navbar({ isLoggedIn, loginHref }: LandingPageProps): JSX.Element {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E6E3E7] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="MKT Academy" className="flex items-center">
          <BrandLogo variant="horizontal-positive" priority className="h-auto w-28 sm:w-32" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#414754] md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-[#005AB3]">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#E6E3E7] bg-white text-[#005AB3] shadow-sm sm:flex">
            🔔
          </span>
          <Link
            href={loginHref}
            className="rounded-full bg-[#FF7A00] px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-[0_12px_28px_rgba(255,122,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#F26F00]"
          >
            {isLoggedIn ? 'Vào học →' : 'Đăng nhập →'}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ isLoggedIn, loginHref }: LandingPageProps): JSX.Element {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(0,115,224,0.13),transparent_28%),radial-gradient(circle_at_82%_30%,rgba(255,122,0,0.12),transparent_24%),linear-gradient(180deg,#FFFFFF_0%,#FCF8FB_100%)]" />
      <div className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#005AB3]">
            <span>✦</span>
            Nền tảng đào tạo nội bộ MKT Software
          </div>
          <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-normal text-[#0073E0] sm:text-6xl lg:text-7xl">
            Học để
            <span className="block text-[#FF7A00]">chiến thắng</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#414754] sm:text-lg">
            Hành trình onboarding Sales được game hóa hoàn toàn: học bài, làm quiz, cộng EXP,
            lên level, mở khóa cấp độ kế tiếp. Có <strong className="text-[#005AB3]">AI Coach</strong> đồng vai
            khách hàng để bạn luyện thực chiến.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center rounded-xl bg-[#FF7A00] px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_16px_34px_rgba(255,122,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#F26F00]"
            >
              ⚡ {isLoggedIn ? 'Tiếp tục học' : 'Bắt đầu ngay'}
            </Link>
            <a
              href="#training"
              className="inline-flex items-center justify-center rounded-xl border border-[#D9E7FF] bg-white px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-[#005AB3] shadow-sm transition hover:-translate-y-0.5 hover:border-[#A9C9FA]"
            >
              Xem vòng lặp game →
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-xs font-bold uppercase tracking-wide text-[#6C7280]">
            <span>🎓 5 mô-đun Sales</span>
            <span>🔥 7 ngày học</span>
            <span>🤖 AI Coach 24/7</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute -left-8 top-10 h-24 w-24 rounded-full bg-[#A9C9FA]/60 blur-2xl" />
          <div className="absolute -right-8 bottom-8 h-28 w-28 rounded-full bg-[#FF7A00]/25 blur-2xl" />
          <div className="relative rounded-[28px] border border-[#E6E3E7] bg-white p-6 shadow-[0_30px_80px_rgba(28,41,61,0.16)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7B8494]">Level 3 · 65% win</p>
                <h2 className="mt-2 text-2xl font-black text-[#0073E0]">Chiến Binh Sales</h2>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A84FF] text-2xl text-white shadow-[0_12px_24px_rgba(10,132,255,0.25)]">
                ⚔️
              </span>
            </div>
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#6C7280]">
                <span>EXP hôm nay</span>
                <span className="text-[#0073E0]">1.240 / 1.300</span>
              </div>
              <div className="h-3 rounded-full bg-[#EAF3FF]">
                <div className="h-3 w-[88%] rounded-full bg-gradient-to-r from-[#FF7A00] to-[#0073E0]" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ['14', 'Streak'],
                ['7', 'Boss'],
                ['2', 'Gợi ý'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-[#E6E3E7] bg-[#F6F3F5] p-4 text-center">
                  <p className="text-2xl font-black text-[#FF7A00]">{value}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-[#6C7280]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.26em] text-[#0073E0]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-[#0073E0] sm:text-4xl">{title}</h2>
      {children ? <p className="mt-4 text-sm leading-7 text-[#6C7280] sm:text-base">{children}</p> : null}
    </div>
  );
}

function GameLoopSection(): JSX.Element {
  return (
    <section id="training" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Vòng lặp cốt lõi" title="7 bước cuốn không đứt">
          Mỗi hành động đều được ghi nhận thành điểm, cấp bậc và phần thưởng rõ ràng.
        </SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {loopSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-[#E6E3E7] bg-white p-5 text-center shadow-[0_14px_34px_rgba(28,41,61,0.06)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-xl">
                {step.icon}
              </div>
              <h3 className="mt-4 text-sm font-black text-[#1B1B1D]">{step.title}</h3>
              <p className="mt-1 text-xs text-[#6C7280]">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LevelJourneySection(): JSX.Element {
  return (
    <section className="border-y border-[#ECE8ED] bg-[#FCF8FB] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Hành trình 5 level" title="Từ Tân Binh đến Leader">
          Mỗi cấp độ có ngưỡng EXP và danh hiệu riêng. Level 3 là mốc cần chinh phục.
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-5">
          {levels.map((item) => (
            <div
              key={item.level}
              className={`relative rounded-2xl border bg-white p-6 shadow-[0_16px_38px_rgba(28,41,61,0.07)] ${
                item.active
                  ? 'border-[#FF7A00] ring-4 ring-[#FF7A00]/10 md:-translate-y-5'
                  : 'border-[#E6E3E7]'
              }`}
            >
              {item.active ? (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#FF7A00] px-4 py-1.5 text-[10px] font-black uppercase tracking-wide text-white">
                  Đang mở khóa
                </span>
              ) : null}
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0073E0]">{item.level}</p>
              <h3 className="mt-3 text-xl font-black text-[#0073E0]">{item.title}</h3>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#6C7280]">{item.note}</p>
              <span className="mt-5 inline-flex rounded-full bg-[#F6F3F5] px-3 py-1.5 text-xs font-extrabold text-[#414754]">
                Mốc: {item.exp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection(): JSX.Element {
  return (
    <section id="missions" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle eyebrow="Tính năng nổi bật" title="Không chỉ là e-learning" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-[#E6E3E7] bg-white p-7 shadow-[0_18px_42px_rgba(28,41,61,0.07)] transition hover:-translate-y-1 hover:border-[#A9C9FA]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-xl">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-xl font-black text-[#0073E0]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#6C7280]">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function RewardsSection(): JSX.Element {
  return (
    <section id="rewards" className="border-y border-[#ECE8ED] bg-[#FCF8FB] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.96fr_1.04fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-[#FF7A00]">Huy hiệu · phần thưởng</p>
          <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-[#0073E0] sm:text-4xl">
            Mỗi cột mốc = phần thưởng
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#6C7280] sm:text-base">
            Chặng tối ưu cho phòng đào tạo: mỗi học viên có mục tiêu rõ ràng, phần thưởng rõ ràng và động lực quay lại mỗi ngày.
          </p>
          <div className="mt-7 space-y-3">
            {rewards.map((reward) => (
              <div key={reward} className="flex items-center gap-3 rounded-xl border border-[#E6E3E7] bg-white px-4 py-3 text-sm font-bold text-[#414754]">
                <span className="text-[#FF7A00]">✓</span>
                {reward}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {badges.map((badge) => (
            <div key={badge.title} className="rounded-2xl border border-[#E6E3E7] bg-white p-6 text-center shadow-[0_16px_38px_rgba(28,41,61,0.07)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F3F5] text-xl">
                {badge.icon}
              </div>
              <p className="mt-4 text-sm font-black text-[#1B1B1D]">{badge.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection(): JSX.Element {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <SectionTitle eyebrow="Câu hỏi thường gặp" title="Giải đáp nhanh" />
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <button
                key={faq.question}
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="w-full rounded-2xl border border-[#E6E3E7] bg-white p-5 text-left shadow-[0_12px_30px_rgba(28,41,61,0.05)] transition hover:border-[#A9C9FA]"
              >
                <span className="flex items-center justify-between gap-4 text-sm font-black text-[#0073E0]">
                  {String(index + 1).padStart(2, '0')}. {faq.question}
                  <span className="text-xl text-[#1B1B1D]">{isOpen ? '−' : '+'}</span>
                </span>
                {isOpen ? <p className="mt-4 text-sm leading-7 text-[#6C7280]">{faq.answer}</p> : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection({ isLoggedIn, loginHref }: LandingPageProps): JSX.Element {
  return (
    <section className="bg-white px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-[#E6E3E7] bg-[#F6F3F5] px-6 py-14 text-center shadow-[0_18px_48px_rgba(28,41,61,0.09)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF7A00] text-2xl text-white shadow-[0_14px_28px_rgba(255,122,0,0.24)]">
          🎮
        </div>
        <h2 className="mt-6 text-3xl font-black uppercase text-[#0073E0] sm:text-4xl">Sẵn sàng chiến đấu?</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#6C7280]">
          Đăng nhập bằng email công ty đã được HR cấp. Bắt đầu ở Level 1 để chinh phục đỉnh cao.
        </p>
        <Link
          href={loginHref}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#FF7A00] px-7 py-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_16px_34px_rgba(255,122,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#F26F00]"
        >
          ⚡ {isLoggedIn ? 'Vào dashboard' : 'Đăng nhập chiến đấu'}
        </Link>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs font-bold uppercase text-[#7B8494]">
          <span>5 mô-đun</span>
          <span>AI Coach</span>
          <span>Boss Battle</span>
          <span>Realtime</span>
        </div>
      </div>
    </section>
  );
}

function FooterSection(): JSX.Element {
  return (
    <footer className="border-t border-[#E6E3E7] bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <BrandLogo variant="horizontal-positive" className="h-auto w-32" />
          <p className="mt-4 max-w-md text-sm leading-6 text-[#6C7280]">
            Nền tảng đào tạo nội bộ và game hóa của MKT Software.
          </p>
        </div>
        <div id="leaderboard" className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-black uppercase text-[#0073E0]">Khám phá</p>
            <div className="mt-3 space-y-2 text-[#6C7280]">
              <a href="#training" className="block hover:text-[#005AB3]">Vòng lặp game</a>
              <a href="#missions" className="block hover:text-[#005AB3]">Tính năng</a>
            </div>
          </div>
          <div>
            <p className="font-black uppercase text-[#0073E0]">Hệ thống</p>
            <div className="mt-3 space-y-2 text-[#6C7280]">
              <Link href="/login" className="block hover:text-[#005AB3]">Tài khoản</Link>
              <Link href="/dashboard" className="block hover:text-[#005AB3]">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t border-[#E6E3E7] pt-5 text-xs text-[#7B8494] sm:flex-row">
        <span>© 2026 Phần mềm MKT.</span>
        <span>Privacy · Terms · Support</span>
      </div>
    </footer>
  );
}
