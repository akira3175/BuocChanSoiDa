# Module 3: Hành Trình & Lộ Trình (Tour & Route)

## 1. Giới thiệu Module
Module này có nhiệm vụ nhóm các Điểm tham quan (POI) rời rạc lại thành một tuyến đường có ý nghĩa (Route/Tour). Trải nghiệm của người dùng có thể là "Free-roaming" (Lang thang tự do, đến đâu thì app báo đến đó), hoặc "Guided Tour" (Chọn 1 tour và đi theo hướng dẫn tuần tự).

## 2. Các thực thể (Entities) liên quan
*   `Tour`: Định nghĩa các gói hành trình (vd: "Tour Văn Hóa Xuyên Phố", "Tour Trà Đá Vỉa Hè").
*   `Tour_POI`: Bảng trung gian (Many-to-Many), quy định POI nào thuộc Tour nào, và theo thứ tự nào.

## 3. Chi tiết Quy trình Nghiệp vụ (Business Processes)

### 3.1. Quản lý & Cấu hình Tour
*   **Mô tả**: Tour có thể được tạo bởi Admin CMS (dùng làm các gợi ý chính thức - `is_suggested = True`) hoặc tạo bởi chính người dùng cá nhân (Custom Tour).
*   **Luồng xử lý**:
    1. Tạo bản ghi `Tour` cơ bản (`tour_name`).
    2. Admin/User chọn danh sách các POI đưa vào Tour.
    3. Hệ thống insert vào `Tour_POI`, thiết lập `sequence_order` (1, 2, 3...) cho từng POI trong chuỗi đó.
*   **Ràng buộc & Validate**:
    *   Một POI có thể tham gia vào nhiều Tour khác nhau.
    *   Tour được đánh dấu inactive (`status=0`) sẽ không hiển thị trên danh sách gợi ý cho user.

### 3.2. Chế độ Dẫn đường theo Lộ trình (Guided Tour Mode)
*   **Mô tả**: Khi người dùng chọn "Start" một cụm Tour cụ thể trên UI.
*   **Luồng xử lý & Logic Client**:
    1. Tải về thiết bị danh sách thứ tự các POI thuộc `Tour` đó (Sắp xếp theo `sequence_order` tăng dần).
    2. Mở Bản đồ (Map View), kích hoạt **Route Direction** (vẽ đường chỉ mũi tên) từ POI #1 đến POI #2 đến POI #N.
    3. **Smart Trigger (Geofence)**: 
        *   Dù ở chế độ Tour, "Narration Engine" vẫn dựa vào Geofence để phát chứ không phát mù mờ theo Timer. 
        *   Tuy nhiên, App có thể hiện thông báo nhắc nhở nếu định vị GPS cho thấy người dùng đang đi ngược hướng `sequence_order` hoặc đi chệch khỏi đường chỉ dẫn giữa các POI.
    4. Đánh dấu hoàn tất: Một Tour được đánh dấu `Completed` tại máy Local khi người dùng có record `NarrationLog` cho tất cả các POI nằm trong bảng `Tour_POI` của Tour đó.

### 3.3. Tương quan với Offline Mode (Data Package)
*   **Mô tả**: Cơ chế đóng gói dữ liệu phục vụ Offline Mode (FR-10).
*   **Luồng xử lý**:
    *   Thay vì cho User tải dữ liệu đơn lẻ từng POI (rất rác), Admin cấu hình các "Tour" lớn làm "Khu vực" tải.
    *   Ví dụ: Tour "Toàn Phố Cổ".
    *   Khi người dùng bấm Download Offline, Server sẽ gom toàn bộ bản ghi `POI`, file `Media` Mp3, tọa độ liên quan đến `Tour_POI` của Tour đó đóng thành một file Zip SQLite để Client tải xuống và import. Điều này tối ưu băng thông và sự thuận tiện.
