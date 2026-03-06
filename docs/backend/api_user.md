# User API Documentation

Tài liệu này mô tả chi tiết các API endpoints thuộc module User của hệ thống **BuocChanSoiDa**.
Base URL: `http://127.0.0.1:8000/api/users/`

---

## 1. Đăng ký tài khoản (Register)

- **Endpoint:** `/register/`
- **Method:** `POST`
- **Permission:** `AllowAny`
- **Mô tả:** Đăng ký tài khoản người dùng mới. Thành công sẽ trả về thông tin user và cặp token JWT (access, refresh).

### Request Body (JSON)
```json
{
    "email": "user@example.com",
    "username": "user123",                    // Bắt buộc, hiện thị alias
    "password": "Password123!",               // Bắt buộc (tối thiểu 8 ký tự)
    "password_confirm": "Password123!",
    "first_name": "Nguyễn",                   // Tùy chọn
    "last_name": "Văn A",                     // Tùy chọn
    "phone_number": "0987654321",             // Tùy chọn
    "preferred_language": "vi",               // Tùy chọn (mặc định: vi)
    "preferred_voice_region": "Miền Bắc"      // Tùy chọn
}
```

### Response (201 Created)
```json
{
    "message": "Đăng ký thành công!",
    "tokens": {
        "refresh": "eyJhbG...",
        "access": "eyJhbG..."
    },
    "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "user123",
        "full_name": "Nguyễn Văn A"
    }
}
```

---

## 2. Đăng nhập (Login)

- **Endpoint:** `/login/`
- **Method:** `POST`
- **Permission:** `AllowAny`
- **Mô tả:** Đăng nhập hệ thống bằng email và mật khẩu để lấy JWT tokens.

### Request Body (JSON)
```json
{
    "email": "user@example.com",
    "password": "Password123!"
}
```

### Response (200 OK)
```json
{
    "refresh": "eyJhbG...",
    "access": "eyJhbG...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "username": "user123",
        "full_name": "Nguyễn Văn A",
        "preferred_language": "vi",
        "preferred_voice_region": "Miền Bắc"
    }
}
```

---

## 3. Refresh Token

- **Endpoint:** `/login/refresh/`
- **Method:** `POST`
- **Permission:** `AllowAny`
- **Mô tả:** Cấp lại Access Token mới do token cũ (sống 30 phút) đã hết hạn, dựa vào Refresh Token (sống 7 ngày).

### Request Body (JSON)
```json
{
    "refresh": "eyJhbG..." // Refresh token nhận được khi login/register
}
```

### Response (200 OK)
```json
{
    "access": "eyJhbG...",      // Access token mới
    "refresh": "eyJhbG..."      // Refresh token mới (do ROTATE_REFRESH_TOKENS = True)
}
```

---

## 4. Xem / Cập nhật Hồ sơ (Profile)

- **Endpoint:** `/profile/`
- **Method:** `GET`, `PUT`, `PATCH`
- **Permission:** `IsAuthenticated` (Cần Header: `Authorization: Bearer <access_token>`)
- **Mô tả:** 
  - `GET`: Lấy thông tin chi tiết của user đang đăng nhập.
  - `PUT`: Cập nhật toàn bộ thông tin.
  - `PATCH`: Cập nhật một phần thông tin.

### Response (GET - 200 OK)
```json
{
    "id": 1,
    "email": "user@example.com",
    "username": "user123",
    "first_name": "Nguyễn",
    "last_name": "Văn A",
    "full_name": "Nguyễn Văn A",
    "phone_number": "0987654321",
    "device_id": "",
    "preferred_language": "vi",
    "preferred_voice_region": "Miền Bắc",
    "status": 1,
    "date_joined": "2026-03-06T20:00:00Z",
    "last_login": "2026-03-06T20:05:00Z"
}
```

### Request Body (PATCH - 200 OK) - Cập nhật ngôn ngữ
```json
{
    "preferred_language": "en",
    "first_name": "Nguyen"
}
```

---

## 5. Đổi mật khẩu (Change Password)

- **Endpoint:** `/change-password/`
- **Method:** `POST`
- **Permission:** `IsAuthenticated` (Cần Header: `Authorization: Bearer <access_token>`)
- **Mô tả:** Người dùng đổi mật khẩu.

### Request Body (JSON)
```json
{
    "old_password": "Password123!",
    "new_password": "NewPassword456!",
    "new_password_confirm": "NewPassword456!"
}
```

### Response (200 OK)
```json
{
    "message": "Đổi mật khẩu thành công!"
}
```

---

## 6. Đăng xuất (Logout)

- **Endpoint:** `/logout/`
- **Method:** `POST`
- **Permission:** `IsAuthenticated` (Cần Header: `Authorization: Bearer <access_token>`)
- **Mô tả:** Vô hiệu hóa (Blacklist) Refresh Token hiện tại để không thể lấy thêm Access Token nào nữa. Ở phía Client (Web/App), bạn nên tiến hành xóa token khỏi LocalStorage/AsyncStorage.

### Request Body (JSON)
```json
{
    "refresh": "eyJhbG..." // Refresh token cần bị blacklist
}
```

### Response (200 OK)
```json
{
    "message": "Đăng xuất thành công!"
}
```

---

## 📌 Các mã thông báo lỗi phổ biến (Errors HTTP Status)
- `400 Bad Request`: Payload gửi lên bị thiếu (VD: Không khớp `password_confirm`) hoặc sai chuẩn. API sẽ trả về JSON array chi tiết lỗi theo từng field. 
- `401 Unauthorized`: Gửi request yêu cầu có Auth (Token rỗng, lỗi hoặc đã hết hạn).
- `403 Forbidden`: Người dùng hợp lệ, có Token nhưng **không đủ quyền hạn** truy cập View đó (VD: Yêu cầu quyền `Partner`).
