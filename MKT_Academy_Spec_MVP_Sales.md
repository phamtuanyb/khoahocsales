# MKT ACADEMY
## Nền tảng đào tạo nhân sự dạng game hóa — *Gamified Learning & HR Journey Platform*

### TÀI LIỆU ĐẶC TẢ KỸ THUẬT — Bàn giao đội ngũ phát triển
**Phiên bản MVP (Phòng Sales)**

| Thông tin | Chi tiết |
|---|---|
| Tên dự án | MKT Academy |
| Chủ đầu tư | Phạm Tuân — CEO (phanmemmkt.vn / mktsoftware.vn) |
| Loại tài liệu | Đặc tả sản phẩm + kỹ thuật (Product & Technical Spec) |
| Đối tượng đọc | Đội ngũ phát triển (Frontend / Backend / AI / QA) |
| Phạm vi bản này | MVP — Mô-đun đào tạo Phòng Sales |
| Phiên bản | v1.0 |
| Ngày phát hành | 22/05/2026 |

---

## Mục lục

1. Tổng quan dự án
2. Người dùng & phân quyền
3. Vòng lặp cốt lõi (Core Gameplay Loop)
4. Hành trình nhân sự (HR Journey)
5. Đặc tả tính năng theo màn hình
6. MVP — Nội dung chi tiết phòng Sales
7. Kiến trúc kỹ thuật
8. Thiết kế UI/UX (Design System)
9. Roadmap & phân kỳ triển khai
10. Tiêu chí nghiệm thu MVP
11. Rủi ro & khuyến nghị

---

## 1. Tổng quan dự án

### 1.1. Bài toán & mục tiêu

Nhân sự mới của MKT hiện được đào tạo theo cách thủ công, phân tán (tài liệu Word, video rời rạc, kèm cặp 1-1). Hệ quả: tốc độ onboarding chậm, chất lượng không đồng đều, khó đo lường ai đã thực sự nắm kiến thức, và không có cơ chế tạo động lực tự học.

**MKT Academy** giải quyết bằng cách biến toàn bộ hành trình đào tạo thành một **trò chơi nhập vai**: nhân sự là nhân vật, học để lên cấp, thi để mở khóa, cạnh tranh trên bảng xếp hạng, và nhận thưởng thật.

**Mục tiêu sản phẩm**

- Chuẩn hóa 100% quy trình đào tạo nhân sự mới trên một nền tảng duy nhất.
- Rút ngắn thời gian onboarding và tăng tỷ lệ nhân sự đạt chuẩn trước khi nhận khách thật.
- Đo lường được năng lực từng nhân sự theo thời gian thực (điểm thi, tiến độ, KPI học tập).
- Tạo động lực tự học bền vững thông qua cơ chế game (EXP, level, badge, leaderboard).

### 1.2. Chỉ số thành công của dự án (Project KPI)

| Chỉ số | Mục tiêu | Cách đo |
|---|---|---|
| Tỷ lệ hoàn thành Onboarding | ≥ 90% trong 7 ngày đầu | Hệ thống tự ghi nhận tiến độ Giai đoạn 1 |
| Tỷ lệ đỗ bài thi cuối Level | ≥ 80% đỗ ngay lần 1-2 | Kết quả Quiz / Boss Battle |
| Thời gian onboarding trung bình | Giảm ≥ 30% so với hiện tại | So sánh ngày bắt đầu → ngày đạt Level 2 |
| Tỷ lệ nhân sự học chủ động (DAU) | ≥ 70% đăng nhập học mỗi ngày làm việc | Log đăng nhập + Daily Mission |
| Mức độ hài lòng nhân sự mới | ≥ 4.2/5 | Khảo sát trong app sau Giai đoạn 1 |

### 1.3. Phạm vi tài liệu — MVP vs Bản đầy đủ

Tài liệu này mô tả **toàn bộ tầm nhìn hệ thống**, nhưng đánh dấu rõ phần thuộc **MVP** — phiên bản đầu tiên cần build và chạy thử với Phòng Sales.

| Hạng mục | MVP (build trước) | Bản đầy đủ (giai đoạn sau) |
|---|---|---|
| Phòng ban đào tạo | Chỉ Sales | Sales, CSKH, Marketing, Văn hóa |
| Dashboard cá nhân | Có (đầy đủ) | Có |
| Khu vực học kiến thức | Có (cây khóa học Sales) | Có (4 phòng ban) |
| Quiz: trắc nghiệm + tình huống | Có | Có |
| Quiz: mini game kéo-thả | Có (1 dạng cơ bản) | Có (đầy đủ dạng) |
| Boss Battle | Có (1 case Sales cuối Level) | Có (mỗi phòng ban) |
| EXP / Level / Badge / Leaderboard | Có | Có |
| Daily Mission | Có | Có |
| AI Coach (giả lập khách hàng) | Có (kịch bản Sales) | Có (đa phòng ban) |
| Cơ chế khóa/mở khóa Level | Có | Có |
| Admin dashboard | Có (quản trị + theo dõi cơ bản) | Có (phân tích nâng cao) |
| Social learning / hỏi đáp | Có (bản cơ bản) | Có (feed + kiểm duyệt đầy đủ) |
| Chứng chỉ hoàn thành | Có | Có |
| Mentor – Buddy | Chưa | Có |
| Lộ trình cá nhân hóa AI | Chưa | Có |
| Team Challenge | Chưa | Có |
| Thưởng thật / tích hợp HRM | Ghi nhận thủ công | Tích hợp tự động |

---

## 2. Người dùng & phân quyền

### 2.1. Các vai trò

