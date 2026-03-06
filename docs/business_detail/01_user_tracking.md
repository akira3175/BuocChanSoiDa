# Module 1: Người Dùng & Tracking (User & Logging)

## 1. Giới thiệu Module
Module này chịu trách nhiệm quản lý định danh người dùng (thông qua thiết bị), lưu trữ cấu hình cá nhân hóa (ngôn ngữ, giọng đọc) và ghi nhận liên tục toàn bộ hành vi di chuyển, tương tác của người dùng với hệ thống để phục vụ cho tính năng cốt lõi (Narration Engine) cũng như phân tích dữ liệu (Analytics).

## 2. Các thực thể (Entities) liên quan
*   `User`: Quản lý thông tin và cấu hình thiết bị người dùng.
*   `BreadcrumbLog`: Lưu vết tọa độ GPS của người dùng theo thời gian.
*   `NarrationLog`: Lưu trữ lịch sử các đoạn audio/nội dung mà người dùng đã nghe.

## 3. Chi tiết Quy trình Nghiệp vụ (Business Processes)

### 3.1. Định danh & Khởi tạo User (User Identification)
*   **Mô tả**: Do ứng dụng du lịch thường ưu tiên sự nhanh gọn, người dùng không cần đăng ký tài khoản truyền thống (Email/Password). Hệ thống sử dụng `device_id` làm định danh duy nhất.
*   **Luồng xử lý**:
    1. Lần đầu mở App, hệ thống đọc `device_id` và gọi API kiểm tra.
    2. Nếu chưa tồn tại -> Tạo `User` mới với các thông số mặc định (ví dụ: `preferred_language = "vi"`, `preferred_voice_region = "mien_nam"`).
    3. Trả về `user_id` để client sử dụng cho các request sau.
*   **Case cập nhật**: Người dùng có thể vào màn hình Cài đặt (Settings) để thay đổi `preferred_language` và `preferred_voice_region`. Cập nhật này sẽ tác động trực tiếp đến thuật toán chọn file Audio/TTS ở Module Core Data.

### 3.2. Tracking Lộ Trình Di Chuyển (Breadcrumb Tracking)
*   **Mô tả**: Dịch vụ chạy ngầm trên thiết bị định kỳ gửi tọa độ về Server để tạo "vệt bánh mì" (Breadcrumbs). Dữ liệu này dùng để vẽ Heatmap, thống kê mật độ du khách.
*   **Luồng xử lý**:
    1. Khi App ở trạng thái Active hoặc Background (nếu được cấp quyền), Service kích hoạt lấy GPS định kỳ (ví dụ: mỗi 15-30 giây).
    2. Gom nhóm các điểm tọa độ và gửi batch (mảng) về Server để tiết kiệm request và pin.
    3. Server nhận mảng tọa độ, lưu vào `BreadcrumbLog` với `user_id` tương ứng và `timestamp`.
*   **Ràng buộc & Tối ưu**:
    *   **Rule 1 (Tiết kiệm pin)**: Nếu gia tốc kế (Accelerometer) tĩnh, hoặc tọa độ không đổi quá X mét -> Tạm ngưng gửi log.
    *   **Rule 2 (Offline mode)**: Khi mất mạng, lưu breadcrumbs vào SQLite local. Khi có mạng, đồng bộ (sync) toàn bộ lên Server.

### 3.3. Ghi log Lịch sử Nghe (Narration Logging)
*   **Mô tả**: Đóng vai trò then chốt cho "Narration Engine". Hệ thống cần biết User *đã nghe gì* và *khi nào* để tránh phát lặp lại gây khó chịu.
*   **Luồng xử lý**:
    1. Khi hệ thống bắt đầu phát một nội dung (do Geofence kích hoạt hoặc do User quét QR), Client gọi API báo cáo `start`.
    2. Server tạo mới 1 record `NarrationLog` chứa `user_id`, `poi_id`, `start_time`, `trigger_type` (Auto hoặc QR).
    3. Khi kết thúc phát audio (hoặc bị người dùng bấm dừng/skip), Client gửi thêm số liệu `duration` (thời lượng đã nghe) về để cập nhật record.
*   **Ràng buộc Nghiệp vụ (Narration Engine Rules)**:
    *   **Anti-Spam/Anti-Loop**: Khi User đi vào Geofence của POI X -> Kiểm tra `NarrationLog`. Nếu trong vòng **X phút** (vd: 30 phút) vừa qua, User đã có `NarrationLog` của POI X bằng trigger `Auto` -> Bỏ qua không tự động phát tiếp.
    *   **Override Rule**: Nếu trigger là `QR` -> Bỏ qua luật Anti-Spam. Quét QR luôn luôn phát ngay lập tức.
    *   Analytics có thể tính điểm "Độ hấp dẫn của POI" dựa trên `% duration` nghe thực tế so với độ dài gốc của Audio.
