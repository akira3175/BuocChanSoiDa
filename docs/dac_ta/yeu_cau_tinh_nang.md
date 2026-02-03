# Đặc Tả Tính Năng & Yêu Cầu Chức Năng (Feature Specifications)

Tài liệu này chi tiết hóa các tính năng để phục vụ việc xây dựng **Use Case** và **Thiết kế hệ thống**.

## 1. Danh Sách Tác Nhân (Actors)
*   **Khách Du Lịch (Guest/User)**: Người sử dụng app để nghe thuyết minh khi di chuyển.
*   **Hệ Thống (System)**: Các process chạy ngầm (Geofence Service, Narration Engine).
*   **Quản Trị Viên (Admin)**: Người quản lý hệ thống CMS (Quản lý POI, Audio, Bản dịch/Đa ngôn ngữ, Lịch sử người dùng, Quản lý Tour).
*   **Nhà Hàng/Đối Tác (Restaurant/Partner)**: Cung cấp dịch vụ ẩm thực, tự giới thiệu qua Audio/TTS.

## 2. Chi Tiết Tính Năng (Detailed Features)

### Tính Năng 1: Thuyết Minh Tự Động (Auto-Narration)
*   **Mô tả**: Hệ thống tự động phát hiện vị trí người dùng và phát nội dung tương ứng.
*   **Yêu cầu chi tiết**:
    *   **FR-01**: Hệ thống phải theo dõi vị trí GPS thời gian thực (Real-time tracking).
    *   **FR-02**: Hệ thống phải so sánh vị trí với Geofence của các POI.
    *   **FR-03**: Khi sự kiện `Enter Geofence` xảy ra:
        *   Kiểm tra `HistoryLog`: Nếu đã nghe trong vòng X phút -> Bỏ qua.
        *   Kiểm tra `AudioQueue`: Nếu đang phát audio khác -> Thêm vào hàng đợi (Priority Queue).
        *   Nếu hàng đợi rỗng -> Phát ngay.
    *   **FR-04**: Tự động chuyển đổi giữa file Audio (ưu tiên) và TTS (Text-to-Speech) nếu không có audio thu sẵn.
    *   **FR-04-A**: Cho phép người dùng chọn giọng đọc theo vùng miền (Miền Bắc, Miền Trung, Miền Nam) để tăng trải nghiệm địa phương hóa.
    *   **FR-04-B**: Hỗ trợ chế độ "Tour" (Theo lộ trình gợi ý sẵn) hoặc "Khám phá" (Tự do). Người dùng có thể "Tạo Tour mới" theo sở thích.

### Tính Năng 2: Nghe Thuyết Minh Chủ Động (QR Scan)
*   **Mô tả**: Người dùng quét mã QR tại điểm tham quan để nghe ngay lập tức.
*   **Yêu cầu chi tiết**:
    *   **FR-05**: Cho phép người dùng mở Camera quét QR.
    *   **FR-06**: Quét là nghe ngay (Instant Play), bỏ qua các điều kiện GPS/Geofence thông thường.
    *   **FR-07**: Hiển thị thông tin chi tiết POI và các tiện ích xung quanh (Toilet, Nghỉ chân, Điểm đến khác).

### Tính Năng 3: Quản Lý Gói Dữ Liệu (Offline Data Management)
*   **Mô tả**: Đảm bảo app hoạt động khi không có Internet.
*   **Yêu cầu chi tiết**:
    *   **FR-09**: Kiểm tra kết nối mạng khi khởi động.
    *   **FR-10**: Cho phép tải xuống "Gói nội dung" (Map tiles, Audio, DB POI) theo khu vực/thành phố.
    *   **FR-11**: Lưu trữ dữ liệu cục bộ vào SQLite và File System.
    *   **FR-12**: Đồng bộ (Sync) dữ liệu history/analytics lên Server khi có mạng trở lại.

### Tính Năng 4: Xem Bản Đồ & Danh Sách (Map & List View)
*   **Mô tả**: Giao diện trực quan cho người dùng định hướng.
*   **Yêu cầu chi tiết**:
    *   **FR-13**: Hiển thị bản đồ với vị trí hiện tại và các icon POI xung quanh.
    *   **FR-14**: Hiển thị danh sách các địa điểm "Near me" (Gần tôi).
    *   **FR-15**: Bộ lọc (Filter) theo loại hình (Ẩm thực, Di tích, Check-in).

### Tính Năng 5: Thu Thập Dữ Liệu (Analytics)
*   **Mô tả**: Ghi nhận hành vi người dùng (ẩn danh).
*   **Yêu cầu chi tiết**:
    *   **FR-16**: Ghi log khi bắt đầu/kết thúc một bài thuyết minh (Duration).
    *   **FR-17**: Ghi log lộ trình di chuyển (breadcrumbs) với timestamp.
    *   **FR-18**: Gửi dữ liệu về server theo chu kỳ hoặc khi kết nối wifi.

### Tính Năng 6: Tiếp Thị & Liên Kết (Marketing & Partnership)
*   **Mô tả**: Hỗ trợ Nhà hàng/Đối tác tự giới thiệu về mình với khách du lịch.
*   **Yêu cầu chi tiết**:
    *   **FR-19**: Hiển thị gợi ý nhà hàng gần POI đang nghe thuyết minh.
    *   **FR-20**: Cho phép Nhà hàng nhập nội dung văn bản giới thiệu (hệ thống sẽ chuyển thành TTS).
    *   **FR-21**: Cho phép Nhà hàng tải lên file Audio tự thu âm (ưu tiên phát nếu có).
    *   **FR-22**: Cho phép Nhà hàng cập nhật Menu/Giờ mở cửa (thông qua cổng Admin hoặc App dành cho Partner).

## 3. Gợi Ý Các Use Case (Use Case Suggestions)

Dựa trên các tính năng trên, dưới đây là danh sách Use Case tiềm năng cần vẽ:

| ID | Tên Use Case | Tác Nhân | Ghi chú |
| :--- | :--- | :--- | :--- |
| **UC-01** | **Nghe thuyết minh tự động** | Guest, System | Ca sử dụng quan trọng nhất. System là actor chính kích hoạt. |
| **UC-02** | **Quét QR nghe thuyết minh** | Guest | Hành động chủ động của khách. |
| **UC-03** | **Tải gói dữ liệu Offline** | Guest | Pre-condition để dùng Offline. |
| **UC-04** | **Xem bản đồ & POI** | Guest | Tra cứu thông tin. |
| **UC-05** | **Đồng bộ dữ liệu** | System | Chạy ngầm (Background). |

## 4. Ràng Buộc Phi Chức Năng (Non-functional Requirements)
*   **Pin (Battery)**: Tối ưu hóa GPS (chỉ lấy mẫu cao khi di chuyển nhanh, giảm khi đứng yên).
*   **Dung lượng**: Cơ chế dọn dẹp cache audio cũ để tiết kiệm bộ nhớ.
*   **Độ trễ (Latency)**: Thời gian từ khi vào Geofence đến khi phát tiếng < 3 giây.
