# BuocChanSoiDa - Tài liệu luồng code (Tiếng Việt)

Tài liệu này mô tả luồng xử lý code theo từng tình huống chính để dễ debug, bổ sung tính năng và onboarding thành viên mới.

## 1. Luồng khởi tạo người dùng

1. Frontend mở app, đọc device_id.
2. Gọi API POST /api/users/init.
3. Backend vào users.views, tạo hoặc lấy User theo device_id.
4. Trả về user_id, preferred_language, preferred_voice_region.

File liên quan:
- backend/users/models.py
- backend/users/views.py
- backend/users/serializers.py
- backend/users/urls.py

## 2. Luồng geofence -> narration

1. Frontend cập nhật GPS định kỳ.
2. Nếu vào bán kính POI (geofence_radius), kích hoạt sự kiện Enter.
3. Frontend/backend kiểm tra anti-spam dựa trên NarrationLog:
   - trigger_type = AUTO
   - cùng user, cùng poi
   - trong khoảng thời gian ngắn gần đây
4. Nếu bị trùng, bỏ qua.
5. Nếu hợp lệ:
   - Gọi POST /api/logs/narration/start.
   - Lấy dữ liệu POI và danh sách media.
   - Chọn media phù hợp.
   - Phát audio hoặc dùng TTS.
   - Kết thúc phát -> PUT /api/logs/narration/end kèm duration.

File liên quan:
- backend/pois/models.py
- backend/pois/views.py
- backend/pois/serializers.py
- backend/analytics/models.py
- backend/analytics/views.py

## 3. Thuật toán chọn media

Thứ tự ưu tiên:

1. Khớp chính xác language + voice_region.
2. Nếu không có: khớp language.
3. Nếu vẫn không có: fallback TTS (tts_content hoặc description).

Pseudocode:

```python
def select_media(user, poi):
    media_list = poi.media.filter(status=1)

    exact = media_list.filter(
        language=user.preferred_language,
        voice_region=user.preferred_voice_region,
    ).first()
    if exact and exact.file_url:
        return {"type": "AUDIO", "url": exact.file_url}

    by_lang = media_list.filter(
        language=user.preferred_language,
    ).first()
    if by_lang and by_lang.file_url:
        return {"type": "AUDIO", "url": by_lang.file_url}

    return {"type": "TTS", "content": poi.description}
```

## 4. Luồng quét QR

1. Người dùng mở camera và quét mã.
2. Frontend gọi GET /api/pois/scan?code=...
3. Backend tìm POI theo qr_code_data.
4. Trigger QR được phép nghe ngay (bỏ qua anti-spam).
5. Tạo NarrationLog với trigger_type = QR.
6. Phát nội dung giống luồng narration thông thường.

File liên quan:
- backend/pois/signals.py
- backend/pois/views.py
- backend/analytics/views.py

## 5. Luồng đối tác ẩm thực

1. Trong lúc đang phát POI, frontend gọi GET /api/pois/{id}/partners.
2. Backend lọc partner active theo poi_id.
3. Frontend hiển thị carousel card partner.

File liên quan:
- backend/partners/models.py
- backend/partners/views.py
- backend/partners/serializers.py

## 6. Luồng tracking và analytics

1. App gom nhiều điểm GPS (batch).
2. Gọi POST /api/logs/breadcrumbs.
3. Backend lưu vào BreadcrumbLog.
4. Dashboard dùng dữ liệu này cho heatmap và thống kê.

File liên quan:
- backend/analytics/models.py
- backend/analytics/views.py
- backend/analytics/serializers.py

## 7. Checklist debug nhanh

1. Kiểm tra backend có chạy đúng cổng và endpoint không.
2. Kiểm tra frontend base URL có đúng /api và dấu slash cuối.
3. Kiểm tra CORS cho đúng host frontend.
4. Kiểm tra NarrationLog có ghi trigger_type và duration đúng.
5. Kiểm tra dữ liệu media đủ language/voice_region.
6. Kiểm tra luồng fallback TTS khi file audio không tồn tại.

## 8. Danh sách endpoint thường gặp

- POST /api/users/init
- GET /api/pois/near-me
- GET /api/pois/{id}
- GET /api/pois/scan
- GET /api/pois/{id}/partners
- POST /api/logs/narration/start
- PUT /api/logs/narration/end
- POST /api/logs/breadcrumbs

## 9. Ghi chú kỹ thuật

- Nên tách rõ logic kiểm tra anti-spam để dễ test đơn vị.
- Nên log rõ lý do bỏ qua narration (anti-spam, queue, missing media).
- Các trường language/voice_region cần có quy ước giá trị thống nhất.
- Nếu bổ sung offline mode đầy đủ, cần có cơ chế sync queue rõ ràng cho logs.