| Vai trò | Mô tả | Quyền chính |
|---|---|---|
| Nhân sự (Learner) | Nhân viên mới hoặc đang đào tạo | Học, thi, xem dashboard cá nhân, leaderboard, AI Coach |
| Trưởng phòng (Manager) | Quản lý phòng ban (MVP: Trưởng phòng Sales) | Theo dõi tiến độ team, duyệt mở khóa đặc cách, xem báo cáo phòng |
| Admin / Đào tạo (Super Admin) | Bộ phận L&D / vận hành hệ thống | **Toàn quyền quản trị toàn bộ dự án**: tự nhập & setup mọi nội dung (khóa học, bài học, ngân hàng câu hỏi, bài thi), cấu hình toàn bộ hệ thống (level, EXP, badge, mission, leaderboard, phân quyền), quản lý nhân sự và xem mọi báo cáo |

### 2.2. Ma trận phân quyền

| Chức năng | Learner | Manager | Admin |
|---|---|---|---|
| Học bài / làm quiz / AI Coach | ✔ | ✔ | ✔ |
| Xem dashboard cá nhân | ✔ (của mình) | ✔ | ✔ |
| Xem leaderboard | ✔ | ✔ | ✔ |
| Theo dõi tiến độ team | ✗ | ✔ (phòng mình) | ✔ (toàn bộ) |
| Tạo/sửa khóa học, câu hỏi | ✗ | ✗ | ✔ |
| Cấu hình EXP, Level, Badge | ✗ | ✗ | ✔ |
| Mở khóa đặc cách cho nhân sự | ✗ | ✔ (đề xuất) | ✔ (quyết định) |
| Quản lý tài khoản người dùng | ✗ | ✗ | ✔ |

---

## 3. Vòng lặp cốt lõi (Core Gameplay Loop)

Đây là trái tim của sản phẩm. Mọi tính năng đều phải phục vụ việc giữ vòng lặp này **cuốn và không đứt**:

> **Học bài → Làm Quiz → Nhận EXP → Lên Level → Nhận Reward → Lên Leaderboard → Mở khóa nội dung mới → Học tiếp**

| Bước | Hành động hệ thống | Phản hồi tới người dùng |
|---|---|---|
| 1. Học | Ghi nhận lượt xem bài / video, cập nhật tiến độ | +EXP, thanh tiến độ chạy, hiệu ứng hoàn thành |
| 2. Quiz | Chấm điểm tự động hoặc AI chấm | Điểm số, đáp án đúng/sai, gợi ý ôn lại |
| 3. EXP | Cộng EXP theo bảng quy đổi (mục 5.5) | Animation EXP bay vào thanh, âm thanh |
| 4. Level Up | Khi đủ EXP ngưỡng → tăng level, đổi rank | Màn hình Level Up toàn màn, đổi avatar frame |
| 5. Reward | Mở badge / quyền lợi / quà tương ứng | Popup huy hiệu phát sáng, thông báo phần thưởng |
| 6. Leaderboard | Cập nhật thứ hạng realtime | Vị trí mới trên bảng xếp hạng, đẩy notification |
| 7. Unlock | Kích hoạt khóa học / level kế tiếp | Nội dung mới sáng lên, mời gọi học tiếp |

**Nguyên tắc thiết kế:** mỗi hành động phải có phản hồi tức thì (dưới 300ms) bằng hình ảnh + âm thanh + chuyển động. Vòng lặp đứt = nhân sự bỏ học.

---

## 4. Hành trình nhân sự (HR Journey)

### 4.1. Hệ thống 5 Level

| Level | Danh hiệu | Mục tiêu năng lực | Điều kiện đạt |
|---|---|---|---|
| Level 1 | Tân Binh | Hiểu văn hóa công ty + sản phẩm | Hoàn thành Giai đoạn Onboarding + đỗ thi Level 1 |
| Level 2 | Thực Chiến | Biết tư vấn, demo sản phẩm cơ bản | Đỗ thi tư vấn + đủ EXP ngưỡng |
| Level 3 | Chiến Binh Sales | Chốt được đơn thực tế | Đạt KPI chốt đơn + đỗ Boss Battle |
| Level 4 | Elite | Đào tạo, kèm cặp người mới | Đạt KPI ổn định + hoàn thành khóa kỹ năng đào tạo |
| Level 5 | Leader | Quản trị & xây quy trình cho team | Được đề bạt + hoàn thành khóa quản trị |

### 4.2. 4 Giai đoạn của hành trình

| Giai đoạn | Thời lượng | Nội dung trọng tâm | Tương ứng Level |
|---|---|---|---|
| GĐ1 — Onboarding | 7 ngày đầu | Văn hóa, 7 giá trị cốt lõi, kiến thức sản phẩm, SOP cơ bản | Level 1 |
| GĐ2 — Thực chiến | Tuần 2-6 | Demo sản phẩm, chat/tư vấn khách, sale thật có giám sát | Level 2-3 |
| GĐ3 — Tăng trưởng | Tháng 2-3 | Hoàn thành KPI, quản lý tệp khách, teamwork | Level 3-4 |
| GĐ4 — Leader | Sau tháng 3 | Đào tạo người khác, quản trị team, xây quy trình | Level 4-5 |

**Lưu ý kỹ thuật:** Level và Giai đoạn là hai trục độc lập nhưng liên kết. Level phản ánh EXP/năng lực; Giai đoạn phản ánh lộ trình thời gian. Hệ thống lưu cả hai trong hồ sơ nhân sự.

---

## 5. Đặc tả tính năng theo màn hình

Mỗi màn hình mô tả: mục đích, thành phần hiển thị, hành vi, và quy tắc nghiệp vụ. Màn hình thuộc MVP được đánh dấu **[MVP]**.

### 5.1. Đăng nhập & khởi tạo nhân vật **[MVP]**

- Đăng nhập bằng email công ty (SSO nếu có) hoặc tài khoản do Admin cấp.
- Lần đầu: nhân sự chọn avatar, nhập tên hiển thị, được gán Phòng ban (MVP: Sales) và bắt đầu ở Level 1 — Tân Binh.
- Hiển thị màn hình chào mừng giới thiệu nhanh vòng lặp game và Giai đoạn Onboarding 7 ngày.

