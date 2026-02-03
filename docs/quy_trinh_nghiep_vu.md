# Quy Trình Nghiệp Vụ & Yêu Cầu Hệ Thống - Ứng Dụng Thuyết Minh Phố Ẩm Thực

## 1. Giới Thiệu
Tài liệu này mô tả chi tiết quy trình nghiệp vụ và các yêu cầu kỹ thuật cho ứng dụng "Thuyết minh du lịch tự động" (Food Street Narration App). Tài liệu được xây dựng dựa trên các ghi chép phác thảo (Proof of Concept) của dự án.

## 2. Mục Tiêu & Vấn Đề (Problem & Solution)
*   **Vấn đề (Problem)**: 
    *   Khách du lịch thường thiếu sự tham gia (engagement) hoặc thiếu thông tin khi di chuyển.
    *   Thường ngủ gật hoặc bỏ lỡ các thông tin thú vị về địa điểm đi qua.
    *   Khó tìm kiếm hướng dẫn viên chuyên nghiệp mọi lúc mọi nơi.
*   **Giải pháp (Solution)**: 
    *   Xây dựng ứng dụng tự động thuyết minh dựa trên vị trí (Location-based Narration).
    *   Cung cấp thông tin lịch sử, văn hóa về các điểm đến (POI - Point of Interest) tự động khi người dùng di chuyển đến gần.

## 3. Các Tính Năng Cốt Lõi (Core Features)

### 3.1. Thuyết Minh Tự Động (Automated Narration) -> "Narration Engine"
Hệ thống tự động phát nội dung thuyết minh khi người dùng đi vào vùng địa lý xác định (Geofence).
*   **Định dạng âm thanh**:
    *   **TTS (Text-to-Speech)**: Linh hoạt, đa ngôn ngữ, dung lượng nhẹ. Dùng cho các nội dung cập nhật thường xuyên hoặc ít quan trọng.
    *   **Audio thu sẵn (Recorded Audio)**: Giọng đọc tự nhiên, chuyên nghiệp. Dùng cho các điểm tham quan chính (Hero POIs).
*   **Cơ chế phát (Playback Logic)**:
    *   **Quản lý hàng đợi (Queue)**: Nếu đi qua nhiều điểm gần nhau, đưa vào hàng chờ xử lý.
    *   **Tránh trùng lặp**: Không phát lại nội dung của điểm đã nghe trong một khoảng thời gian nhất định hoặc trong cùng một hành trình.
    *   **Ưu tiên & Ngắt**: Tự động dừng/nhỏ âm lượng khi có thông báo quan trọng khác hoặc khi người dùng thực hiện tác vụ ưu tiên (ví dụ: cuộc gọi - tùy thuộc quyền hệ thống).

### 3.2. Kích Hoạt Bằng QR (QR Activation)
*   Tại các điểm dừng cụ thể (ví dụ: Trạm xe buýt, biển báo):
    *   Người dùng quét mã QR.
    *   Hệ thống kích hoạt nội dung giới thiệu về điểm đó hoặc tuyến phố đó ngay lập tức (Trigger play immediately).
    *   Hữu ích khi GPS không chính xác hoặc người dùng muốn nghe chủ động.

### 3.3. Hoạt Động Online & Offline
*   **Cấu hình thiết bị KHÔNG có Wifi (Offline Mode)**:
    *   Sử dụng dữ liệu tải sẵn (Local Database - SQLite).
    *   Quét QR để kích hoạt nội dung có sẵn trong máy.
*   **Cấu hình thiết bị CÓ Wifi (Online Mode)**:
    *   Đồng bộ dữ liệu với SQL Server.
    *   Tải nội dung mới hoặc stream nội dung (nếu cần).

### 3.4. Phân Tích Dữ Liệu (Analytics) - "Data Analysis"
Thu thập dữ liệu ẩn danh để cải thiện trải nghiệm và dịch vụ:
*   Lưu tuyến đường di chuyển (ẩn danh).
*   Thống kê Top địa điểm được nghe nhiều nhất.
*   Thời gian nghe trung bình trên mỗi địa điểm (POI).
*   Bản đồ nhiệt (Heatmap) về vị trí và mật độ người dùng.

## 4. Quy Trình Nghiệp Vụ (Business Processes)

### 4.1. Luồng Người Dùng (User Flow)
1.  **Khởi động**: Người dùng mở App (Web App hoặc Mobile App).
2.  **Chuẩn bị**:
    *   Nếu Offline: App kiểm tra và nhắc tải gói dữ liệu khu vực.
    *   Cấp quyền truy cập vị trí (Location Permission).
3.  **Trải nghiệm**:
    *   Người dùng di chuyển (đi bộ, xe điện, xe buýt).
    *   **Sự kiện**: Thiết bị đi vào vùng "Geofence" của một POI.
    *   **Hành động**: App tự động phát thuyết minh (Audio/TTS).
    *   **Tương tác (Tùy chọn)**: Người dùng quét QR tại điểm cố định -> Nghe ngay thuyết minh tại chỗ.
4.  **Kết thúc**: Xem lại lịch sử các điểm đã đi qua.

### 4.2. Luồng Hệ Thống (System Process) - "The Engine"
1.  **Dịch vụ định vị (Location Service)**: Theo dõi tọa độ GPS liên tục.
2.  **Geofence Engine**: 
    *   So sánh tọa độ GPS với danh sách Geofence ảo.
    *   Phát hiện sự kiện `Enter` (Vào vùng) hoặc `Exit` (Ra vùng).
3.  **Narration Engine**:
    *   Nhận tín hiệu từ Geofence Engine.
    *   Kiểm tra quy tắc logic (Đã nghe chưa? Có đang phát bài khác không?).
    *   Quyết định chọn file Audio (ưu tiên) hay tạo TTS.
4.  **Audio Output**: Phát ra loa/tai nghe của thiết bị.

## 5. Kiến Trúc Sơ Bộ & Dữ Liệu

### 5.1. Thành phần
*   **Client**:
    *   Mobile App / Web App (trên trình duyệt điện thoại).
    *   Các module: Map (Bản đồ), List (Danh sách POI), Settings (Cài đặt giọng nói, ngôn ngữ).
*   **Server**:
    *   Web Server quản lý nội dung (CMS).
    *   API cung cấp dữ liệu POI, Gói nội dung.
    *   Nhận dữ liệu Log/Analytics.

### 5.2. Sơ đồ thực thể liên kết (ERD Sketch)
*   **Entities (Thực thể)**:
    *   `POI` (Điểm tham quan): Tên, Tọa độ, Bán kính Geofence, Nội dung Text.
    *   `Media`: Link file Audio, Ngôn ngữ, Loại giọng.
    *   `Route` (Tuyến): Tập hợp các POI.
    *   `UserLog`: Lịch sử nghe, vị trí.
*   **Quan hệ**: 
    *   Một POI có nhiều Media (Đa ngôn ngữ).
    *   Một Route đi qua nhiều POI.

## 6. Ghi Chú Phát Triển (Dev Notes)
*   **Exception != Extension**: Phân biệt rõ tính năng mở rộng và xử lý ngoại lệ.
*   **Use Case**: Cần định nghĩa rõ các case `<<include>>` và `<<extend>>`.
*   **Ưu tiên phát triển**: 
    1.  Core: Location + Audio Trigger.
    2.  Data sync (Offline/Online).
    3.  Analytics.
