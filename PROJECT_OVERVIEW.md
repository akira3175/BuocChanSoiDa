# BuocChanSoiDa - Tổng quan hệ thống

Tài liệu này tóm tắt toàn bộ hệ thống BuocChanSoiDa theo góc nhìn nghiệp vụ và kỹ thuật.

## 1. Mục tiêu hệ thống

- Tự động thuyết minh khi khách du lịch đi vào vùng POI.
- Hỗ trợ nghe chủ động bằng mã QR.
- Hoạt động online và có khả năng mở rộng cho offline.
- Thu thập dữ liệu hành vi để phân tích hiệu quả.
- Kết nối đối tác ẩm thực theo từng POI.

## 2. Kiến trúc tổng quan

- Frontend: React + TypeScript, Vite.
- Backend: Django + Django REST Framework.
- Lưu trữ media: Cloudinary.
- CSDL: PostgreSQL (production) / SQLite (dev hoặc offline cache).

Luồng kết nối cơ bản:

1. Frontend gọi REST API đến backend.
2. Backend truy vấn CSDL và trả dữ liệu POI, media, partner, log.
3. File audio/hình ảnh được phục vụ từ Cloudinary.
4. Frontend phát audio hoặc TTS theo kết quả chọn media.

## 3. Mô hình dữ liệu chính

### User
- Định danh người dùng (email hoặc device_id).
- Lưu cấu hình ngôn ngữ và giọng đọc ưu tiên.

### POI
- Lưu điểm tham quan: tên, mô tả, tọa độ, geofence_radius, mã QR.

### Media
- Gắn với POI.
- Lưu file audio thu sẵn hoặc nội dung để TTS.
- Hỗ trợ language và voice_region để phục vụ cá nhân hóa.

### Partner
- Đối tác ẩm thực gắn với POI.
- Lưu thông tin quán, menu, giờ mở cửa.

### Tour / Tour_POI
- Định nghĩa lộ trình tham quan theo thứ tự.

### BreadcrumbLog
- Lưu vết di chuyển theo thời gian.

### NarrationLog
- Lưu lịch sử nghe, trigger_type (AUTO/QR), thời lượng nghe.

## 4. Luồng nghiệp vụ cốt lõi

### 4.1 Khởi tạo ứng dụng
1. Frontend đọc hoặc sinh device_id.
2. Gọi POST /api/users/init.
3. Backend tạo hoặc lấy User hiện có.
4. Frontend lưu thông tin user và cấu hình.

### 4.2 Tự động thuyết minh bằng geofence
1. App theo dõi GPS.
2. Khi vào vùng POI -> kích hoạt sự kiện Enter.
3. Kiểm tra anti-spam (đã nghe POI này gần đây chưa).
4. Nếu hợp lệ: tạo narration start log.
5. Lấy thông tin POI + media.
6. Chọn media theo thứ tự ưu tiên:
   - Khớp language + voice_region.
   - Khớp language.
   - Fallback sang TTS.
7. Phát audio và hiển thị thông tin POI.
8. Kết thúc phát -> cập nhật narration end log với duration.

### 4.3 Quét QR nghe ngay
1. Người dùng quét mã QR.
2. App gọi API giải mã QR -> trả POI.
3. Trigger QR bỏ qua anti-spam.
4. Tạo log và phát nội dung ngay.

### 4.4 Gợi ý đối tác ẩm thực
1. Khi đang phát POI, app gọi danh sách partner theo poi_id.
2. Hiển thị card đối tác trên bottom sheet.

### 4.5 Tracking và analytics
1. App gom nhóm điểm GPS theo chu kỳ.
2. Gửi batch breadcrumb lên backend.
3. Backend lưu để phục vụ heatmap và báo cáo hành vi.

## 5. Danh sách API tiêu biểu

- POST /api/users/init
- GET /api/pois/near-me
- GET /api/pois/{id}
- GET /api/pois/scan?code=...
- GET /api/pois/{id}/partners
- POST /api/logs/narration/start
- PUT /api/logs/narration/end
- POST /api/logs/breadcrumbs
- GET/POST /api/tours

## 6. Các quy tắc quan trọng

- Anti-spam: Trigger AUTO không phát lặp lại cùng POI trong cửa sổ thời gian ngắn (ví dụ 30 phút).
- Trigger QR: ưu tiên nghe ngay, bỏ qua anti-spam.
- Media fallback: nếu không có file phù hợp thì dùng TTS.
- Ưu tiên trải nghiệm: đang phát bài khác thì đưa vào queue hoặc hỏi người dùng.

## 7. Cấu trúc backend theo app

- users: quản lý user, khởi tạo theo device, cập nhật setting.
- pois: POI, geofence data, scan QR, media theo POI.
- tours: tour và thứ tự POI trong tour.
- partners: quản lý đối tác ẩm thực.
- analytics: breadcrumb log, narration log, thống kê.
- core: thành phần dùng chung, media chung trên Cloudinary.
- config: cấu hình Django và router tổng.

## 8. Ghi chú triển khai

- Cần đảm bảo CORS đúng domain frontend.
- Quy ước endpoint nhất quán (có/không dấu slash cuối).
- Nếu sử dụng chế độ offline, cần giữ schema dữ liệu local tương thích API response.
- Kiểm tra dữ liệu narration log để tránh kết quả analytics sai.
