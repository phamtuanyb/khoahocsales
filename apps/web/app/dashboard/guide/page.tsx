'use client';

import Link from 'next/link';
import { UserRole } from '@mkt-academy/types';
import { LoadingScreen } from '@/components/loading-screen';
import { useAuth } from '@/components/auth-provider';

const learnerGuides = [
  {
    id: 'overview',
    title: 'Dashboard tổng quan',
    icon: '🏠',
    image: 'Minh họa: màn hình chỉ số EXP, level, streak và tiến độ học.',
    steps: [
      'Xem lời chào, cấp bậc hiện tại và thanh EXP ở topbar.',
      'Theo dõi các thẻ KPI: khóa học, bài thi, huy hiệu, chứng chỉ và nhiệm vụ.',
      'Dùng các nút hành động nhanh để đi tới khu vực học, bảng xếp hạng, huy hiệu hoặc chứng chỉ.',
    ],
    notes: ['Nếu số liệu chưa cập nhật, tải lại trang sau khi hoàn thành bài học hoặc bài thi.'],
  },
  {
    id: 'learn',
    title: 'Khu vực học',
    icon: '📚',
    image: 'Minh họa: danh sách khóa học, mô-đun, bài học bị khóa/mở khóa.',
    steps: [
      'Vào Dashboard → Khu vực học.',
      'Chọn khóa học đang được mở cho tài khoản.',
      'Học lần lượt từng mô-đun. Bài học hoặc quiz bị khóa sẽ mở khi đủ điều kiện.',
      'Sau khi xem bài, bấm hoàn thành để hệ thống ghi nhận EXP.',
    ],
    notes: ['Nên học đúng thứ tự để tránh thiếu điều kiện mở khóa các phần tiếp theo.'],
  },
  {
    id: 'quiz',
    title: 'Bài thi và Quiz',
    icon: '🎯',
    image: 'Minh họa: màn hình câu hỏi trắc nghiệm, tình huống và kết quả chấm điểm.',
    steps: [
      'Mở quiz từ khóa học hoặc menu bài thi nếu được cấp quyền.',
      'Đọc kỹ đề bài, thời gian làm bài và số điểm đạt yêu cầu.',
      'Hoàn thành toàn bộ câu hỏi rồi bấm nộp bài.',
      'Xem kết quả, điểm mạnh, điểm cần cải thiện và khuyến nghị ôn lại.',
    ],
    notes: ['Một số bài có AI chấm điểm. Kết quả phụ thuộc SOP và cấu hình từ admin.'],
  },
  {
    id: 'ai-coach',
    title: 'AI Coach luyện tư vấn',
    icon: '🤖',
    image: 'Minh họa: khung chat AI Coach và phần chấm điểm sau phiên luyện tập.',
    steps: [
      'Vào Dashboard → AI Coach.',
      'Chọn kịch bản phù hợp với tình huống cần luyện.',
      'Trả lời khách hàng như một cuộc hội thoại bán hàng thật.',
      'Kết thúc phiên để xem nhận xét, điểm thái độ, logic xử lý và mức đúng SOP.',
    ],
    notes: [
      'Hãy trả lời đầy đủ ngữ cảnh để AI Coach có dữ liệu chấm chính xác hơn.',
      'Nếu AI báo lỗi key/model, báo quản trị viên kiểm tra cấu hình API trong Kịch bản AI Coach.',
    ],
  },
  {
    id: 'leaderboard',
    title: 'Bảng xếp hạng',
    icon: '🏆',
    image: 'Minh họa: top người học theo EXP, streak và thành tích.',
    steps: [
      'Vào Dashboard → Bảng xếp hạng.',
      'Xem thứ hạng cá nhân và top nhân sự trong hệ thống.',
      'So sánh EXP, cấp bậc và các chỉ số thi đua.',
    ],
    notes: ['Bảng xếp hạng dùng để tạo động lực học tập, không thay thế đánh giá quản lý trực tiếp.'],
  },
  {
    id: 'badges',
    title: 'Huy hiệu',
    icon: '🎖',
    image: 'Minh họa: bộ huy hiệu đã nhận và huy hiệu còn khóa.',
    steps: [
      'Vào Dashboard → Huy hiệu.',
      'Xem các huy hiệu đã đạt và điều kiện mở khóa huy hiệu mới.',
      'Hoàn thành nhiệm vụ, quiz hoặc streak để nhận thêm huy hiệu.',
    ],
    notes: ['Huy hiệu có thể được trao tự động hoặc do admin cấu hình theo nhiệm vụ.'],
  },
  {
    id: 'certificates',
    title: 'Chứng chỉ',
    icon: '📜',
    image: 'Minh họa: danh sách chứng chỉ và màn hình xem chứng chỉ.',
    steps: [
      'Vào Dashboard → Chứng chỉ.',
      'Mở chứng chỉ đã được cấp sau khi hoàn thành điều kiện.',
      'Kiểm tra thông tin họ tên, khóa học và thời điểm cấp.',
    ],
    notes: ['Nếu thiếu chứng chỉ sau khi hoàn thành khóa, báo admin kiểm tra cấu hình cấp chứng chỉ.'],
  },
  {
    id: 'team',
    title: 'Theo dõi team',
    icon: '👥',
    roles: [UserRole.MANAGER, UserRole.ADMIN],
    image: 'Minh họa: màn hình quản lý tiến độ nhân sự trong team.',
    steps: [
      'Dành cho Manager và Admin.',
      'Vào Dashboard → Theo dõi team.',
      'Xem tiến độ học, streak, EXP và trạng thái hoạt động của từng nhân sự.',
      'Ưu tiên nhắc những tài khoản không hoạt động quá 7 ngày.',
    ],
    notes: ['Nếu không thấy menu này, tài khoản của bạn chưa có vai trò Manager hoặc Admin.'],
  },
  {
    id: 'admin',
    title: 'Khu vực quản trị',
    icon: '⚙️',
    roles: [UserRole.ADMIN],
    image: 'Minh họa: menu Quản trị và trang Knowledge Base dành cho admin.',
    steps: [
      'Vào Dashboard → Quản trị nếu tài khoản có vai trò Admin.',
      'Dùng các mục quản trị để cấu hình khóa học, câu hỏi, bài thi, AI Coach, level, EXP, huy hiệu, nhiệm vụ và người dùng.',
      'Mở Hướng dẫn admin để đọc wiki chi tiết cho từng nhóm chức năng.',
    ],
    notes: ['Người dùng không có quyền Admin sẽ không nhìn thấy menu Quản trị và không truy cập được Admin Wiki.'],
  },
];

