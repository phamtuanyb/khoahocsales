const adminGuides = [
  {
    id: 'admin-overview',
    title: 'Tổng quan quản trị',
    icon: '📊',
    purpose: 'Theo dõi sức khỏe toàn hệ thống: nhân sự, hoạt động học tập, bài thi, huy hiệu và cảnh báo không hoạt động.',
    steps: [
      'Vào Quản trị → Tổng quan.',
      'Đọc các thẻ KPI đầu trang để nắm tổng số nhân sự, khóa học, câu hỏi, bài thi và chứng chỉ.',
      'Kiểm tra biểu đồ phân bổ level và tỷ lệ đỗ bài thi để biết phần nào cần cải thiện.',
      'Theo dõi danh sách nhân sự không hoạt động quá 7 ngày để nhắc học lại.',
    ],
    checklist: ['KPI hiển thị đúng', 'Top nhân sự có EXP', 'Danh sách cảnh báo có email và phòng ban'],
  },
  {
    id: 'courses',
    title: 'Khóa học, mô-đun và bài học',
    icon: '📚',
    purpose: 'Xây dựng lộ trình học theo từng khóa, mỗi khóa gồm nhiều mô-đun và bài học.',
    steps: [
      'Vào Quản trị → Khóa học.',
      'Tạo khóa học mới với tên, mô tả, trạng thái active và thứ tự hiển thị.',
      'Mở chi tiết khóa học để thêm mô-đun.',
      'Trong từng mô-đun, thêm bài học, nội dung, video URL và điều kiện mở khóa nếu có.',
      'Kiểm tra lại ở Khu vực học bằng tài khoản học viên để chắc thứ tự hiển thị đúng.',
    ],
    checklist: ['Tên khóa học rõ ràng', 'Mô-đun đúng thứ tự', 'Bài học có nội dung', 'Khóa active khi muốn học viên nhìn thấy'],
  },
  {
    id: 'questions',
    title: 'Ngân hàng câu hỏi',
    icon: '❓',
    purpose: 'Quản lý câu hỏi dùng cho quiz, gồm trắc nghiệm, tình huống và các dạng tương tác.',
    steps: [
      'Vào Quản trị → Ngân hàng câu hỏi.',
      'Bấm tạo câu hỏi hoặc nhập bằng file Excel nếu cần tạo số lượng lớn.',
      'Chọn đúng loại câu hỏi, nhập nội dung, đáp án, giải thích và điểm.',
      'Gắn tag hoặc chủ đề để dễ tìm khi tạo bài thi.',
      'Kiểm tra câu hỏi không bị lỗi dấu tiếng Việt trước khi đưa vào quiz.',
    ],
    checklist: ['Câu hỏi không lỗi font', 'Đáp án đúng được đánh dấu', 'Điểm số hợp lý', 'Giải thích đủ rõ'],
  },
  {
    id: 'quizzes',
    title: 'Bài thi và cấu hình chấm điểm',
    icon: '🎯',
    purpose: 'Tạo bài kiểm tra từ ngân hàng câu hỏi và gắn vào mô-đun học.',
    steps: [
      'Vào Quản trị → Bài thi.',
      'Tạo bài thi mới, nhập tên, mô tả, điểm đạt, thời gian và trạng thái active.',
      'Chọn câu hỏi từ ngân hàng và sắp xếp thứ tự.',
      'Gắn bài thi vào mô-đun phù hợp nếu bài thi thuộc lộ trình khóa học.',
      'Làm thử bằng tài khoản học viên để kiểm tra tính điểm và màn hình kết quả.',
    ],
    checklist: ['Có câu hỏi', 'Điểm đạt phù hợp', 'Thời gian đủ làm bài', 'Active sau khi kiểm thử'],
  },
  {
    id: 'coach',
    title: 'Kịch bản AI Coach',
    icon: '🤖',
    purpose: 'Cấu hình tình huống luyện tư vấn, API key, provider/model và tiêu chí chấm điểm AI.',
    steps: [
      'Vào Quản trị → Kịch bản AI Coach.',
      'Nhập OpenAI hoặc Gemini API key ở phần cấu hình routing.',
      'Chọn provider/model riêng cho AI Coach Chat và AI Chấm điểm để tối ưu chi phí.',
      'Tạo kịch bản mới với mục tiêu phiên, vai khách hàng, bối cảnh, SOP và tiêu chí đánh giá.',
      'Test bằng trang Dashboard → AI Coach để chắc AI phản hồi đúng ngữ cảnh sales.',
    ],
    checklist: [
      'API key hợp lệ',
      'Model chat và model chấm điểm đã chọn',
      'System prompt nêu rõ vai trò khách hàng',
      'Rubric chấm điểm có thái độ, logic xử lý và đúng SOP',
    ],
  },
  {
    id: 'levels',
    title: 'Level và quy đổi EXP',
    icon: '⚡',
    purpose: 'Thiết kế cấp bậc học viên và quy tắc cộng điểm cho hành động học tập.',
    steps: [
      'Vào Quản trị → Level để tạo hoặc chỉnh ngưỡng EXP từng cấp.',
      'Đặt tên level theo lộ trình: Tân Binh, Thực Chiến, Chiến Binh, Elite, Leader.',
      'Vào Quản trị → Bảng quy đổi EXP để cấu hình điểm cho học bài, làm quiz, streak hoặc nhiệm vụ.',
      'Kiểm tra dashboard học viên sau khi hoàn thành hành động để chắc EXP tăng đúng.',
    ],
    checklist: ['Ngưỡng level tăng dần', 'EXP không quá dễ hoặc quá khó', 'Quy tắc cộng điểm có mô tả rõ'],
  },
  {
    id: 'badges-missions',
    title: 'Huy hiệu và nhiệm vụ ngày',
    icon: '🏆',
    purpose: 'Tăng động lực học bằng phần thưởng, huy hiệu và nhiệm vụ theo ngày.',
    steps: [
      'Vào Quản trị → Huy hiệu để tạo huy hiệu, icon, mô tả và điều kiện nhận.',
      'Vào Quản trị → Nhiệm vụ ngày để tạo nhiệm vụ học tập hoặc thi đua.',
      'Đặt phần thưởng EXP hoặc badge cho nhiệm vụ hoàn thành.',
      'Kiểm tra hiển thị ở dashboard học viên và trang Huy hiệu.',
    ],
    checklist: ['Tên huy hiệu dễ hiểu', 'Điều kiện nhận rõ', 'Nhiệm vụ có thời hạn', 'Phần thưởng cân bằng'],
  },
  {
    id: 'departments-users',
    title: 'Phòng ban và người dùng',
    icon: '👥',
    purpose: 'Quản lý cơ cấu đội nhóm, tài khoản học viên, manager và admin.',
    steps: [
      'Vào Quản trị → Phòng ban để tạo phòng ban và gán trưởng nhóm nếu có.',
      'Vào Quản trị → Người dùng để tạo tài khoản, đặt vai trò và phòng ban.',
      'Dùng chức năng import Excel khi cần tạo nhiều tài khoản cùng lúc.',
      'Kiểm tra email, vai trò, trạng thái active và level ban đầu sau khi tạo.',
    ],
    checklist: ['Email không trùng', 'Vai trò đúng', 'Phòng ban đúng', 'Tài khoản active trước khi bàn giao'],
  },
  {
    id: 'audit',
    title: 'Audit log',
    icon: '📋',
    purpose: 'Theo dõi lịch sử thao tác quản trị để truy vết thay đổi quan trọng.',
    steps: [
      'Vào Quản trị → Audit log.',
      'Lọc theo thời gian, người thao tác hoặc loại hành động nếu cần.',
      'Kiểm tra log khi có thay đổi bất thường về người dùng, khóa học, câu hỏi hoặc cấu hình AI.',
    ],
    checklist: ['Log có thời gian', 'Có người thực hiện', 'Có hành động cụ thể', 'Có dữ liệu liên quan khi cần truy vết'],
  },
];