### 5.2. Dashboard cá nhân **[MVP]**

Trang chủ của mỗi nhân sự — hồ sơ dạng game. Các thành phần bắt buộc:

| Thành phần | Mô tả hiển thị |
|---|---|
| Avatar + Frame | Ảnh đại diện, khung viền thay đổi theo Level/Rank |
| Level & Danh hiệu | Level hiện tại + tên danh hiệu (VD: Level 2 — Thực Chiến) |
| Thanh EXP | EXP hiện tại / EXP cần để lên level kế tiếp, có animation |
| Rank | Thứ hạng hiện tại trên leaderboard tổng |
| Huy hiệu (Badges) | Lưới badge đã đạt, badge chưa đạt hiển thị mờ |
| Chuỗi học liên tục (Streak) | Số ngày học liên tiếp, biểu tượng ngọn lửa |
| KPI cá nhân | Tỷ lệ đỗ bài test, số khóa hoàn thành, EXP tuần |
| Thành tích nổi bật | 3-5 cột mốc gần nhất (lên level, badge mới, top tuần) |
| Khóa học đã/đang học | Danh sách kèm % tiến độ |
| Daily Mission | Widget nhiệm vụ ngày, trạng thái hoàn thành |

### 5.3. Khu vực học kiến thức **[MVP — cây khóa học Sales]**

Cấu trúc nội dung phân cấp 4 tầng:

> **Phòng ban → Khóa học (Course) → Mô-đun (Module) → Bài học (Lesson)**

- Mỗi Bài học gồm: nội dung (text/hình), video training, tài liệu đính kèm, và 1 quiz cuối bài.
- Bài học có trạng thái: Khóa / Mở / Đang học / Hoàn thành.
- Hoàn thành 100% bài học trong Mô-đun mới mở Mô-đun kế tiếp.

Cây nội dung cho 4 phòng ban (MVP chỉ build nhánh Sales — các nhánh còn lại để giai đoạn sau):

| Phòng ban | Các mô-đun |
|---|---|
| **Sales [MVP]** | Quy trình Sales · Script gọi điện · Kỹ năng chốt sale · Xử lý từ chối · Demo sản phẩm |
| CSKH | Quy trình support · Xử lý khiếu nại · SOP bàn giao · Văn hóa phản hồi |
| Marketing | Content · Video · SEO · Ứng dụng AI · Facebook · TikTok |
| Văn hóa công ty | 7 giá trị cốt lõi · Quy tắc làm việc · Tốc độ quyết liệt · Đổi mới sáng tạo |

### 5.4. Hệ thống Quiz / Thi **[MVP]**

Phần quan trọng nhất của hệ thống. Hỗ trợ 4 dạng câu hỏi:

| Dạng | Mô tả | Cách chấm | MVP? |
|---|---|---|---|
| Trắc nghiệm | Chọn 1 hoặc nhiều đáp án đúng | Tự động (so khớp đáp án) | Có |
| Tình huống thực tế | Câu hỏi mô phỏng case, trả lời tự luận ngắn | AI chấm theo 3 tiêu chí (xem 6.3) | Có |
| Mini game | Kéo-thả quy trình đúng, nối tính năng, chọn nhanh có đếm giờ | Tự động (đúng thứ tự / đúng cặp) | Có (kéo-thả) |
| Boss Battle | Bài thi cuối Level: 1 case khó hoặc demo sản phẩm giả lập | AI chấm + (tùy chọn) Manager duyệt | Có (1 case Sales) |

**Quy tắc nghiệp vụ bài thi**

- **Toàn bộ nội dung bài thi do Admin tự nhập và quản lý.** Admin tạo câu hỏi (mọi dạng), nhập đáp án, đặt độ khó, gán vào Mô-đun/Level, và cấu hình đề thi — không phụ thuộc dev, không cần sửa code.
- Mỗi bài thi có: số câu, thời gian giới hạn, điểm đạt (pass score), số lần làm lại tối đa — tất cả do Admin thiết lập.
- Trượt → cho ôn lại bài liên quan, sau đó mở lượt làm lại (có thể đặt thời gian chờ).
- Đỗ bài thi cuối Level là điều kiện bắt buộc để mở Level kế tiếp (xem mục 5.10).
- Ngân hàng câu hỏi: Admin tạo, gán độ khó, gán vào Mô-đun/Level. Đề thi rút ngẫu nhiên từ ngân hàng theo cấu hình.
- Admin sửa/ẩn/xóa câu hỏi bất kỳ lúc nào; thay đổi áp dụng cho các lượt thi sau, không ảnh hưởng kết quả đã ghi nhận.

### 5.5. EXP & Level **[MVP]**

Bảng quy đổi EXP — Admin cấu hình được, giá trị khởi tạo gợi ý:

| Hành động | EXP | Ghi chú |
|---|---|---|
| Hoàn thành 1 bài học | +10 | Tính 1 lần / bài |
| Trả lời đúng 1 câu quiz | +20 | Theo từng câu đúng |
| Hoàn thành 1 khóa học | +100 | Thưởng cột mốc |
| Đăng nhập học liên tục (mỗi ngày) | +5 | Cộng dồn theo streak |
| Hỗ trợ đồng đội (được ghi nhận) | +15 | Manager/Admin xác nhận |
| Vượt Boss Battle | +200 | Thưởng lớn cuối Level |

**Ngưỡng Level:** mỗi Level có ngưỡng EXP riêng, tăng dần (VD gợi ý: L1→L2: 300, L2→L3: 700, L3→L4: 1300, L4→L5: 2000). Toàn bộ ngưỡng cấu hình được trong Admin.

### 5.6. Leaderboard **[MVP]**