export default function GuidePage(): JSX.Element {
  const { user, loading } = useAuth();

  if (loading || !user) return <LoadingScreen label="Đang tải hướng dẫn" />;

  const visibleGuides = learnerGuides.filter((guide) => {
    if (!('roles' in guide) || !guide.roles) return true;
    return guide.roles.includes(user.role);
  });
  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-8">
      <header className="mkt-card p-8">
        <span className="mkt-pill-orange !text-sm">Knowledge Base</span>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-h1-mkt text-[#005AB3]">Hướng dẫn sử dụng MKT Academy</h1>
            <p className="mt-3 max-w-3xl text-body-mkt text-ice">
              Tài liệu hướng dẫn nhanh cho từng tính năng trong dashboard. Có thể chụp thêm ảnh màn hình thực tế
              và thay vào các khung minh họa bên dưới khi cần làm tài liệu nội bộ.
            </p>
          </div>
          {isAdmin ? (
            <Link href="/dashboard/admin/guide" className="mkt-btn-secondary">
              Hướng dẫn admin →
            </Link>
          ) : null}
        </div>
      </header>

      <section className="mkt-card p-6">
        <h2 className="text-h2-mkt-sm">Mục lục</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleGuides.map((guide) => (
            <a
              key={guide.id}
              href={`#${guide.id}`}
              className="rounded-2xl border border-[#E6E3E7] bg-[#F8FBFF] p-4 font-black text-[#005AB3] transition hover:border-[#A9C9FA] hover:bg-[#EAF3FF]"
            >
              <span className="mr-2">{guide.icon}</span>
              {guide.title}
            </a>
          ))}
        </div>
      </section>

      {visibleGuides.map((guide, index) => (
        <article key={guide.id} id={guide.id} className="mkt-card scroll-mt-28 overflow-hidden">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[#E6E3E7] bg-[#F8FBFF] p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-2xl">
                  {guide.icon}
                </span>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-[#7B8494]">
                    Phần {String(index + 1).padStart(2, '0')}
                  </div>
                  <h2 className="text-h2-mkt-sm">{guide.title}</h2>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-[#A9C9FA] bg-white p-5 text-sm leading-7 text-[#475569]">
                <div className="mb-2 font-black uppercase text-[#0073E0]">Ảnh minh họa</div>
                {guide.image}
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-black uppercase text-[#005AB3]">Cách thao tác</h3>
              <ol className="mt-4 space-y-3">
                {guide.steps.map((step, stepIndex) => (
                  <li key={step} className="flex gap-3 text-sm leading-7 text-[#334155]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF7A00] text-xs font-black text-white">
                      {stepIndex + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-2xl border border-[#D9E7FF] bg-[#F8FBFF] p-4">
                <div className="mb-2 text-sm font-black uppercase text-[#0073E0]">Lưu ý</div>
                <ul className="space-y-2">
                  {guide.notes.map((note) => (
                    <li key={note} className="text-sm leading-7 text-[#475569]">
                      • {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
