# Module 2: Dữ Liệu Lõi & Nội Dung (Core Data - POI & Content)

## 1. Giới thiệu Module
Đây là trung tâm nội dung của ứng dụng. Module này quản lý danh sách các điểm tham quan/nguồn phát (POI), các file phương tiện đa ngôn ngữ (Media), và liên kết với các đối tác dịch vụ xung quanh (Partner). Module phục vụ trực tiếp để trả về nội dung khi "Narration Engine" trên Client phát ra tín hiệu kích hoạt.

## 2. Các thực thể (Entities) liên quan
*   `POI` (Point of Interest): Điểm tham quan/Sự kiện/Di tích cụ thể.
*   `Media`: Thông tin file âm thanh chuẩn bị sẵn hoặc dữ liệu sinh Text-to-Speech (TTS).
*   `Partner`: Thông tin đối tác (nhà hàng, quán ăn, dịch vụ) liên kết với POI.

## 3. Chi tiết Quy trình Nghiệp vụ (Business Processes)

### 3.1. Quản lý Không gian Điểm Tham Quan (Geofence & POI Management)
*   **Mô tả**: Admin CMS tạo thông tin các điểm tham quan cụ thể.
*   **Luồng xử lý (Creation)**:
    1. Admin nhập thông tin cơ bản: Tên, Mô tả (dựa trên tài liệu lịch sử văn hóa).
    2. Xác định tọa độ `latitude`, `longitude`.
    3. Cấu hình `geofence_radius` (Bán kính vùng kích hoạt - thường từ 15-50 mét tùy độ rộng của vỉa hè, tuyến phố).
    4. Hệ thống tự động sinh `qr_code_data` chứa mã định danh duy nhất cho POI đó để in ấn và đặt tại thực địa.
*   **Ràng buộc & Logic Client**:
    *   Geofence của 2 POI gần nhau có thể giao nhau. App Client cần xử lý **Priority Queue** (bài nào kích hoạt trước phát trước, bài kích hoạt sau đưa vào hàng đợi).

### 3.2. Cơ chế Lựa chọn Nội Dung Nghe (Media Selection Engine)
*   **Mô tả**: Đây là luồng logic phức tạp để đảm bảo người dùng nghe được đúng thứ tiếng, đúng khẩu vị vùng miền mà họ đã chọn trong Setting.
*   **Luồng xử lý**:
    1. Client đi vào POI X -> Gửi request lấy thông tin hoặc Client tự duyệt dữ liệu POI X trong Local DB.
    2. POI X có quan hệ 1-N với bảng `Media`. Ví dụ:
        *   Media 1: `language=vi`, `voice_region=mien_bac`, `file=audio_bac.mp3`
        *   Media 2: `language=vi`, `voice_region=mien_nam`, `file=audio_nam.mp3`
        *   Media 3: `language=en`, `voice_region=usa`, `file=audio_en.mp3`
    3. **Thuật toán Match**: 
        *   Tìm Media có `language` == `User.preferred_language` VÀ `voice_region` == `User.preferred_voice_region`.
        *   **Fallback 1**: Nếu không có `voice_region` khớp nhưng có `language` khớp -> Chọn Media đầu tiên có `language` khớp.
        *   **Fallback 2**: Nếu POI này mới tạo, CHƯA có record `Media` nào thu âm sẵn -> Lấy trường `description` text của POI, gửi cho OS của điện thoại đọc bằng tính năng Text-To-Speech (TTS) mặc định.

### 3.3. Tích hợp Đối tác Ẩm thực (Partner/Restaurant Integration)
*   **Mô tả**: Phố ẩm thực cần giới thiệu nhà hàng. Partner sẽ liên kết với một (hoặc vùng) POI nhất định.
*   **Luồng xử lý**:
    1. Trong quá trình phát âm thanh thuyết minh về POI, UI của App sẽ hiển thị thẻ (Card) gợi ý ăn uống.
    2. App truy vấn bảng `Partner` với khóa ngoại `poi_id` của POI đang phát.
    3. Hiển thị thông tin `business_name`, chắt lọc `JSON` từ `menu_details` (ví dụ món "Must try"), và `opening_hours`.
    4. (Extension) Các đối tác đăng ký gói cao cấp có thể chèn 1 đoạn âm thanh TTS khoảng 5-10s phát cuối bài thuyết minh gốc của POI.