Bảng xếp hạng để kích thích cạnh tranh. Hỗ trợ nhiều loại bảng, lọc theo tuần/tháng/tất cả:

- **Top Học Tập** — theo EXP học.
- **Top Sales** — theo KPI chốt đơn (giai đoạn thực chiến).
- **Top Chăm Chỉ** — theo streak & số bài hoàn thành.
- **Top Support** — theo điểm CSKH (giai đoạn sau).
- **Chiến Binh Tuần** — tổng hợp xuất sắc nhất trong tuần.

Mỗi dòng hiển thị: avatar, tên, rank, EXP/điểm, thành tích nổi bật. Cập nhật realtime, có hiệu ứng khi thay đổi thứ hạng.

### 5.7. Achievement / Badge **[MVP]**

Huy hiệu ghi nhận cột mốc, có animation phát sáng kiểu game. Ví dụ bộ badge khởi tạo:

| Huy hiệu | Điều kiện đạt |
|---|---|
| 🏆 Chuyên Gia CSKH | Hoàn thành toàn bộ khóa CSKH với điểm ≥ 90% |
| 🏆 Sales Closing Master | Vượt Boss Battle Sales + đạt KPI chốt đơn |
| 🏆 AI Content Warrior | Hoàn thành khóa Marketing AI/Content |
| 🏆 Support 5 Sao | Đạt điểm hài lòng khách ≥ 4.8 trong giai đoạn thực chiến |
| 🏆 30 Ngày Không Bỏ Cuộc | Duy trì streak học liên tục 30 ngày |

**Kỹ thuật:** badge gồm icon, tên, mô tả, điều kiện (rule có thể cấu hình), trạng thái đạt/chưa đạt. Hệ thống kiểm tra điều kiện sau mỗi sự kiện EXP.

### 5.8. Daily Mission **[MVP]**

Nhiệm vụ ngày làm mới mỗi 00:00, tạo lý do để nhân sự quay lại mỗi ngày. Ví dụ:

- Hoàn thành 1 bài học.
- Trả lời đúng 3 câu hỏi.
- Xem 1 video training.
- Chia sẻ 1 kiến thức / bình luận trong cộng đồng học.

Hoàn thành nhiệm vụ → thưởng EXP nhỏ + giữ streak. Bộ nhiệm vụ cấu hình được trong Admin.

### 5.9. AI Coach **[MVP]**

Tính năng tạo khác biệt lớn nhất. Một trợ lý AI hội thoại, làm 2 vai:

1. **Tư vấn** — trả lời câu hỏi về SOP, sản phẩm, quy trình (dựa trên kho tài liệu nội bộ — kỹ thuật RAG).
2. **Giả lập khách hàng** — đóng vai khách để nhân sự luyện sale, luyện xử lý từ chối, luyện demo.

*Ví dụ kịch bản MVP:* "Giả lập khách hàng đang chê giá cao" → AI đóng vai khách khó tính, nhân sự phải xử lý → AI phản hồi và cuối phiên cho điểm + nhận xét.

- MVP: tập trung các kịch bản Sales (chê giá, so sánh đối thủ, khách lưỡng lự, khách đã dùng phần mềm khác).
- Mỗi phiên luyện tập được lưu lại, AI tổng kết điểm mạnh/yếu, gợi ý bài học cần ôn.
- Kết quả phiên AI Coach có thể quy đổi EXP và đóng góp vào điều kiện badge.

### 5.10. Cơ chế khóa & mở khóa **[MVP]**

Cơ chế "ép học thật" — đảm bảo nhân sự không nhảy cóc:

| Điều kiện | Hệ quả |
|---|---|
| Chưa đỗ thi Level 1 | Không mở được nội dung Level 2 |
| Chưa thi đỗ phần tư vấn | Chưa được hệ thống đánh dấu "đủ điều kiện nhận khách" |
| Chưa đủ EXP ngưỡng | Chưa unlock khóa học nâng cao |
| Chưa hoàn thành Mô-đun trước | Mô-đun kế tiếp ở trạng thái Khóa |

**Ngoại lệ:** Manager/Admin có quyền mở khóa đặc cách cho trường hợp đặc biệt, có ghi log lý do.

### 5.11. Admin Dashboard **[MVP]**

Admin Dashboard là **trung tâm điều hành toàn bộ dự án**. Admin có toàn quyền tự setup mọi thứ qua giao diện — mọi nội dung, quy tắc và cấu hình đều nhập trực tiếp, không cần can thiệp code. Dev chỉ xây công cụ; Admin là người vận hành và làm chủ nội dung.

**Nhóm Soạn nội dung (Admin tự nhập)**

- Tạo & quản lý khóa học, mô-đun, bài học; tải lên video, hình ảnh, tài liệu.
- Tạo & quản lý ngân hàng câu hỏi cho cả 4 dạng (trắc nghiệm, tình huống, mini game, Boss Battle): nhập câu hỏi, đáp án, độ khó.
- Soạn & cấu hình bài thi: số câu, thời gian, điểm đạt, số lần làm lại, quy tắc rút đề.
- Thiết lập kịch bản AI Coach và tiêu chí AI chấm điểm (trọng số 3 tiêu chí).

**Nhóm Cấu hình hệ thống (Admin tự setup)**

- Cấu hình Level: số level, danh hiệu, ngưỡng EXP.
- Cấu hình bảng quy đổi EXP cho từng hành động.
- Tạo & cấu hình badge (icon, điều kiện đạt), Daily Mission (nhiệm vụ, phần thưởng).
- Cấu hình leaderboard (loại bảng, chu kỳ tuần/tháng).
- Cấu hình quy tắc khóa/mở khóa (unlock_rule) cho khóa học, mô-đun, level.

**Nhóm Quản trị (Admin toàn quyền)**

