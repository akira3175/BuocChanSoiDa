# Module 4: Luồng Trải Nghiệm & Tương Tác Frontend (Frontend Flows)

Tài liệu này dành riêng cho đội ngũ phát triển Mobile App / Frontend, mô tả chi tiết chuỗi hành động (Flow) của người dùng trên giao diện, cách App tương tác với cấu hình thiết bị (GPS, Background Audio) và thứ tự gọi API.

---

## 1. Flow Khởi Tạo Ứng Dụng (App Initialization)
**Mục tiêu**: Đảm bảo App có đủ quyền (Permissions) và định danh người dùng trước khi vào màn hình chính.

*   **Bước 1 - Splash Screen**:
    *   App khởi động, sinh/đọc `device_id` từ máy.
    *   Gọi API `[POST] /api/users/init` kèm `device_id`. Backend trả về thông tin `User` (bao gồm `preferred_language`, `voice_region`).
*   **Bước 2 - Kiểm tra Mạng (Network Status)**:
    *   Nếu có mạng (Online): Chuyển sang Bước 3.
    *   Nếu mất mạng (Offline): Kiểm tra xem trong DB Local đã có "Gói dữ liệu Offline" nào chưa.
        *   Nếu có: App switch sang **Offline Mode** -> Bỏ qua API, chỉ đọc SQLite Local.
        *   Nếu không có: Hiện cảnh báo "Không có kết nối mạng và chưa tải dữ liệu offline".
*   **Bước 3 - Cấp Quyền (Permissions Request)**:
    *   Xin quyền **Location (GPS)**: Bắt buộc chọn "While using the app" (Khi dùng ứng dụng) hoặc "Always" (Luôn luôn) để hỗ trợ nhận diện lúc tắt màn hình.
    *   Xin quyền **Notification**: Để hiển thị trình phát nhạc (Media Player) trên màn hình khóa.

---

## 4. Flow Khám Phá Bản Đồ (Map & Explore - Luồng Chính)
**Mục tiêu**: Hiển thị vị trí thực tế của khách và các điểm tham quan xung quanh.

*   **Giao diện**: Một bản đồ trung tâm (Google Maps/Mapbox) + Nút chức năng (QR, Filter, Menu).
*   **Tương tác (Event)**: 
    *   Lấy GPS hiện tại (Ví dụ: `lat: 21.03, long: 105.85`).
    *   Gọi API `[GET] /api/pois/near-me?lat=...&long=...` để lấy danh sách POI trong vòng bán kính X km.
    *   Vẽ các POI lên bản đồ (Marker). Marker có thể đổi màu tùy theo Category (Ẩm thực, Di tích).
    *   **Background Task**: App bắt đầu lưu tọa độ người dùng định kỳ (15-30s/lần). Gom đủ 10 điểm thì gọi API `[POST] /api/logs/breadcrumbs` một lần.

---

## 3. Flow Thuyết Minh Tự Động (Auto-Narration Engine)
**Mục tiêu**: Khi khách đi bộ/ngồi xe vào vùng không gian của điểm tham quan, âm thanh TỰ ĐỘNG cất lên.

1.  **Chạy ngầm (Geofencing)**:
    *   Hệ điều hành điện thoại (Android/iOS) liên tục so sánh GPS của user với tập hợp các `geofence_radius` của các `POI` lân cận.
2.  **Sự kiện Trigger (Enter Geofence)**:
    *   Khi khoảng cách `User < POI.geofence_radius` -> Kích hoạt event `onEnter`.
3.  **Kiểm tra Điều kiện (Anti-Spam)**:
    *   App check Local DB: "Cái POI này nãy giờ mình nghe chưa?". Nếu mới nghe cách đây 10 phút -> **Bỏ qua**.
    *   App check: "Có đang phát loa bài nào khác không?". 
        *   Nếu có: Đưa bài mới vào Hàng đợi (Queue) hoặc hiển thị Popup nhỏ hỏi User "Có muốn nghe điểm mới này không?".
