// ==========================================
// Seed data mẫu cho MKT Academy
// Chạy: npm run prisma:seed --workspace=@mkt-academy/api
//
// Bao gồm:
//  - 1 phòng ban Sales
//  - 5 level theo spec mục 4.1
//  - 3 tài khoản test (admin, manager, learner)
//  - 1 khóa học Sales: 5 mô-đun, 15 bài học (spec mục 6.1)
//  - Ngân hàng câu hỏi: ~22 câu trên 3 dạng (MC, situation, mini-game)
//  - 5 quiz module + 1 Boss Battle Level 1
//  - 3 Daily Mission, 3 Badge
// ==========================================

import {
  PrismaClient,
  QuestionDifficulty,
  QuestionType,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface LessonSeed {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
}

interface ModuleSeed {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonSeed[];
}

interface QuestionSeed {
  id: string;
  type: QuestionType;
  content: string;
  options: unknown;
  answer: unknown;
  difficulty: QuestionDifficulty;
  moduleId: string;
}

interface QuizSeed {
  id: string;
  title: string;
  description: string;
  moduleId?: string;
  levelOrder?: number; // Boss Battle: gắn vào level (sẽ resolve sang levelId)
  passScore: number;
  timeLimitSec: number;
  maxAttempts: number;
  questionIds: string[];
}

// ---------- Nội dung 5 mô-đun Sales ----------
const SALES_MODULES: ModuleSeed[] = [
  {
    id: 'mod-sales-m1',
    title: 'M1 — Quy trình Sales',
    description:
      'Hiểu tổng quan phễu sale, từng bước trong quy trình và vai trò Sales tại MKT.',
    order: 1,
    lessons: [
      {
        id: 'lesson-m1-1',
        title: 'Tổng quan phễu sale',
        content: `Phễu sale (sales funnel) là mô hình mô tả hành trình từ "người lạ" đến "khách hàng trả tiền". Tại Phần mềm MKT, phễu gồm 5 tầng cơ bản:

1. Lead — người để lại thông tin qua quảng cáo, landing page, hoặc giới thiệu.
2. Qualified Lead — đã được sàng lọc: đúng đối tượng, có nhu cầu, có ngân sách.
3. Opportunity — đã có cuộc tư vấn / demo chính thức, khách thể hiện sự quan tâm rõ ràng.
4. Proposal — đã gửi báo giá / đề xuất phương án.
5. Closed-Won — chốt đơn thành công, ký hợp đồng và bàn giao tài khoản.

Hiểu phễu là hiểu mình đang ở đâu với từng khách hàng. Mỗi tầng phễu có hành động & câu hỏi đặc trưng — không bỏ bước, không nhảy cóc.`,
      },
      {
        id: 'lesson-m1-2',
        title: 'Các bước trong quy trình Sales MKT',
        content: `Quy trình chuẩn của Sales MKT gồm 7 bước, lặp đi lặp lại cho mỗi cơ hội:

Bước 1 — Tiếp nhận lead từ Marketing (form, ads, hotline, Zalo OA).
Bước 2 — Liên hệ lần đầu trong vòng 5 phút (nguyên tắc 5-minute rule).
Bước 3 — Khai thác nhu cầu: dùng khung BANT (Budget, Authority, Need, Timing).
Bước 4 — Demo sản phẩm theo đúng pain point đã khai thác.
Bước 5 — Gửi báo giá kèm phương án phù hợp.
Bước 6 — Xử lý từ chối, đàm phán & chốt.
Bước 7 — Bàn giao khách cho CSKH, ghi nhận case study.

Trong tất cả các bước, ghi log đầy đủ vào CRM của MKT — không có dữ liệu = không có cải tiến.`,
      },
      {
        id: 'lesson-m1-3',
        title: 'Vai trò Sales tại MKT',
        content: `Sales tại MKT không chỉ là "người bán phần mềm". Bạn là:

— Người tư vấn giải pháp: hiểu sản phẩm sâu để gợi ý đúng tính năng cho nhu cầu khách.
— Người đại diện thương hiệu: lời nói của bạn là hình ảnh của Phần mềm MKT trước khách hàng.
— Người mở đường cho CSKH: chất lượng bàn giao quyết định trải nghiệm 12 tháng sau.
— Người feedback ngược cho team Product: phản hồi từ khách hàng là vàng để Product cải tiến.

Vì vậy Sales MKT cần ba phẩm chất cốt lõi: tốc độ (phản hồi nhanh), trung thực (không hứa quá), và kỷ luật (log đủ dữ liệu vào CRM).`,
      },
    ],
  },
  {
    id: 'mod-sales-m2',
    title: 'M2 — Script gọi điện',
    description:
      'Cấu trúc cuộc gọi chuẩn, kỹ thuật mở đầu tạo thiện cảm và khai thác nhu cầu khách.',
    order: 2,
    lessons: [
      {
        id: 'lesson-m2-1',
        title: 'Cấu trúc cuộc gọi chuẩn 4 phần',
        content: `Một cuộc gọi sale hiệu quả luôn có 4 phần rõ ràng:

Phần 1 — Mở đầu (15 giây vàng): chào, giới thiệu bản thân + công ty, xin phép 2-3 phút trao đổi.
Phần 2 — Khai thác nhu cầu (50% thời lượng): hỏi mở, lắng nghe, ghi note. Mục tiêu là khách nói nhiều hơn bạn.
Phần 3 — Đề xuất giải pháp: dựa trên nhu cầu vừa khai thác, gợi ý 1 hướng đi cụ thể (không liệt kê tất cả tính năng).
Phần 4 — Kết & next step: chốt một hành động tiếp theo cụ thể (demo lúc mấy giờ, gửi báo giá email nào).

Không phần nào được phép thiếu. Nếu thiếu khai thác, bạn đang bán mù.`,
      },
      {
        id: 'lesson-m2-2',
        title: 'Mở đầu tạo thiện cảm',
        content: `Trong 15 giây đầu, khách quyết định có muốn nghe tiếp hay không. Công thức mở đầu chuẩn của MKT:

"Em chào anh/chị [Tên], em là [Tên bạn] gọi từ Phần mềm MKT. Em thấy mình vừa để lại thông tin quan tâm về [tính năng cụ thể] trên fanpage. Em xin phép trao đổi 2 phút để hiểu rõ nhu cầu, sau đó nếu phù hợp em sẽ gợi ý giải pháp cụ thể cho mình ạ — em chia sẻ luôn được không?"

Lưu ý 3 điều: gọi tên khách, nhắc đúng tính năng họ quan tâm, và xin phép trước khi nói tiếp. Không "thao thao bất tuyệt" về sản phẩm trong 30 giây đầu — đó là cách nhanh nhất để bị cúp máy.`,
      },
      {
        id: 'lesson-m2-3',
        title: 'Kỹ thuật khai thác nhu cầu',
        content: `Khai thác nhu cầu là kỹ năng quan trọng nhất của Sales. Dùng khung 4 câu hỏi mở:

1. "Anh/chị đang dùng cách nào để xử lý [vấn đề]? Có khó khăn gì không?" — hiểu hiện trạng.
2. "Nếu giải quyết được điều đó, anh/chị kỳ vọng kết quả như thế nào?" — hiểu mong muốn.
3. "Vấn đề này đang ảnh hưởng đến doanh số / vận hành ra sao?" — hiểu mức độ đau.
4. "Anh/chị muốn giải quyết trong khoảng thời gian nào?" — hiểu deadline.

Trong quá trình hỏi, IM LẶNG sau khi khách trả lời 1-2 giây để họ nói thêm. 80% Sales mới mắc lỗi nhảy vào nói liền — đó là lúc bạn mất thông tin vàng.`,
      },
    ],
  },
  {
    id: 'mod-sales-m3',
    title: 'M3 — Kỹ năng chốt sale',
    description:
      'Nhận diện tín hiệu mua hàng, các kỹ thuật chốt phổ biến và cách tạo cảm giác cấp bách.',
    order: 3,
    lessons: [
      {
        id: 'lesson-m3-1',
        title: 'Tín hiệu mua hàng — đọc khi nào nên chốt',
        content: `Khách hàng luôn phát tín hiệu trước khi mua. Học đọc đúng tín hiệu = chốt đúng thời điểm:

Tín hiệu lời nói:
— "Cái này dùng thì cần setup mất bao lâu?"
— "Nếu mua thì có hỗ trợ training không?"
— "Gói nào phù hợp với team 10 người nhỉ?"

Tín hiệu hành vi:
— Hỏi đi hỏi lại 1 tính năng cụ thể.
— Đột nhiên im lặng, suy nghĩ.
— Yêu cầu xem lại báo giá / demo.

Khi nhận tín hiệu, ĐỪNG tiếp tục thuyết trình — chuyển ngay sang câu hỏi chốt: "Vậy mình bắt đầu với gói X từ tuần sau nhé?"`,
      },
      {
        id: 'lesson-m3-2',
        title: '5 kỹ thuật chốt phổ biến',
        content: `Mỗi kỹ thuật chốt phù hợp một tình huống khác nhau:

1. Chốt giả định (Assumptive Close): "Em gửi hợp đồng vào email này nhé?" — dùng khi khách đã sẵn sàng nhưng còn ngần ngại quyết.
2. Chốt lựa chọn (Alternative Close): "Mình muốn bắt đầu thứ 2 hay thứ 4 tuần sau?" — cho 2 lựa chọn, cái nào cũng dẫn đến mua.
3. Chốt tóm tắt (Summary Close): tóm tắt 3 lợi ích chính, rồi hỏi "Mình thấy phù hợp chứ ạ?"
4. Chốt cấp bách (Urgency Close): "Đợt khuyến mãi này còn 2 ngày, em giữ giá cho anh chị nhé?" — dùng khi có deal thật, không bịa.
5. Chốt câu hỏi (Question Close): "Còn điều gì khiến anh chị chưa quyết định không?" — moi ra phản đối ẩn.

Quy tắc vàng: chỉ chốt sau khi đã xử lý 100% phản đối.`,
      },
      {
        id: 'lesson-m3-3',
        title: 'Tạo cảm giác cấp bách đúng cách',
        content: `Cấp bách thật khác với cấp bách giả. Cấp bách thật khiến khách hành động ngay. Cấp bách giả khiến khách mất niềm tin.

Cách tạo cấp bách thật:
— Khuyến mãi có deadline rõ ràng (đăng công khai trên fanpage MKT).
— Số lượng có hạn (VD: 20 suất tư vấn 1-1 với CEO mỗi tháng).
— Cơ hội đặc biệt theo mùa vụ (mùa cao điểm sale của khách).
— Ràng buộc lịch của team Onboarding ("nếu ký tuần sau em book được lịch setup luôn").

ĐỪNG bịa "chỉ còn hôm nay" khi không có thật. Một lần lộ ra là mất khách vĩnh viễn — và khách sẽ nói với người khác.`,
      },
    ],
  },
  {
    id: 'mod-sales-m4',
    title: 'M4 — Xử lý từ chối',
    description:
      'Phân loại lời từ chối, công thức xử lý phản đối và luyện với AI Coach.',
    order: 4,
    lessons: [
      {
        id: 'lesson-m4-1',
        title: 'Phân loại 4 nhóm từ chối',
        content: `Lời từ chối của khách thường rơi vào 4 nhóm. Đọc đúng nhóm = xử lý đúng cách:

Nhóm 1 — Giá: "Đắt quá", "Bên kia rẻ hơn", "Chưa có ngân sách".
→ Vấn đề thật là giá trị, không phải giá. Quay lại làm rõ ROI.

Nhóm 2 — Tính năng: "Thiếu cái này", "Bên đối thủ có thêm cái kia".
→ Hỏi sâu "Cái đó anh chị dùng tần suất ra sao?" — 70% lần là tính năng họ không thực sự cần.

Nhóm 3 — Niềm tin: "Chưa thấy ai dùng", "Sợ rủi ro", "Mua xong bỏ rơi".
→ Đưa case study, mời demo + 7 ngày dùng thử, cam kết support bằng văn bản.

Nhóm 4 — Thời điểm: "Để sau", "Đang bận", "Quý sau tính".
→ Hỏi cụ thể "Sau là khi nào ạ?" — nếu khách không nói được mốc cụ thể, đó là từ chối khéo.`,
      },
      {
        id: 'lesson-m4-2',
        title: 'Công thức LAARC xử lý phản đối',
        content: `LAARC là công thức 5 bước chuẩn quốc tế, đã được đào tạo nội bộ tại MKT:

L — Listen (Lắng nghe): để khách nói hết, không cắt lời. Note lại ý chính.
A — Acknowledge (Thừa nhận): "Em hiểu lo lắng của anh chị về [vấn đề]" — không tranh cãi.
A — Assess (Đánh giá): hỏi sâu để hiểu phản đối thật là gì. "Cụ thể anh chị lo nhất điều gì?"
R — Respond (Phản hồi): đưa ra câu trả lời dựa trên thông tin vừa khai thác.
C — Confirm (Xác nhận): "Em giải thích vậy có giải đáp được băn khoăn của anh chị chưa?"

Đừng bỏ qua bước C — nếu khách vẫn lăn tăn mà bạn đã sang bước chốt thì sẽ trượt deal.`,
      },
      {
        id: 'lesson-m4-3',
        title: 'Luyện với AI Coach — kịch bản "chê giá cao"',
        content: `Sau khi nắm lý thuyết, vào mục AI Coach để luyện thực chiến với kịch bản "Khách chê giá cao".

AI sẽ đóng vai khách hàng khó tính, đưa ra các lời từ chối thật như:
— "Bên kia chỉ 200 nghìn / tháng thôi, sao MKT đắt thế?"
— "Tôi chưa thấy bằng chứng dùng phần mềm này tăng được doanh số."
— "Để tôi suy nghĩ thêm đã."

Nhiệm vụ của bạn: áp dụng LAARC, không bị mất bình tĩnh, không hạ giá tùy tiện. AI sẽ chấm theo 3 tiêu chí (thái độ 30%, logic 35%, đúng SOP 35%) và gợi ý điểm cần cải thiện.

Luyện đủ 5 lần trước khi nhận khách thật.`,
      },
    ],
  },
  {
    id: 'mod-sales-m5',
    title: 'M5 — Demo sản phẩm',
    description:
      'Demo phần mềm MKT theo nhu cầu khách và cách kết nối tính năng với lợi ích.',
    order: 5,
    lessons: [
      {
        id: 'lesson-m5-1',
        title: 'Demo theo nhu cầu — không "tour tính năng"',
        content: `Lỗi phổ biến nhất của Sales mới: mở phần mềm rồi click hết menu này đến menu kia. Đó KHÔNG phải demo — đó là "tour tính năng" và khách sẽ ngủ gật.

Demo chuẩn của MKT gồm 4 bước:
1. Tóm tắt lại pain point đã khai thác: "Như anh chị chia sẻ, đang khó kiểm soát chiến dịch chạy đa nền tảng phải không ạ?"
2. Show ĐÚNG tính năng giải quyết pain đó. Không click thêm cái gì khác.
3. Cho khách tự thử (handover chuột nếu demo online): "Anh chị thử kéo thử chiến dịch sang trạng thái xong nhé?"
4. Hỏi xác nhận: "Như vậy có giải quyết được vấn đề ban đầu của mình không?"

Quy tắc: 1 pain → 1 tính năng → 1 lần xác nhận. Lặp lại với pain khác.`,
      },
      {
        id: 'lesson-m5-2',
        title: 'Kết nối Tính năng — Lợi ích — Giá trị cảm xúc',
        content: `Khi giới thiệu mỗi tính năng, luôn áp dụng công thức F-B-V:

F — Feature (Tính năng): mô tả khách quan tính năng làm gì.
   VD: "Phần mềm MKT có chức năng đăng bài tự động hẹn giờ trên 5 nền tảng."

B — Benefit (Lợi ích): tính năng đó đem lại lợi ích đo lường được.
   VD: "Tiết kiệm 3-4 tiếng mỗi ngày so với đăng tay."

V — Value (Giá trị cảm xúc): cảm xúc / kết quả khách thực sự muốn.
   VD: "Anh chị về nhà sớm chơi với con, không phải dán mắt vào điện thoại đăng bài tới 11h đêm như trước."

Sales kém chỉ nói F. Sales khá nói F + B. Sales giỏi của MKT nói đủ F + B + V.`,
      },
      {
        id: 'lesson-m5-3',
        title: 'Demo phần mềm MKT — checklist 10 điểm',
        content: `Trước mỗi buổi demo, check đủ 10 điểm sau:

Chuẩn bị:
1. Đã đọc lại note khai thác nhu cầu chưa?
2. Đã chuẩn bị tài khoản demo có sẵn data đúng ngành khách chưa?
3. Đã test đường truyền, microphone, chia sẻ màn hình chưa?
4. Đã có sẵn case study cùng ngành để show nếu cần chưa?
5. Đã set agenda gửi khách trước buổi demo chưa?

Trong demo:
6. Có tóm tắt lại pain point ngay đầu buổi không?
7. Có giới hạn demo trong 25-30 phút không (không kéo dài 1 tiếng)?
8. Có cho khách thực hành / đặt câu hỏi giữa chừng không?
9. Có chốt next step rõ ràng cuối buổi không?
10. Có gửi recording + tóm tắt qua email trong 2 tiếng sau demo không?

Đây là checklist bắt buộc của Sales MKT. Bỏ điểm nào là Manager sẽ trừ điểm khi review.`,
      },
    ],
  },
];

// ---------- Ngân hàng câu hỏi ----------
const QUESTIONS: QuestionSeed[] = [
  // ===== M1 — Quy trình Sales =====
  {
    id: 'q-m1-mc-1',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m1',
    difficulty: QuestionDifficulty.EASY,
    content: 'Tầng đầu tiên của phễu sale MKT là gì?',
    options: [
      { key: 'A', text: 'Proposal' },
      { key: 'B', text: 'Lead' },
      { key: 'C', text: 'Opportunity' },
      { key: 'D', text: 'Closed-Won' },
    ],
    answer: { correct: 'B' },
  },
  {
    id: 'q-m1-mc-2',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m1',
    difficulty: QuestionDifficulty.EASY,
    content: 'Nguyên tắc "5-minute rule" trong quy trình Sales MKT nghĩa là gì?',
    options: [
      { key: 'A', text: 'Mỗi cuộc gọi chỉ kéo dài 5 phút.' },
      { key: 'B', text: 'Sales phải dành 5 phút đầu giờ làm việc để xem lead.' },
      { key: 'C', text: 'Liên hệ với lead mới trong vòng 5 phút kể từ khi nhận.' },
      { key: 'D', text: 'Chỉ gọi lại khách trong 5 phút sau khi khách phản hồi.' },
    ],
    answer: { correct: 'C' },
  },
  {
    id: 'q-m1-mc-3',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m1',
    difficulty: QuestionDifficulty.MEDIUM,
    content:
      'Trong khung BANT, chữ "A" đại diện cho yếu tố nào của khách hàng?',
    options: [
      { key: 'A', text: 'Authority — người ra quyết định' },
      { key: 'B', text: 'Attitude — thái độ với sản phẩm' },
      { key: 'C', text: 'Awareness — mức độ nhận biết thương hiệu' },
      { key: 'D', text: 'Agreement — sự đồng thuận của team' },
    ],
    answer: { correct: 'A' },
  },
  {
    id: 'q-m1-mc-4',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m1',
    difficulty: QuestionDifficulty.MEDIUM,
    content: 'Ba phẩm chất cốt lõi của Sales MKT là gì?',
    options: [
      { key: 'A', text: 'Năng động, vui vẻ, ngoại hình' },
      { key: 'B', text: 'Tốc độ, trung thực, kỷ luật' },
      { key: 'C', text: 'Kinh nghiệm, ngoại ngữ, bằng cấp' },
      { key: 'D', text: 'Hài hước, kiên nhẫn, mềm mỏng' },
    ],
    answer: { correct: 'B' },
  },
  // Mini-game: sắp xếp 5 bước (lấy từ 7 bước, gộp lại) — spec mục 6.2.
  {
    id: 'q-m1-drag-1',
    type: QuestionType.MINI_GAME,
    moduleId: 'mod-sales-m1',
    difficulty: QuestionDifficulty.MEDIUM,
    content: 'Sắp xếp đúng thứ tự 5 bước trong quy trình Sales MKT (kéo-thả):',
    options: [
      { id: 'step-lead', text: 'Tiếp nhận lead từ Marketing' },
      { id: 'step-contact', text: 'Liên hệ lần đầu trong 5 phút' },
      { id: 'step-discover', text: 'Khai thác nhu cầu (BANT)' },
      { id: 'step-demo', text: 'Demo sản phẩm theo pain point' },
      { id: 'step-close', text: 'Xử lý phản đối & chốt đơn' },
    ],
    answer: {
      correctOrder: [
        'step-lead',
        'step-contact',
        'step-discover',
        'step-demo',
        'step-close',
      ],
    },
  },

  // ===== M2 — Script gọi điện =====
  {
    id: 'q-m2-mc-1',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m2',
    difficulty: QuestionDifficulty.EASY,
    content: 'Trong cấu trúc cuộc gọi 4 phần, phần nào chiếm khoảng 50% thời lượng?',
    options: [
      { key: 'A', text: 'Mở đầu' },
      { key: 'B', text: 'Khai thác nhu cầu' },
      { key: 'C', text: 'Đề xuất giải pháp' },
      { key: 'D', text: 'Kết & next step' },
    ],
    answer: { correct: 'B' },
  },
  {
    id: 'q-m2-mc-2',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m2',
    difficulty: QuestionDifficulty.MEDIUM,
    content:
      '"15 giây vàng" trong cuộc gọi sale có ý nghĩa gì?',
    options: [
      { key: 'A', text: 'Thời gian quảng cáo trên fanpage.' },
      { key: 'B', text: 'Khoảng thời gian khách quyết định có muốn nghe tiếp hay không.' },
      { key: 'C', text: 'Thời lượng giới thiệu sản phẩm.' },
      { key: 'D', text: 'Thời gian phản hồi tin nhắn của khách.' },
    ],
    answer: { correct: 'B' },
  },
  {
    id: 'q-m2-mc-3',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m2',
    difficulty: QuestionDifficulty.MEDIUM,
    content:
      'Sau khi khách trả lời 1 câu hỏi khai thác, Sales nên làm gì NGAY tiếp theo?',
    options: [
      { key: 'A', text: 'Nói ngay về tính năng phần mềm.' },
      { key: 'B', text: 'Chuyển sang câu hỏi tiếp theo.' },
      { key: 'C', text: 'Im lặng 1-2 giây để khách nói thêm.' },
      { key: 'D', text: 'Báo giá luôn để chốt nhanh.' },
    ],
    answer: { correct: 'C' },
  },
  {
    id: 'q-m2-sit-1',
    type: QuestionType.SITUATION,
    moduleId: 'mod-sales-m2',
    difficulty: QuestionDifficulty.HARD,
    content:
      'Khách nói: "Anh đang bận, chỉ có 2 phút thôi nhé." Hãy viết câu mở đầu của bạn để vừa tôn trọng thời gian khách vừa khai thác được nhu cầu chính.',
    options: null,
    answer: {
      keywords: ['cảm ơn', 'tôn trọng', 'nhu cầu', '2 phút', 'xin phép'],
      minScore: 40,
    },
  },

  // ===== M3 — Kỹ năng chốt sale =====
  {
    id: 'q-m3-mc-1',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m3',
    difficulty: QuestionDifficulty.EASY,
    content:
      'Câu nào sau đây là TÍN HIỆU MUA HÀNG rõ ràng?',
    options: [
      { key: 'A', text: '"Để tôi suy nghĩ thêm."' },
      { key: 'B', text: '"Cái này dùng cần setup mất bao lâu nhỉ?"' },
      { key: 'C', text: '"Bên kia rẻ hơn nhiều."' },
      { key: 'D', text: '"Tôi đang bận, gọi lại sau."' },
    ],
    answer: { correct: 'B' },
  },
  {
    id: 'q-m3-mc-2',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m3',
    difficulty: QuestionDifficulty.MEDIUM,
    content:
      'Kỹ thuật "Alternative Close" hoạt động như thế nào?',
    options: [
      { key: 'A', text: 'Đưa ra giảm giá thay thế khi khách chê đắt.' },
      { key: 'B', text: 'Cho khách 2 lựa chọn, cái nào cũng dẫn tới mua.' },
      { key: 'C', text: 'Hỏi khách có muốn xem sản phẩm khác không.' },
      { key: 'D', text: 'Chuyển khách sang một Sales khác có deal tốt hơn.' },
    ],
    answer: { correct: 'B' },
  },
  {
    id: 'q-m3-mc-3',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m3',
    difficulty: QuestionDifficulty.HARD,
    content:
      'Quy tắc vàng khi chốt sale tại MKT là gì?',
    options: [
      { key: 'A', text: 'Chốt càng sớm càng tốt để khách không kịp suy nghĩ.' },
      { key: 'B', text: 'Chỉ chốt sau khi đã xử lý 100% phản đối.' },
      { key: 'C', text: 'Chốt bằng cách giảm giá tối đa cho phép.' },
      { key: 'D', text: 'Chốt bằng cam kết hoàn tiền vô điều kiện.' },
    ],
    answer: { correct: 'B' },
  },

  // ===== M4 — Xử lý từ chối =====
  {
    id: 'q-m4-mc-1',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m4',
    difficulty: QuestionDifficulty.EASY,
    content: '"Đắt quá" thuộc nhóm từ chối nào trong 4 nhóm?',
    options: [
      { key: 'A', text: 'Nhóm Giá' },
      { key: 'B', text: 'Nhóm Tính năng' },
      { key: 'C', text: 'Nhóm Niềm tin' },
      { key: 'D', text: 'Nhóm Thời điểm' },
    ],
    answer: { correct: 'A' },
  },
  {
    id: 'q-m4-mc-2',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m4',
    difficulty: QuestionDifficulty.MEDIUM,
    content: 'Trong công thức LAARC, chữ "C" cuối cùng đại diện cho bước nào?',
    options: [
      { key: 'A', text: 'Close — Chốt đơn' },
      { key: 'B', text: 'Communicate — Truyền đạt' },
      { key: 'C', text: 'Confirm — Xác nhận đã giải đáp băn khoăn' },
      { key: 'D', text: 'Convince — Thuyết phục' },
    ],
    answer: { correct: 'C' },
  },
  {
    id: 'q-m4-sit-1',
    type: QuestionType.SITUATION,
    moduleId: 'mod-sales-m4',
    difficulty: QuestionDifficulty.HARD,
    content:
      'Khách hàng nói: "Bên kia chỉ 200 nghìn / tháng thôi, sao MKT đắt thế?". Viết phản hồi của bạn dùng đúng công thức LAARC.',
    options: null,
    answer: {
      keywords: [
        'lắng nghe',
        'thừa nhận',
        'hiểu',
        'giá trị',
        'roi',
        'khác biệt',
        'xác nhận',
      ],
      minScore: 40,
    },
  },

  // ===== M5 — Demo sản phẩm =====
  {
    id: 'q-m5-mc-1',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m5',
    difficulty: QuestionDifficulty.EASY,
    content: 'Lỗi phổ biến nhất khi demo sản phẩm là gì?',
    options: [
      { key: 'A', text: 'Demo quá ngắn.' },
      { key: 'B', text: 'Demo theo "tour tính năng" thay vì bám pain point.' },
      { key: 'C', text: 'Cho khách thử thao tác.' },
      { key: 'D', text: 'Hỏi xác nhận nhiều lần.' },
    ],
    answer: { correct: 'B' },
  },
  {
    id: 'q-m5-mc-2',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m5',
    difficulty: QuestionDifficulty.MEDIUM,
    content:
      'Trong công thức F-B-V, "V" (Value — giá trị cảm xúc) khác với "B" (Benefit) ở điểm nào?',
    options: [
      { key: 'A', text: 'V là tiền tiết kiệm cụ thể, B là cảm xúc.' },
      { key: 'B', text: 'V là cảm xúc / kết quả khách thực sự muốn; B là lợi ích đo lường được.' },
      { key: 'C', text: 'V và B giống nhau, chỉ khác cách gọi.' },
      { key: 'D', text: 'V dành cho doanh nghiệp, B dành cho cá nhân.' },
    ],
    answer: { correct: 'B' },
  },
  {
    id: 'q-m5-mc-3',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m5',
    difficulty: QuestionDifficulty.MEDIUM,
    content:
      'Theo checklist demo MKT, sau buổi demo trong bao lâu cần gửi recording + tóm tắt qua email?',
    options: [
      { key: 'A', text: 'Trong 24 giờ' },
      { key: 'B', text: 'Trong 2 tiếng' },
      { key: 'C', text: 'Cuối ngày' },
      { key: 'D', text: 'Tuần sau' },
    ],
    answer: { correct: 'B' },
  },

  // ===== BOSS BATTLE Level 1 — case tổng hợp khó =====
  {
    id: 'q-boss-l1-sit-1',
    type: QuestionType.SITUATION,
    moduleId: 'mod-sales-m5',
    difficulty: QuestionDifficulty.HARD,
    content:
      'Khách đã dùng phần mềm đối thủ 6 tháng, chê giá MKT cao hơn 30%, và yêu cầu demo trong 15 phút. Viết kịch bản phản hồi của bạn — bắt đầu từ chào hỏi, khai thác lý do chưa hài lòng với đối thủ, đến demo theo pain point và đề xuất next step.',
    options: null,
    answer: {
      keywords: [
        'cảm ơn',
        'lý do',
        'không hài lòng',
        'pain',
        'demo',
        'roi',
        'giá trị',
        'next step',
        'tóm tắt',
      ],
      minScore: 50,
    },
  },
  {
    id: 'q-boss-l1-mc-1',
    type: QuestionType.MULTIPLE_CHOICE,
    moduleId: 'mod-sales-m5',
    difficulty: QuestionDifficulty.HARD,
    content:
      'Khách đã ký hợp đồng. Hành động ĐẦU TIÊN của Sales MKT phải làm là gì?',
    options: [
      { key: 'A', text: 'Liên hệ ngay khách hàng tiềm năng khác.' },
      { key: 'B', text: 'Bàn giao chi tiết cho CSKH với đầy đủ note khai thác.' },
      { key: 'C', text: 'Đăng story khoe doanh số.' },
      { key: 'D', text: 'Yêu cầu khách giới thiệu thêm.' },
    ],
    answer: { correct: 'B' },
  },
];

// ---------- Quiz config ----------
const QUIZZES: QuizSeed[] = [
  {
    id: 'quiz-m1',
    title: 'Bài thi M1 — Quy trình Sales',
    description: '4 câu trắc nghiệm + 1 mini-game kéo-thả',
    moduleId: 'mod-sales-m1',
    passScore: 70,
    timeLimitSec: 600,
    maxAttempts: 5,
    questionIds: ['q-m1-mc-1', 'q-m1-mc-2', 'q-m1-mc-3', 'q-m1-mc-4', 'q-m1-drag-1'],
  },
  {
    id: 'quiz-m2',
    title: 'Bài thi M2 — Script gọi điện',
    description: '3 trắc nghiệm + 1 tình huống tự luận',
    moduleId: 'mod-sales-m2',
    passScore: 70,
    timeLimitSec: 600,
    maxAttempts: 5,
    questionIds: ['q-m2-mc-1', 'q-m2-mc-2', 'q-m2-mc-3', 'q-m2-sit-1'],
  },
  {
    id: 'quiz-m3',
    title: 'Bài thi M3 — Kỹ năng chốt sale',
    description: '3 câu trắc nghiệm',
    moduleId: 'mod-sales-m3',
    passScore: 70,
    timeLimitSec: 480,
    maxAttempts: 5,
    questionIds: ['q-m3-mc-1', 'q-m3-mc-2', 'q-m3-mc-3'],
  },
  {
    id: 'quiz-m4',
    title: 'Bài thi M4 — Xử lý từ chối',
    description: '2 trắc nghiệm + 1 tình huống LAARC',
    moduleId: 'mod-sales-m4',
    passScore: 70,
    timeLimitSec: 720,
    maxAttempts: 5,
    questionIds: ['q-m4-mc-1', 'q-m4-mc-2', 'q-m4-sit-1'],
  },
  {
    id: 'quiz-m5',
    title: 'Bài thi M5 — Demo sản phẩm',
    description: '3 câu trắc nghiệm',
    moduleId: 'mod-sales-m5',
    passScore: 70,
    timeLimitSec: 600,
    maxAttempts: 5,
    questionIds: ['q-m5-mc-1', 'q-m5-mc-2', 'q-m5-mc-3'],
  },
  {
    id: 'quiz-boss-l1',
    title: 'BOSS BATTLE — Level 1: Tân Binh → Thực Chiến',
    description:
      'Bài thi cuối Level 1. Vượt qua sẽ nhận +200 EXP bonus và mở khóa Level kế tiếp.',
    levelOrder: 1,
    passScore: 60,
    timeLimitSec: 1200,
    maxAttempts: 3,
    questionIds: ['q-boss-l1-mc-1', 'q-boss-l1-sit-1'],
  },
];

async function main(): Promise<void> {
  console.log('🌱 Bắt đầu seed dữ liệu mẫu...');

  // ---------- 1) Phòng ban ----------
  const salesDept = await prisma.department.upsert({
    where: { name: 'Sales' },
    update: {},
    create: { name: 'Sales' },
  });
  console.log(`  ✓ Phòng ban: ${salesDept.name}`);

  // ---------- 2) 5 Level ----------
  const levelsData = [
    { order: 1, name: 'Tân Binh', expThreshold: 0, description: 'Hiểu văn hóa công ty + sản phẩm' },
    { order: 2, name: 'Thực Chiến', expThreshold: 300, description: 'Biết tư vấn, demo sản phẩm cơ bản' },
    { order: 3, name: 'Chiến Binh Sales', expThreshold: 1000, description: 'Chốt được đơn thực tế' },
    { order: 4, name: 'Elite', expThreshold: 2300, description: 'Đào tạo, kèm cặp người mới' },
    { order: 5, name: 'Leader', expThreshold: 4300, description: 'Quản trị & xây quy trình cho team' },
  ];

  const levels = [];
  for (const lvl of levelsData) {
    const created = await prisma.level.upsert({
      where: { order: lvl.order },
      update: lvl,
      create: lvl,
    });
    levels.push(created);
  }
  console.log(`  ✓ Đã seed ${levels.length} Level`);

  const level1 = levels[0]!;

  // ---------- 3) Tài khoản ----------
  const passwordHash = await bcrypt.hash('VietNam2025@', 10);

  await prisma.user.upsert({
    where: { email: 'phamtuan91yb@gmail.com' },
    update: {
      name: 'Quản trị viên',
      passwordHash,
      role: UserRole.ADMIN,
      departmentId: salesDept.id,
    },
    create: {
      email: 'phamtuan91yb@gmail.com',
      name: 'Quản trị viên',
      passwordHash,
      role: UserRole.ADMIN,
      departmentId: salesDept.id,
      profile: { create: { exp: 0, levelId: level1.id, streakCount: 0 } },
    },
  });
  await prisma.user.upsert({
    where: { email: 'manager.sales@mkt.local' },
    update: {},
    create: {
      email: 'manager.sales@mkt.local',
      name: 'Trưởng phòng Sales',
      passwordHash,
      role: UserRole.MANAGER,
      departmentId: salesDept.id,
      profile: { create: { exp: 0, levelId: level1.id, streakCount: 0 } },
    },
  });
  await prisma.user.upsert({
    where: { email: 'learner.sales@mkt.local' },
    update: {},
    create: {
      email: 'learner.sales@mkt.local',
      name: 'Nhân Sự Mới',
      passwordHash,
      role: UserRole.LEARNER,
      departmentId: salesDept.id,
      profile: { create: { exp: 0, levelId: level1.id, streakCount: 0 } },
    },
  });
  console.log('  ✓ 3 tài khoản test');

  // ---------- 4) Khóa học + mô-đun + bài học ----------
  const salesCourse = await prisma.course.upsert({
    where: { id: 'course-sales-mvp' },
    update: {
      title: 'Đào tạo Sales — MVP',
      description: 'Cây khóa học MVP cho nhân sự Sales theo spec mục 6.1',
      order: 1,
      isPublished: true,
    },
    create: {
      id: 'course-sales-mvp',
      departmentId: salesDept.id,
      title: 'Đào tạo Sales — MVP',
      description: 'Cây khóa học MVP cho nhân sự Sales theo spec mục 6.1',
      order: 1,
      isPublished: true,
    },
  });

  for (const mod of SALES_MODULES) {
    await prisma.module.upsert({
      where: { id: mod.id },
      update: {
        title: mod.title,
        description: mod.description,
        order: mod.order,
        courseId: salesCourse.id,
      },
      create: {
        id: mod.id,
        courseId: salesCourse.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
      },
    });

    for (let i = 0; i < mod.lessons.length; i++) {
      const lesson = mod.lessons[i]!;
      await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: {
          title: lesson.title,
          content: lesson.content,
          videoUrl: lesson.videoUrl ?? null,
          order: i + 1,
          moduleId: mod.id,
        },
        create: {
          id: lesson.id,
          moduleId: mod.id,
          title: lesson.title,
          content: lesson.content,
          videoUrl: lesson.videoUrl ?? null,
          order: i + 1,
        },
      });
    }
  }
  console.log(
    `  ✓ Khóa học Sales: ${SALES_MODULES.length} mô-đun, ${SALES_MODULES.reduce(
      (s, m) => s + m.lessons.length,
      0,
    )} bài học`,
  );

  // ---------- 5) Ngân hàng câu hỏi ----------
  for (const q of QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        type: q.type,
        content: q.content,
        options: q.options as object,
        answer: q.answer as object,
        difficulty: q.difficulty,
        moduleId: q.moduleId,
      },
      create: {
        id: q.id,
        type: q.type,
        content: q.content,
        options: q.options as object,
        answer: q.answer as object,
        difficulty: q.difficulty,
        moduleId: q.moduleId,
      },
    });
  }
  console.log(`  ✓ Ngân hàng câu hỏi: ${QUESTIONS.length} câu`);

  // ---------- 6) Quizzes ----------
  for (const quiz of QUIZZES) {
    const levelId =
      quiz.levelOrder !== undefined
        ? levels.find((l) => l.order === quiz.levelOrder)?.id ?? null
        : null;

    // Xóa quan hệ cũ rồi tạo lại (đảm bảo questionIds cập nhật đúng).
    await prisma.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

    await prisma.quiz.upsert({
      where: { id: quiz.id },
      update: {
        title: quiz.title,
        description: quiz.description,
        moduleId: quiz.moduleId ?? null,
        levelId,
        passScore: quiz.passScore,
        timeLimitSec: quiz.timeLimitSec,
        maxAttempts: quiz.maxAttempts,
        isActive: true,
        questions: {
          create: quiz.questionIds.map((qid, idx) => ({
            questionId: qid,
            order: idx + 1,
          })),
        },
      },
      create: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        moduleId: quiz.moduleId ?? null,
        levelId,
        passScore: quiz.passScore,
        timeLimitSec: quiz.timeLimitSec,
        maxAttempts: quiz.maxAttempts,
        isActive: true,
        questions: {
          create: quiz.questionIds.map((qid, idx) => ({
            questionId: qid,
            order: idx + 1,
          })),
        },
      },
    });
  }
  console.log(`  ✓ ${QUIZZES.length} quiz (5 module + 1 Boss Battle)`);

  // ---------- 7) Daily Missions ----------
  const missionsData = [
    {
      id: 'mission-daily-lesson',
      title: 'Hoàn thành 1 bài học',
      rewardExp: 10,
      rule: { type: 'COMPLETE_LESSON', count: 1 },
    },
    {
      id: 'mission-daily-quiz',
      title: 'Trả lời đúng 3 câu hỏi',
      rewardExp: 15,
      rule: { type: 'CORRECT_ANSWERS', count: 3 },
    },
    {
      id: 'mission-daily-video',
      title: 'Xem 1 video training',
      rewardExp: 5,
      rule: { type: 'WATCH_VIDEO', count: 1 },
    },
  ];
  for (const m of missionsData) {
    await prisma.mission.upsert({ where: { id: m.id }, update: {}, create: m });
  }
  console.log(`  ✓ ${missionsData.length} Daily Mission`);

  // ---------- 8) Badge ----------
  const badgesData = [
    {
      id: 'badge-first-lesson',
      name: 'Bước Chân Đầu Tiên',
      icon: '⭐',
      description: 'Hoàn thành bài học đầu tiên',
      rule: { type: 'COMPLETE_LESSON', count: 1 },
    },
    {
      id: 'badge-5-lessons',
      name: 'Học Sinh Cần Mẫn',
      icon: '📚',
      description: 'Hoàn thành 5 bài học',
      rule: { type: 'COMPLETE_LESSON', count: 5 },
    },
    {
      id: 'badge-quiz-perfect',
      name: 'Điểm Mười Tuyệt Đối',
      icon: '💯',
      description: 'Đạt điểm 100/100 trong một bài thi',
      rule: { type: 'QUIZ_PERFECT', count: 1 },
    },
    {
      id: 'badge-exp-300',
      name: 'Khởi Đầu Thuận Lợi',
      icon: '🚀',
      description: 'Tích lũy 300 EXP đầu tiên',
      rule: { type: 'EARN_EXP', amount: 300 },
    },
    {
      id: 'badge-reach-l2',
      name: 'Lên Thực Chiến',
      icon: '⚔️',
      description: 'Đạt Level 2 — Thực Chiến',
      rule: { type: 'REACH_LEVEL', order: 2 },
    },
    {
      id: 'badge-sales-closing',
      name: 'Sales Closing Master',
      icon: '🏆',
      description: 'Vượt Boss Battle Sales',
      rule: { type: 'COMPLETE_BOSS_BATTLE', scope: 'SALES' },
    },
    {
      id: 'badge-course-sales',
      name: 'Tốt Nghiệp Đào Tạo Sales',
      icon: '🎓',
      description: 'Hoàn thành 100% khóa Đào tạo Sales',
      rule: { type: 'COMPLETE_COURSE', courseId: 'course-sales-mvp' },
    },
    {
      id: 'badge-7-days',
      name: '7 Ngày Liên Tiếp',
      icon: '🔥',
      description: 'Duy trì streak học liên tục 7 ngày',
      rule: { type: 'STREAK_DAYS', days: 7 },
    },
    {
      id: 'badge-30-days',
      name: '30 Ngày Không Bỏ Cuộc',
      icon: '👑',
      description: 'Duy trì streak học liên tục 30 ngày',
      rule: { type: 'STREAK_DAYS', days: 30 },
    },
  ];
  for (const b of badgesData) {
    await prisma.badge.upsert({ where: { id: b.id }, update: {}, create: b });
  }
  console.log(`  ✓ ${badgesData.length} Badge`);

  // ---------- 9) Bảng quy đổi EXP (defaults) ----------
  // Lưu ý: ExpRulesService.onModuleInit cũng ensure defaults, nhưng để seed
  // chạy độc lập (không cần API server), ta tạo luôn ở đây.
  const expRuleDefaults: Array<{ action: string; amount: number; description: string }> = [
    { action: 'LESSON_COMPLETED', amount: 10, description: 'Hoàn thành 1 bài học' },
    { action: 'QUIZ_CORRECT_ANSWER', amount: 20, description: 'Trả lời đúng 1 câu trong bài thi' },
    { action: 'COURSE_COMPLETED', amount: 100, description: 'Hoàn thành 1 khóa học' },
    { action: 'DAILY_LOGIN_STREAK', amount: 5, description: 'Đăng nhập học liên tục mỗi ngày' },
    { action: 'TEAM_SUPPORT', amount: 15, description: 'Hỗ trợ đồng đội (xác nhận)' },
    { action: 'BOSS_BATTLE_PASSED', amount: 200, description: 'Vượt Boss Battle (bonus)' },
    { action: 'AI_COACH_SESSION', amount: 30, description: 'Tối đa khi luyện AI Coach' },
    { action: 'MISSION_COMPLETED', amount: 10, description: 'Hoàn thành nhiệm vụ ngày' },
    { action: 'ADMIN_ADJUSTMENT', amount: 0, description: 'Admin điều chỉnh thủ công' },
  ];
  for (const r of expRuleDefaults) {
    await prisma.expRule.upsert({
      where: { action: r.action as 'LESSON_COMPLETED' },
      update: {},
      create: {
        action: r.action as 'LESSON_COMPLETED',
        amount: r.amount,
        description: r.description,
        enabled: true,
      },
    });
  }
  console.log(`  ✓ ${expRuleDefaults.length} ExpRule (bảng quy đổi EXP)`);

  // ---------- 10) AI Coach Scenarios (default từ code) ----------
  const coachScenarios = [
    {
      id: 'price-objection',
      name: 'Khách chê giá cao',
      description: 'Khách so sánh giá đối thủ và phản đối thẳng — phải bảo vệ giá trị MKT.',
      icon: '💰',
      difficulty: 'EASY',
      systemPrompt: 'Vào vai khách hàng tiềm năng chê giá MKT đắt gấp đôi đối thủ. Liên tục so sánh giá, đòi giảm giá, hỏi ROI. Chỉ dịu giọng khi Sales nói rõ giá trị/ROI bằng con số. TIẾNG VIỆT có dấu, 1-3 câu/lượt.',
      initialMessage: 'Anh thấy báo giá MKT đắt gấp đôi bên đối thủ. Cùng tính năng đăng bài tự động mà, sao bên em đắt thế?',
      successCriteria: ['Tập trung làm rõ ROI thay vì giảm giá', 'Áp dụng LAARC khi gặp phản đối', 'Đưa được con số / case study cụ thể'],
      rewardExp: 30,
    },
    {
      id: 'competitor-comparison',
      name: 'Khách đang dùng đối thủ',
      description: 'Khách quen phần mềm khác 6 tháng — cần lý do đủ mạnh để chuyển.',
      icon: '⚔️',
      difficulty: 'MEDIUM',
      systemPrompt: 'Vào vai chị Mai dùng phần mềm đối thủ Postify 6 tháng, sợ rủi ro chuyển đổi. Chỉ đồng ý cân nhắc khi Sales chỉ ra 2-3 điểm khác biệt rõ ràng và cam kết hỗ trợ migration. TIẾNG VIỆT có dấu, 1-3 câu/lượt.',
      initialMessage: 'Tôi đang dùng Postify được 6 tháng rồi, team cũng quen. Anh em MKT có gì khiến tôi phải chuyển?',
      successCriteria: ['Chỉ ra 2-3 điểm khác biệt cụ thể', 'Đề cập hỗ trợ migration data', 'Khai thác pain point hiện tại của khách'],
      rewardExp: 40,
    },
    {
      id: 'hesitant-customer',
      name: 'Khách lưỡng lự',
      description: 'Khách thích sản phẩm nhưng "để suy nghĩ thêm" — cần đẩy quyết định.',
      icon: '🤔',
      difficulty: 'MEDIUM',
      systemPrompt: 'Vào vai anh Tuấn chủ chuỗi 3 cửa hàng, đã được demo MKT thấy hay nhưng hay trì hoãn. Chỉ quyết khi Sales hỏi cụ thể "suy nghĩ về điều gì?" và đưa deadline tự nhiên. TIẾNG VIỆT có dấu, 1-3 câu/lượt.',
      initialMessage: 'Anh thấy demo MKT hôm trước ổn đấy, nhưng để em suy nghĩ thêm vài hôm rồi liên lạc lại nhé.',
      successCriteria: ['Đào ra "suy nghĩ về điều gì cụ thể"', 'Đưa lý do cấp bách HỢP LÝ', 'Đề xuất Alternative Close (2 lựa chọn)'],
      rewardExp: 40,
    },
    {
      id: 'angry-customer',
      name: 'Khách đang giận',
      description: 'Khách đang chạy chiến dịch thì phần mềm lỗi — đang nóng giận và đòi đền bù.',
      icon: '🔥',
      difficulty: 'HARD',
      systemPrompt: 'Vào vai chị Linh — chiến dịch Black Friday lỗi mất 50tr doanh thu. Rất giận, đe doạ hủy hợp đồng và viết bài phốt. Chỉ hạ nhiệt khi Sales lắng nghe hết, xin lỗi thật lòng, cam kết hành động cụ thể. TIẾNG VIỆT có dấu, 1-3 câu/lượt.',
      initialMessage: 'Tôi đang chạy Black Friday thì hệ thống của bên em sập 2 TIẾNG! Mất ít nhất 50 triệu doanh thu. Bên em xử lý kiểu gì đây???',
      successCriteria: ['Lắng nghe hết & xin lỗi chân thành', 'KHÔNG đổ lỗi cho khách / bên thứ ba', 'Cam kết hành động cụ thể: compensation + escalate + follow-up'],
      rewardExp: 60,
    },
  ];
  for (const s of coachScenarios) {
    await prisma.coachScenario.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ ${coachScenarios.length} AI Coach Scenarios`);

  console.log('🎉 Seed hoàn tất!');
  console.log('\n   Tài khoản đăng nhập mẫu (mật khẩu chung: Mkt@12345):');
  console.log('   - admin@mkt.local         (ADMIN)');
  console.log('   - manager.sales@mkt.local (MANAGER)');
  console.log('   - learner.sales@mkt.local (LEARNER)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