- Quản lý tài khoản nhân sự, phòng ban, vai trò và phân quyền.
- Mở khóa đặc cách, điều chỉnh EXP/level thủ công khi cần (có ghi log).
- Bật/tắt, ẩn/hiện bất kỳ khóa học, bài thi, tính năng nào.

**Nhóm Theo dõi (phân tích)**

- Ai học chậm / ai bỏ bài (cảnh báo nhân sự không hoạt động).
- Tỷ lệ hoàn thành theo khóa/mô-đun, tỷ lệ đỗ bài thi.
- Top performer, phân bố Level toàn công ty / theo phòng.
- Báo cáo tiến độ theo phòng ban, xuất file Excel.

### 5.12. Social Learning & Hỏi đáp cộng đồng **[MVP — bản cơ bản]**

Biến việc học từ "một mình" thành "cùng nhau" — tăng tương tác và giữ chân người học.

- Mỗi bài học có khu bình luận: nhân sự đặt câu hỏi, chia sẻ ghi chú, thảo luận.
- Đồng đội, Mentor hoặc Admin có thể trả lời; câu trả lời hay được "ghim" và cộng EXP cho người trả lời.
- Bảng tin học tập (feed) chung: hiển thị thành tích nổi bật, câu hỏi mới, mẹo hay.
- Liên kết với Daily Mission "chia sẻ kiến thức" và điều kiện một số badge.
- **Quy tắc:** Admin kiểm duyệt, có quyền ẩn/xóa bình luận; mọi nội dung phải đúng văn hóa công ty.

| Thành phần dữ liệu | Trường chính |
|---|---|
| comments | id, lesson_id, user_id, content, parent_id, is_pinned, created_at |
| comment_reactions | comment_id, user_id, type |

### 5.13. Chứng chỉ hoàn thành (Certificate) **[MVP]**

- Hoàn thành mỗi Level hoặc mỗi khóa học → hệ thống cấp một chứng chỉ điện tử (tên nhân sự, danh hiệu Level, ngày đạt, mã xác thực).
- Chứng chỉ tải về dạng ảnh/PDF, chia sẻ được lên mạng xã hội — tạo niềm tự hào và lan tỏa thương hiệu MKT.
- Mẫu chứng chỉ theo brand MKT (nền gradient xanh dương, điểm nhấn cam/vàng — xem mục 8), Admin cấu hình được tiêu đề và logo.
- Bảng dữ liệu: `certificates` — id, user_id, type (level/course), ref_id, code, issued_at.

### 5.14. Mentor – Buddy (kèm cặp 1-1) **[Giai đoạn sau]**

- Hệ thống ghép mỗi nhân sự mới với một Mentor (nhân sự Level 4-5) trong Giai đoạn Onboarding.
- Mentor xem được tiến độ học của người mình kèm, gửi lời nhắc, ghi nhận hỗ trợ (cộng EXP cho cả hai).
- Trang "Cặp đôi của tôi" hiển thị tiến độ song song; Manager theo dõi hiệu quả từng cặp.
- Bảng dữ liệu: `mentorships` — mentor_id, mentee_id, started_at, status.

### 5.15. Lộ trình cá nhân hóa bằng AI (Adaptive Learning) **[Giai đoạn sau]**

- Sau mỗi bài thi, AI phân tích các câu sai và điểm yếu theo chủ đề.
- AI tự đề xuất "lộ trình ôn tập" riêng: bài học cần xem lại, dạng câu hỏi cần luyện thêm, kịch bản AI Coach phù hợp.
- Dashboard hiển thị khối "AI gợi ý cho bạn hôm nay".
- Tận dụng dữ liệu `quiz_attempts` + `lesson_progress`; không cần bảng mới, bổ sung service phân tích.

### 5.16. Team Challenge (thi đấu theo nhóm) **[Giai đoạn sau]**

- Bên cạnh leaderboard cá nhân, có bảng xếp hạng theo nhóm/phòng ban.
- Admin tạo các "thử thách đội" theo tuần/tháng (VD: tổng EXP cả phòng, tỷ lệ hoàn thành khóa).
- Đội thắng nhận badge tập thể và phần thưởng — kích thích tinh thần đồng đội, giảm cảm giác "học một mình".
- Bảng dữ liệu: `team_challenges` — id, title, metric, period, reward; `team_challenge_results` — challenge_id, team_id, score, rank.

---

## 6. MVP — Nội dung chi tiết phòng Sales

Phần này là phạm vi cần build và đưa vào chạy thử đầu tiên. Đội ngũ phối hợp với bộ phận đào tạo Sales để hoàn thiện nội dung.

### 6.1. Cây khóa học Sales

| Mô-đun | Bài học gợi ý | Bài thi |
|---|---|---|
| M1 — Quy trình Sales | Tổng quan phễu sale; Các bước trong quy trình; Vai trò Sales tại MKT | Trắc nghiệm 10 câu |
| M2 — Script gọi điện | Cấu trúc cuộc gọi; Mở đầu tạo thiện cảm; Khai thác nhu cầu | Trắc nghiệm + tình huống |
| M3 — Kỹ năng chốt sale | Tín hiệu mua hàng; Các kỹ thuật chốt; Tạo cảm giác cấp bách | Tình huống thực tế |
| M4 — Xử lý từ chối | Phân loại lời từ chối; Công thức xử lý phản đối; Luyện với AI Coach | Tình huống + AI Coach |
| M5 — Demo sản phẩm | Demo phần mềm MKT; Trình bày theo nhu cầu khách; Kết nối tính năng - lợi ích | Mini game nối tính năng |

**Boss Battle Level Sales:** nhân sự xử lý một case khó tổng hợp — khách đã dùng phần mềm đối thủ, chê giá, và yêu cầu demo nhanh. AI chấm điểm, Manager duyệt cuối.

### 6.2. Câu hỏi mẫu (để team dựng cấu trúc dữ liệu)

**Dạng trắc nghiệm**

