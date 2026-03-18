# Huong dan su dung API Partner (Theo ERD)

## Tong quan
Module Partner hien co 2 nhom API:
- API tai khoan Partner actor (dang ky/dang nhap/profile/doi mat khau/dang xuat)
- API CRUD Partner business (quan ly co so lien ket voi POI)

Sau khi chinh theo ERD, entity Partner business chi con cac truong:
- `id`
- `poi`
- `business_name`
- `menu_details`
- `opening_hours`
- `status`

Khong con cac truong `approval_status`, `intro_text`, `intro_audio`, `user`, `created_at`, `updated_at` trong bang `partners`.

## Endpoint dang dung

## 1) Tai khoan Partner actor

Base URL: `http://127.0.0.1:8000/api/partners/account/`

### 1.1 Dang ky tai khoan Partner
```http
POST /api/partners/account/register/
```

Body:
```json
{
  "email": "partner@example.com",
  "username": "partner_01",
  "password": "Password123!",
  "password_confirm": "Password123!",
  "first_name": "Nguyen",
  "last_name": "Van B",
  "phone_number": "0909000111",
  "preferred_language": "vi",
  "preferred_voice_region": "Mien Nam"
}
```

Ket qua: tao user va tu dong gan vao group `Partner`, dong thoi tra JWT tokens.

### 1.2 Dang nhap tai khoan Partner
```http
POST /api/partners/account/login/
```

Body:
```json
{
  "email": "partner@example.com",
  "password": "Password123!"
}
```

Chi cho phep tai khoan thuoc group `Partner`.

### 1.3 Refresh token
```http
POST /api/partners/account/login/refresh/
```

### 1.4 Xem / cap nhat profile
```http
GET /api/partners/account/profile/
PATCH /api/partners/account/profile/
PUT /api/partners/account/profile/
```

### 1.5 Doi mat khau
```http
POST /api/partners/account/change-password/
```

### 1.6 Dang xuat
```http
POST /api/partners/account/logout/
```

Body:
```json
{
  "refresh": "<refresh_token>"
}
```

## 2) Partner business CRUD

### 2.1 Lay danh sach partner
```http
GET /api/partners/
```

Query params ho tro:
- `poi_id`: loc theo diem POI
- `status`: `0` hoac `1`
- `search`: tim theo `business_name`

Vi du:
```http
GET /api/partners/?status=1
GET /api/partners/?poi_id=1
GET /api/partners/?search=pho
```

### 2.2 Lay chi tiet 1 partner
```http
GET /api/partners/{id}/
```

Vi du:
```http
GET /api/partners/1/
```

### 2.3 Tao partner (Admin)
```http
POST /api/partners/
Content-Type: application/json
Authorization: Bearer <admin_token>
```

Body:
```json
{
  "poi": 1,
  "business_name": "Pho Thin Lo Duc",
  "menu_details": {
    "must_try": ["pho tai", "quay"],
    "price_range": "50k-80k"
  },
  "opening_hours": "06:00 - 20:30",
  "status": 1
}
```

### 2.4 Cap nhat partner (Admin)
```http
PATCH /api/partners/{id}/
Content-Type: application/json
Authorization: Bearer <admin_token>
```

### 2.5 Xoa partner (Admin)
```http
DELETE /api/partners/{id}/
Authorization: Bearer <admin_token>
```

### 2.6 Lay partner theo POI (Public)
```http
GET /api/pois/{poi_id}/partners/
```

## Tra loi cho cau hoi cua ban
Request sau khong con hop le trong thiet ke theo ERD:
```http
GET /api/partners/approvals/1/
```

Hay doi sang:
```http
GET /api/partners/1/
```

## Du lieu mau theo anh ban gui
Bang `partners` hien co 2 ban ghi:
- id=1, business_name="Pho Thin Lo Duc", opening_hours="06:00 - 20:30", status=1, poi_id=1
- id=2, business_name="Quan Ca phe", opening_hours="07:00 - 22:00", status=1, poi_id=1

Ban co the test nhanh:
```bash
curl -X GET "http://localhost:8000/api/partners/1/"
curl -X GET "http://localhost:8000/api/partners/?poi_id=1&status=1"
curl -X GET "http://localhost:8000/api/pois/1/partners/"
```

