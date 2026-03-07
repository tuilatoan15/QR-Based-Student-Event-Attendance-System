# Google Sheets API Setup Guide

## Tổng quan
Hệ thống sử dụng Google Sheets API để tự động tạo và cập nhật danh sách điểm danh cho từng sự kiện.

## Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo mới project hoặc chọn project hiện có
3. Ghi nhớ Project ID

## Bước 2: Kích hoạt Google Sheets API

1. Trong Google Cloud Console, vào "APIs & Services" > "Library"
2. Tìm kiếm "Google Sheets API"
3. Click vào "Google Sheets API" và kích hoạt

## Bước 3: Tạo Service Account

1. Vào "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Điền thông tin:
   - Service account name: `event-attendance-service`
   - Service account ID: để mặc định
   - Description: `Service account for event attendance system`
4. Click "Create and Continue"
5. Bỏ qua bước Role (không cần thiết cho Sheets API)
6. Click "Done"

## Bước 4: Tạo Private Key

1. Trong trang Credentials, tìm service account vừa tạo
2. Click vào service account name
3. Vào tab "Keys"
4. Click "Add Key" > "Create new key"
5. Chọn "JSON" và click "Create"
6. File JSON sẽ được tải về - **Lưu trữ an toàn!**

## Bước 5: Tạo Google Sheet chính

1. Truy cập [Google Sheets](https://sheets.google.com/)
2. Tạo spreadsheet mới
3. Đặt tên: `Event Attendance System`
4. Sao chép Sheet ID từ URL (phần giữa `/d/` và `/edit`)

## Bước 6: Chia sẻ quyền truy cập

1. Mở spreadsheet vừa tạo
2. Click "Share" ở góc trên phải
3. Thêm email của service account (từ file JSON, trường `client_email`)
4. Đặt quyền "Editor"
5. Click "Send"

## Bước 7: Cấu hình Environment Variables

Trong file `.env`, cập nhật các giá trị:

```env
GOOGLE_SHEET_ID=your-sheet-id-here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Content-Here\n-----END PRIVATE KEY-----\n"
```

**Lưu ý quan trọng:**
- Thay thế `\n` bằng ký tự xuống dòng thực tế
- Sao chép chính xác nội dung private key từ file JSON
- Không commit file `.env` vào Git

## Bước 8: Test kết nối

Chạy server và tạo một event thử nghiệm để kiểm tra:
- Google Sheet mới có được tạo không
- Dữ liệu có được thêm vào sheet không
- Điểm danh có cập nhật sheet không

## Troubleshooting

### Lỗi "The caller does not have permission"
- Kiểm tra lại quyền "Editor" cho service account
- Đảm bảo Sheet ID chính xác

### Lỗi "Invalid private key"
- Kiểm tra định dạng private key trong .env
- Đảm bảo không có ký tự thừa

### Lỗi "Google Sheets API has not been used"
- Đảm bảo đã kích hoạt Google Sheets API trong Cloud Console

## Bảo mật

- Không commit file credentials vào Git
- Sử dụng environment variables cho production
- Thường xuyên rotate service account keys
- Giới hạn quyền của service account chỉ cho Google Sheets