Câu hỏi: *"Khách báo lỗi đăng nhập Facebook trên phần mềm — bước xử lý đầu tiên đúng nhất là gì?"*

- A. Yêu cầu khách đổi mật khẩu Facebook ngay.
- B. Trấn an khách, xác nhận lại hiện tượng lỗi và môi trường sử dụng. *(đáp án đúng)*
- C. Báo khách chờ bản cập nhật.
- D. Chuyển ngay sang bộ phận kỹ thuật.

**Dạng tình huống thực tế**

Câu hỏi: *"Khách đang nóng giận vì phần mềm lỗi giữa lúc chạy chiến dịch. Bạn phản hồi như thế nào?"* — nhân sự trả lời tự luận ngắn, AI chấm.

**Dạng mini game**

- Kéo-thả: sắp xếp đúng thứ tự 5 bước quy trình sale.
- Nối cặp: nối tính năng phần mềm MKT với lợi ích tương ứng cho khách.
- Chọn nhanh: trả lời câu hỏi đúng/sai có đồng hồ đếm ngược.

### 6.3. Tiêu chí AI chấm điểm (tình huống & Boss Battle)

| Tiêu chí | AI đánh giá điều gì | Trọng số gợi ý |
|---|---|---|
| Thái độ | Sự bình tĩnh, đồng cảm, chuyên nghiệp, tôn trọng khách | 30% |
| Logic xử lý | Trình tự hợp lý, giải quyết đúng vấn đề cốt lõi | 35% |
| Đúng SOP | Tuân thủ quy trình & chuẩn nội bộ của MKT | 35% |

**Đầu ra của AI:** điểm tổng (0-100), điểm từng tiêu chí, nhận xét ngắn về điểm mạnh/điểm cần cải thiện, và gợi ý bài học nên ôn lại. Trọng số cấu hình được trong Admin.

---

## 7. Kiến trúc kỹ thuật

### 7.1. Tech stack đề xuất

| Tầng | Công nghệ | Vai trò |
|---|---|---|
| Frontend | React / Next.js, TailwindCSS, Framer Motion | Giao diện, animation game, SSR cho tốc độ |
| Backend | Node.js + NestJS | API, nghiệp vụ EXP/Level/Quiz, phân quyền |
| Database | PostgreSQL | Dữ liệu người dùng, khóa học, kết quả thi |
| AI | OpenAI / Gemini API | AI Coach, chấm điểm tình huống, RAG tài liệu |
| Realtime | Socket.io | Leaderboard realtime, thông báo, hiệu ứng đồng bộ |
| Lưu trữ media | Object storage (S3 hoặc tương đương) | Video training, hình ảnh, tài liệu |

### 7.2. Sơ đồ kiến trúc tổng thể

```
Client (Next.js)  ⇄  API Gateway (NestJS)  ⇄  PostgreSQL
                          ⇄  AI Service (OpenAI/Gemini + RAG kho tài liệu nội bộ)
                          ⇄  Socket.io  ⇄  Client (leaderboard & notification realtime)
                          ⇄  Object Storage (media training)
```

Khuyến nghị tách AI Service thành module riêng để dễ thay đổi nhà cung cấp mô hình và kiểm soát chi phí token.

### 7.3. Mô hình dữ liệu (các bảng chính)

| Bảng | Trường chính | Ghi chú |
|---|---|---|
| users | id, email, name, role, department_id, status | Tài khoản & phân quyền |
| profiles | user_id, avatar, level, exp, rank, streak_count, stage | Hồ sơ game của nhân sự |
| departments | id, name | Sales, CSKH, Marketing, Văn hóa |
| courses | id, department_id, title, order, unlock_rule | Khóa học |
| modules | id, course_id, title, order, unlock_rule | Mô-đun trong khóa |
| lessons | id, module_id, title, content, video_url, order | Bài học |
| lesson_progress | user_id, lesson_id, status, completed_at | Tiến độ học từng bài |
| questions | id, type, content, options, answer, difficulty, module_id | Ngân hàng câu hỏi |
| quizzes | id, module_id, level_id, pass_score, time_limit, max_attempts | Cấu hình bài thi |
| quiz_attempts | id, user_id, quiz_id, score, ai_feedback, passed, created_at | Lượt làm bài & kết quả |
| levels | id, order, name, exp_threshold | Cấu hình 5 Level |
| exp_transactions | id, user_id, action, amount, created_at | Lịch sử cộng EXP |
| badges | id, name, icon, description, rule | Định nghĩa huy hiệu |
| user_badges | user_id, badge_id, earned_at | Huy hiệu đã đạt |
| missions | id, title, reward_exp, rule | Daily Mission |
| mission_progress | user_id, mission_id, date, completed | Trạng thái nhiệm vụ ngày |
| leaderboard_entries | user_id, board_type, period, score, rank | Dữ liệu xếp hạng |
| ai_coach_sessions | id, user_id, scenario, transcript, score, feedback | Phiên luyện AI Coach |

**Lưu ý:** trường `unlock_rule` lưu điều kiện mở khóa dạng cấu hình (JSON), để Admin thay đổi mà không cần sửa code.

### 7.4. Nhóm API chính