export default function AdminGuidePage(): JSX.Element {
  return (
    <div className="space-y-8">
      <header className="mkt-card p-8">
        <span className="mkt-pill-orange !text-sm">Admin Wiki</span>
        <h1 className="mt-5 text-h1-mkt text-[#005AB3]">Hướng dẫn quản trị hệ thống</h1>
        <p className="mt-3 max-w-4xl text-body-mkt text-ice">
          Knowledge Base dành cho admin MKT Academy. Mỗi phần gồm mục đích, quy trình thao tác,
          checklist kiểm tra và khung gợi ý ảnh minh họa để bổ sung ảnh chụp thực tế khi đào tạo nội bộ.
        </p>
      </header>

      <section className="mkt-card p-6">
        <h2 className="text-h2-mkt-sm">Mục lục quản trị</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {adminGuides.map((guide) => (
            <a
              key={guide.id}
              href={`#${guide.id}`}
              className="rounded-2xl border border-[#E6E3E7] bg-[#F8FBFF] p-4 transition hover:border-[#A9C9FA] hover:bg-[#EAF3FF]"
            >
              <div className="font-black text-[#005AB3]">
                <span className="mr-2">{guide.icon}</span>
                {guide.title}
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">{guide.purpose}</p>
            </a>
          ))}
        </div>
      </section>

      {adminGuides.map((guide, index) => (
        <article key={guide.id} id={guide.id} className="mkt-card scroll-mt-28 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FF] text-2xl">
                {guide.icon}
              </span>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-[#7B8494]">
                  Wiki {String(index + 1).padStart(2, '0')}
                </div>
                <h2 className="text-h2-mkt-sm">{guide.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[#475569]">{guide.purpose}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-[#A9C9FA] bg-[#F8FBFF] p-4 text-sm leading-6 text-[#475569] lg:w-80">
              <div className="mb-2 font-black uppercase text-[#0073E0]">Ảnh minh họa nên chụp</div>
              Chụp màn hình tại menu “{guide.title}”, khoanh vùng nút tạo/sửa và khu vực danh sách dữ liệu.
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-[#E6E3E7] bg-white p-5">
              <h3 className="text-lg font-black uppercase text-[#005AB3]">Quy trình thao tác</h3>
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
            </div>

            <div className="rounded-2xl border border-[#D9E7FF] bg-[#F8FBFF] p-5">
              <h3 className="text-lg font-black uppercase text-[#005AB3]">Checklist trước khi lưu</h3>
              <ul className="mt-4 space-y-3">
                {guide.checklist.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-7 text-[#334155]">
                    <span className="text-[#FF7A00]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