4.  **Phát Âm Thanh (Audio Playback)**:
    *   Gọi API `[POST] /api/logs/narration/start` để báo hệ thống (Bắt đầu tính thời gian nghe).
    *   Gọi API lấy Audio File đích (dựa trên Ngôn ngữ User + Vùng miền). Nếu không có file `.mp3`, gọi hàm TTS (Text-to-Speech) của hệ điều hành đọc trường `description` của POI.
    *   Nổi (Pop-up) một **Bottom Sheet** hiển thị: Tên POI, Ảnh đại diện, và Controller nghe nhạc (Play/Pause, Thanh tiến trình).
5.  **Gợi ý Ẩm thực (Partner Suggestion)**:
    *   Trong khi đang phát âm thanh, nửa dưới của Bottom Sheet sẽ gọi API `[GET] /api/pois/{id}/partners`.
    *   Hiển thị danh sách các quán ăn xung quanh POI đó (Swipe kiểu băng chuyền/Carousel) để kích thích nhu cầu mua sắm/ăn uống.
6.  **Kết thúc (On Complete)**:
    *   Audio chạy xong -> Gọi API `[PUT] /api/logs/narration/end` gửi kèm thời lượng nghe (duration).

---

## 4. Flow Quét Mã QR (Scan to Play)
**Mục tiêu**: Dành cho người dùng không thích định vị hoặc GPS hệ thống bị sai số. Dán thẳng mã QR lên cột điện/biển báo.

1.  Người dùng bấm nút **[Quét QR]** trên màn hình chính.
2.  Camera mở, quét được chuỗi `qr_code_data` (ví dụ: `BCSD-POI-001`).
3.  Gọi API giải mã `[GET] /api/pois/scan?code=BCSD-POI-001`.
4.  Ép buộc (Force) kích hoạt thẳng luồng **Phát Âm Thanh** (Bỏ qua hoàn toàn bước Kiểm tra Điều kiện Anti-spam ở phần 3).
5.  Ghi log với type: `TriggerType = QR`.

---

## 5. Flow Đi Theo Lộ Trình (Guided Tour)
**Mục tiêu**: Dẫn khách đi theo đúng bản đồ vạch sẵn từ điểm A -> B -> C.

1.  Người dùng vào tab **[Tours]**, chọn một Tour gợi ý (vd: "Khám phá ẩm thực ngõ sâu").
2.  Bấm nút **[Bắt đầu Hành trình]**.
3.  UI thay đổi: 
    *   Bản đồ vẽ một đường Line nối các POI theo `sequence_order`.
    *   Hiện chỉ báo phía trước màn hình: "Điểm tiếp theo: Quán Phở Bát Đàn - Cách 200m".
4.  Luồng Audio vẫn hoạt động dựa trên Auto-Narration (Geofence). App chỉ làm thêm việc thông báo nếu khách đi chệch khỏi đường line quá xa (Off-route alert).

---

## 6. Flow Tải Dữ Liệu Offline (Offline Syncing)
**Mục tiêu**: Khách nước ngoài không có 4G/Wifi vẫn dùng được App mượt mà.

1.  Tại nơi có Wifi (Khách sạn), người dùng vào tab **[Tải xuống]**.
2.  Giao diện hiển thị danh sách các "Gói khu vực" (Thực chất là các khu vực Tour).
3.  Bấm Tải -> App gọi API Server lấy về một file `.zip` chứa:
    *   File `data.db` (Chứa table POI, Partner, text dịch).
    *   Thư mục `/media` (Chứa các file `.mp3`).
    *   Bản đồ khu vực tĩnh (Map Tiles).
4.  Giải nén vào bộ nhớ trong của App.
5.  **Cơ chế Đổi Nhánh (Switch Logic)**: Từ thời điểm này, mọi hàm Fetch Data của FE (`getPOIs`, `getAudio`) thay vì gọi Axios/Fetch HTTP, sẽ được intercept và query thẳng vào file SQLite / Bộ nhớ Storage của máy. Cấu trúc Response đảm bảo giữ **y hệt** JSON của API để không sinh ra nhiều nhánh IF/ELSE trong UI Code.
6.  Các request ghi Log (Breadcrumb, NarrationLog) được insert vào một bảng tạm (SyncQueue) dưới Local. Khi có Wifi, Queue này được đẩy hàng loạt lên Server.