| Nhóm | Endpoint tiêu biểu | Chức năng |
|---|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` | Đăng nhập, lấy thông tin phiên |
| Profile | `GET /profile`, `GET /profile/dashboard` | Dữ liệu dashboard cá nhân |
| Learning | `GET /courses`, `GET /lessons/:id`, `POST /lessons/:id/complete` | Lấy nội dung, ghi nhận hoàn thành |
| Quiz | `GET /quizzes/:id`, `POST /quizzes/:id/submit` | Lấy đề, nộp bài, nhận kết quả |
| Gamification | `GET /leaderboard`, `GET /badges`, `GET /missions` | Xếp hạng, huy hiệu, nhiệm vụ |
| AI Coach | `POST /ai-coach/session`, `POST /ai-coach/session/:id/message` | Tạo & hội thoại phiên luyện |
| Admin | CRUD `/admin/courses`, `/admin/questions`, `/admin/users`... | Quản trị toàn bộ cấu hình |

### 7.5. Tích hợp AI — lưu ý triển khai

- AI Coach và chấm điểm dùng prompt có cấu trúc, đính kèm SOP/tiêu chí chấm để đảm bảo nhất quán.
- Tư vấn SOP/sản phẩm dùng RAG: index kho tài liệu nội bộ, truy hồi đoạn liên quan trước khi sinh câu trả lời — tránh AI bịa.
- Giám sát chi phí token: cache câu trả lời lặp lại, đặt giới hạn lượt/người/ngày, log usage.
- Có cơ chế dự phòng khi AI API lỗi (hiển thị thông báo, cho làm lại sau).

### 7.6. Realtime

- Socket.io đẩy: cập nhật thứ hạng leaderboard, thông báo lên level / nhận badge, nhắc Daily Mission.
- Phòng (room) theo phòng ban để giới hạn phạm vi cập nhật, giảm tải.

---

## 8. Thiết kế UI/UX (Design System)

Toàn bộ giao diện MKT Academy **bám sát hệ nhận diện thương hiệu Phần mềm MKT** (phanmemmkt.vn) — phong cách marketing công nghệ Việt: **năng lượng cao, nền gradient xanh dương, điểm nhấn cam/vàng, hiệu ứng nổi khối 3D**. Đây không phải dark mode chung chung — mà là "MKT brand" đặc trưng.

### 8.1. Nguyên tắc thương hiệu

- Nền **luôn là gradient xanh dương** (navy → sky), góc 135°. **Tuyệt đối không dùng nền trắng** cho khu vực chính.
- Năng lượng HIGH — cảm giác như banner marketing của MKT, không phẳng lặng.
- Typography đậm, in hoa, chiếm ưu thế thị giác; điểm nhấn bằng cam/vàng.
- Mọi khối (card, badge, icon) đều có chiều sâu: đổ bóng nhẹ + glow xanh ở viền.
- Toàn bộ chữ hiển thị bằng **tiếng Việt có dấu đầy đủ**.

### 8.2. Bảng màu chuẩn (Color Tokens)

| Vai trò | Tên màu | Hex |
|---|---|---|
| Nền chính | Deep Navy Blue | `#1565C0` |
| Nền phụ | Electric Blue | `#1E88E5` |
| Nền nhạt | Sky Blue | `#64B5F6` |
| Nền rất nhạt / surface sáng | Ice Blue | `#B3E5FC` |
| Navy đậm nhất (đầu gradient, khối 3D) | Dark Navy | `#0D47A1` |
| Text / Headline | Trắng | `#FFFFFF` |
| Accent nhấn mạnh (CTA, EXP, cảnh báo) | Orange | `#FF8C00` |
| Accent số liệu (điểm, KPI, badge) | Gold | `#FFD700` |
| Accent phụ (nổi bật, streak/lửa) | Hot Pink | `#FF4081` |
| Glow viền khối | Sky Blue 50% | `#64B5F6` (opacity 50%) |

### 8.3. Gradient & lớp nền

- **Gradient nền chuẩn:** `linear-gradient(135deg, #0D47A1 0%, #1565C0 40%, #1E88E5 80%, #64B5F6 100%)`
- Phủ thêm các lớp tạo chiều sâu (giống banner MKT):
  - Tech grid mờ — opacity 10–15%.
  - Silhouette thành phố/warehouse phía xa — opacity 20–30%.
  - Particle / bokeh nhỏ trôi nhẹ — opacity 15–25%.
  - Luồng sáng (beam) tỏa từ trung tâm — opacity ~20%.

### 8.4. Typography

| Cấp | Size | Weight | Màu | Ghi chú |
|---|---|---|---|---|
| H1 — Headline màn hình | 48–72px | ExtraBold/Black (900) | Trắng hoặc Cam `#FF8C00` | IN HOA, có thể 2 màu trong 1 dòng |
| H2 — Tiêu đề khối | 28–36px | Bold (700) | Trắng | Đặt trong pill xanh đậm `#1565C0` |
| Body / nội dung bài học | 16–20px | Regular/Medium | Trắng / Ice Blue | Nền tối, đảm bảo tương phản |
| Bullet / feature | 16–18px | Medium/Bold | Trắng | Pill bán trong suốt, icon ✔ đầu dòng |
| Badge / số liệu (EXP, điểm, KPI) | 22–32px | Bold | Trắng/Navy | Pill cam `#FF8C00` hoặc vàng `#FFD700` |

### 8.5. Thành phần giao diện (Components)

| Thành phần | Quy chuẩn |
|---|---|
| Card | Kính mờ (glassmorphism) trên nền xanh, viền glow `#64B5F6` 50%, bo góc 16–20px, đổ bóng nhẹ |
| Nút chính (CTA) | Pill cam `#FF8C00`, chữ trắng bold IN HOA, glow + hiệu ứng hover/nhấn |
| Nút phụ | Viền xanh sky, nền trong suốt, hover sáng lên |
| Pill / Tag | Bo tròn hoàn toàn; subheading dùng pill navy, số liệu dùng pill cam/vàng |
| Thanh EXP / tiến độ | Nền navy, phần đầy gradient cam→vàng, có ánh sáng chạy khi tăng |
| Badge / huy hiệu | Khối tròn nổi 3D, viền vàng `#FFD700`, phát sáng khi đạt được |
| Avatar frame | Khung viền đổi theo Level/Rank (đồng → bạc → vàng → kim cương) |
| Icon | Phong cách sticker phẳng, viền trắng 2px, đổ bóng nhẹ |

### 8.6. Visual elements đặc trưng (game + brand)

- **Khối 3D isometric** cho mô-đun/khóa học: hình hộp phần mềm nghiêng 25–35°, gradient `#0D47A1 → #1565C0`, logo MKT trên mặt, đổ bóng dưới đáy.
- **Nhân vật / mascot** mặc áo polo xanh MKT — dùng trong màn chào mừng, Level Up, AI Coach.
- **Floating stickers:** icon nền tảng (FB, Zalo, TikTok, IG, YT) dạng bubble 3D; tia chớp, ngôi sao, mảnh confetti màu cam/vàng — dùng tiết chế trong khoảnh khắc thưởng.
- **Hiệu ứng game:** màn Level Up toàn màn (nhân vật + tia sáng + số level lớn); badge phát sáng khi mở; EXP bay theo quỹ đạo vào thanh.

### 8.7. Chuyển động & phản hồi

- Animation mượt, nhẹ (Framer Motion) — nhấn nhá ở khoảnh khắc thưởng, không gây rối mắt.
- **Mỗi hành động phải có phản hồi tức thì dưới 300ms** bằng hình ảnh + âm thanh + chuyển động (xem mục 3).
- Cường độ phản hồi tỷ lệ với phần thưởng: hoàn thành bài học = hiệu ứng nhỏ; Level Up / vượt Boss Battle = hiệu ứng toàn màn.

### 8.8. Responsive & nhất quán

- Ưu tiên desktop (giao diện "control center"); hỗ trợ tốt mobile cho phần học bài & làm quiz.
- Mọi màn hình tuân thủ đúng color token, typography và component ở trên — đảm bảo nhất quán toàn hệ thống.
- Khi cần ảnh banner/khóa học/chứng chỉ, áp dụng công thức thiết kế banner MKT (gradient xanh, logo góc trái, khối 3D, sticker, badge số liệu).

---

## 9. Roadmap & phân kỳ triển khai

Đề xuất triển khai theo sprint 2 tuần. Mốc thời gian cụ thể do team chốt sau khi ước lượng công sức.

| Giai đoạn | Hạng mục | Đầu ra |
|---|---|---|
| Sprint 0 — Chuẩn bị | Chốt yêu cầu, dựng repo, CI/CD, thiết kế DB, design system | Môi trường + bộ khung dự án |
| Sprint 1-2 — Nền tảng | Auth, phân quyền, mô hình dữ liệu, khu vực học (cây Sales), tiến độ học | Nhân sự đăng nhập & học bài được |
| Sprint 3-4 — Game core | Quiz (trắc nghiệm + tình huống + kéo-thả), EXP/Level, cơ chế mở khóa | Vòng lặp Học→Quiz→EXP→Level chạy |
| Sprint 5 — Gamification | Leaderboard realtime, Badge, Daily Mission, Dashboard cá nhân hoàn chỉnh | Trải nghiệm game đầy đủ |
| Sprint 6 — AI | AI Coach (kịch bản Sales), AI chấm tình huống, Boss Battle | Luyện tập & thi nâng cao |
| Sprint 7 — Admin & QA | Admin dashboard, theo dõi, kiểm thử tổng thể, sửa lỗi | Sẵn sàng chạy thử nội bộ |
| Pilot | Chạy thử với 1 nhóm Sales mới, thu phản hồi, tinh chỉnh | Quyết định mở rộng các phòng ban |

---

## 10. Tiêu chí nghiệm thu MVP

MVP được coi là hoàn thành khi thỏa toàn bộ các tiêu chí sau:

1. Nhân sự Sales mới đăng nhập, khởi tạo nhân vật và bắt đầu ở Level 1.
2. Học được trọn cây khóa học Sales (5 mô-đun) với tiến độ ghi nhận chính xác.
3. Làm được 3 dạng quiz (trắc nghiệm, tình huống, kéo-thả) và Boss Battle Sales.
4. Vòng lặp Học→Quiz→EXP→Level Up→Reward→Leaderboard→Unlock hoạt động liền mạch.
5. Cơ chế khóa/mở khóa Level vận hành đúng — không thể nhảy cóc.
6. Dashboard cá nhân hiển thị đủ: avatar, level, EXP, rank, badge, streak, KPI.
7. Leaderboard cập nhật realtime; Daily Mission làm mới mỗi ngày.
8. AI Coach giả lập được khách hàng theo kịch bản Sales và trả về điểm + nhận xét.
9. Admin tự nhập được toàn bộ nội dung bài thi/câu hỏi, tạo/sửa khóa học, cấu hình toàn bộ hệ thống (EXP/Level/Badge/Mission/leaderboard/phân quyền) và xem báo cáo — tất cả qua giao diện, không cần dev.
10. Giao diện đúng chuẩn brand MKT theo Design System mục 8 (nền gradient xanh dương, accent cam/vàng, card kính mờ glow, khối 3D), tiếng Việt có dấu đầy đủ.

---

## 11. Rủi ro & khuyến nghị

| Rủi ro | Khuyến nghị xử lý |
|---|---|
| Nội dung khóa học chưa sẵn sàng khi code xong | Bộ phận đào tạo Sales chuẩn bị nội dung song song từ Sprint 0 |
| Chi phí AI API vượt dự kiến | Đặt giới hạn lượt/người, cache, theo dõi usage từ đầu |
| AI chấm điểm thiếu nhất quán | Chuẩn hóa prompt + tiêu chí; cho Manager duyệt lại Boss Battle |
| Vòng lặp game không đủ cuốn | Test trải nghiệm sớm ở Sprint 4, tinh chỉnh trước khi pilot |
| Nhân sự thấy bị "ép học" gây phản ứng | Truyền thông nội bộ rõ ràng; gắn reward thật hấp dẫn |
| Phình phạm vi (scope creep) | Giữ chặt ranh giới MVP ở mục 1.3; tính năng mới đưa vào backlog |

---

*— Hết tài liệu —*
