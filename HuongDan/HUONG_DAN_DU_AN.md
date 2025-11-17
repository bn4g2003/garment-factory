# 📋 HƯỚNG DẪN DỰ ÁN - HỆ THỐNG QUẢN LÝ XƯỞNG MAY

## 🎯 TỔNG QUAN DỰ ÁN

**Mục đích:** Quản lý toàn bộ quy trình sản xuất và bán hàng của xưởng may (1 xưởng + 4 cửa hàng)

**Công nghệ:**
- Frontend: Next.js 16 (React 19, TypeScript)
- Backend: Next.js API Routes
- Database: PostgreSQL (Supabase)
- Styling: Tailwind CSS 4

**Quy mô:**
- Xưởng: ~200 đơn hàng/tháng
- Cửa hàng: ~400 đơn hàng/tháng
- NVL: ~500 mã
- Nhân viên: Nhiều phòng ban (Cắt, May, Hoàn thiện, QC)

---

## 📁 CẤU TRÚC DỰ ÁN

```
xuongmay/
├── app/
│   ├── admin/                    # Trang quản trị
│   │   ├── layout.tsx           # Layout chung (Sidebar + Breadcrumb)
│   │   ├── users/               # Quản lý người dùng
│   │   ├── customers/           # Quản lý khách hàng
│   │   ├── materials/           # Quản lý NVL
│   │   ├── products/            # Quản lý sản phẩm
│   │   │   └── [id]/materials/  # Định mức NVL
│   │   └── orders/              # Quản lý đơn hàng
│   │       └── [id]/            # Chi tiết đơn hàng
│   ├── api/                     # API Routes
│   │   ├── auth/login/          # Đăng nhập
│   │   ├── users/               # API Users
│   │   ├── customers/           # API Customers
│   │   ├── materials/           # API Materials
│   │   ├── products/            # API Products
│   │   └── orders/              # API Orders
│   │       ├── check-materials/ # Kiểm tra NVL
│   │       └── [id]/            # Chi tiết đơn
│   ├── login/                   # Trang đăng nhập
│   ├── page.tsx                 # Redirect to login
│   └── globals.css              # CSS global
├── lib/
│   └── db.ts                    # PostgreSQL connection
├── HuongDan/
│   ├── MoTa.txt                 # Mô tả chi tiết dự án
│   └── sample_sql_fromdatabase.sql  # Schema database
├── .env.local                   # Biến môi trường
└── package.json

```

---

## 🗄️ DATABASE SCHEMA

### Bảng chính:
1. **users** - Người dùng (8 roles: admin, factory_manager, store_manager, accountant, warehouse_staff, production_staff, sales_staff, staff)
2. **customers** - Khách hàng
3. **materials** - Nguyên vật liệu (~500 mã)
4. **products** - Sản phẩm (sỉ, lẻ, gia công)
5. **material_standards** - Định mức NVL cho sản phẩm
6. **orders** - Đơn hàng sản xuất
7. **order_items** - Chi tiết đơn hàng
8. **production_process** - 4 công đoạn (Cắt → May → Hoàn thiện → Kiểm tra)
9. **stores** - Cửa hàng
10. **suppliers** - Nhà cung cấp

**File SQL:** `HuongDan/sample_sql_fromdatabase.sql`

---

## ⚙️ CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Cài đặt dependencies:
```bash
npm install
```

### 2. Cấu hình database:
Tạo file `.env.local`:
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 3. Chạy development:
```bash
npm run dev
```
Truy cập: http://localhost:3000

### 4. Build production:
```bash
npm run build
npm start
```

---

## 🔐 ĐĂNG NHẬP

**Tài khoản mặc định:** (Cần tự insert vào database)
```sql
INSERT INTO users (username, password, full_name, role, status, created_at)
VALUES ('admin', 'admin123', 'Administrator', 'admin', 'active', NOW());
```

**Lưu ý:** Mật khẩu KHÔNG mã hóa (theo yêu cầu)

---

## ✅ TÍNH NĂNG ĐÃ HOÀN THÀNH (35-40%)

### 1. Hệ thống nền tảng
- ✅ Đăng nhập & Phân quyền (8 roles)
- ✅ Layout với Sidebar phân cấp (thu gọn được)
- ✅ Breadcrumb tự động (Trang chủ / Module / Chi tiết)
- ✅ Quản lý Người dùng (CRUD)

### 2. Quản lý Sản phẩm & NVL
- ✅ **Quản lý NVL** (`/admin/materials`)
  - CRUD nguyên vật liệu
  - Tìm kiếm
  - Cảnh báo tồn kho thấp (dòng đỏ)
  - Đơn vị tính: kg, m, m², cái, bộ, cuộn, thùng

- ✅ **Quản lý Sản phẩm** (`/admin/products`)
  - CRUD sản phẩm
  - Phân loại: Sỉ, Lẻ, Gia công
  - Link đến định mức NVL

- ✅ **Định mức NVL** (`/admin/products/[id]/materials`)
  - Khai báo định mức NVL cho từng sản phẩm
  - Tự động lấy đơn vị tính từ NVL

### 3. Quản lý Đơn hàng ⭐⭐⭐
- ✅ **Quản lý Khách hàng** (`/admin/customers`)
  - CRUD khách hàng
  - Theo dõi công nợ

- ✅ **Tạo đơn hàng** (`/admin/orders`)
  - Chọn khách hàng
  - Thêm nhiều sản phẩm
  - Tự động điền giá
  - Tính tổng tiền tự động
  - **Kiểm tra NVL tự động** 🔥
    - Hiển thị: Cần bao nhiêu, Tồn bao nhiêu, Thiếu bao nhiêu
    - Màu xanh (đủ) / Màu đỏ (thiếu)
  - Tự động tạo 4 công đoạn sản xuất

- ✅ **Chi tiết đơn hàng** (`/admin/orders/[id]`)
  - Xem đầy đủ thông tin
  - Tiến độ sản xuất (4 công đoạn)
  - **Xuất PDF đơn hàng** 📄
    - Format chuẩn A4
    - Bằng chữ (tự động chuyển đổi)
    - Chữ ký 3 bên

---

## 🔄 ĐANG LÀM / SẮP LÀM (20-25%)

### 4. Quy trình Sản xuất
- ⏳ Giao diện theo dõi tiến độ
- ⏳ Cập nhật trạng thái công đoạn (button)
- ⏳ Báo cáo tiến độ cho khách

### 5. Quản lý Kho
- ⏳ Kho NVL: Xuất/Nhập/Tồn
- ⏳ Đặt mua NVL từ NCC
- ⏳ Kho Thành phẩm

---

## ❌ CHƯA LÀM (40-45%)

### 6. Dashboard & Báo cáo Xưởng
- ❌ Dashboard: Tổng quan, biểu đồ
- ❌ Báo cáo: Doanh thu, Công nợ, Hiệu suất

### 7. Quản lý Cửa hàng
- ❌ Dashboard Cửa hàng
- ❌ POS - Bán hàng
- ❌ Kho cửa hàng
- ❌ Thu chi

### 8. Hệ thống bổ trợ
- ❌ Quản lý Nhà cung cấp
- ❌ Tài chính (Sổ quỹ)
- ❌ Chấm công & Nhân sự

---

## 🎨 GIAO DIỆN

### Layout:
- **Sidebar trái:** Menu phân cấp, thu gọn được
- **Breadcrumb trên:** Đường dẫn tự động
- **Content:** Form xổ ra phía trên (không popup)
- **Màu chữ:** Đen đậm (#111827) - dễ đọc
- **Icon:** Đơn sắc, đơn giản (⚙, ◉, ◈, ▪, ·)

### Form:
- Hiển thị phía trên danh sách
- Border xanh nổi bật
- Nút đóng (×) góc phải
- Validation đầy đủ

---

## 🔑 TÍNH NĂNG NỔI BẬT

### 1. Kiểm tra NVL tự động ⭐⭐⭐
**Vị trí:** Trang tạo đơn hàng

**Cách hoạt động:**
1. Thêm sản phẩm vào đơn hàng
2. Click "🔍 Kiểm tra NVL"
3. Hệ thống tự động:
   - Lấy định mức NVL của từng sản phẩm
   - Tính tổng NVL cần thiết (số lượng × định mức)
   - So sánh với tồn kho hiện tại
   - Hiển thị kết quả:
     - ✅ Màu xanh: Đủ NVL
     - ❌ Màu đỏ: Thiếu NVL (hiển thị số lượng thiếu)

**API:** `POST /api/orders/check-materials`

### 2. Xuất PDF đơn hàng 📄
**Vị trí:** Trang chi tiết đơn hàng

**Tính năng:**
- Format chuẩn A4
- Header: Logo, địa chỉ công ty
- Thông tin KH đầy đủ
- Bảng sản phẩm chi tiết
- Tổng tiền + Bằng chữ (tự động)
- Chữ ký 3 bên
- Tự động mở dialog in

### 3. Tự động tạo công đoạn sản xuất
Khi tạo đơn hàng, tự động tạo 4 bản ghi trong `production_process`:
1. CUT - Cắt
2. SEW - May
3. FINISH - Hoàn thiện
4. QC - Kiểm tra

---

## 📝 CODE CONVENTIONS

### API Routes:
```typescript
// GET - Lấy danh sách
export async function GET() {
  const result = await pool.query('SELECT * FROM table');
  return NextResponse.json({ success: true, data: result.rows });
}

// POST - Tạo mới
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Validation
  // Insert
  return NextResponse.json({ success: true, data: result.rows[0] });
}

// PUT - Cập nhật (Dynamic route)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Update
}

// DELETE - Xóa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Delete
}
```

### Components:
- Dùng `'use client'` cho tất cả trang admin
- State management: `useState`, `useEffect`
- Form validation: HTML5 + custom
- Error handling: try-catch + user-friendly messages

### Database:
- Dùng `pg` (node-postgres)
- Connection pool: `lib/db.ts`
- Parameterized queries (tránh SQL injection)
- Transaction cho operations phức tạp

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### 1. Lỗi "invalid input syntax for type uuid"
**Nguyên nhân:** Truyền chuỗi rỗng `""` cho cột UUID

**Giải pháp:**
```typescript
const storeIdValue = store_id && store_id.trim() !== '' ? store_id : null;
```

### 2. Lỗi "Property 'status' does not exist"
**Nguyên nhân:** Interface thiếu property

**Giải pháp:** Thêm vào interface:
```typescript
interface Product {
  // ...
  status: string;
}
```

### 3. Lỗi "params is Promise" (Next.js 15+)
**Nguyên nhân:** Next.js 15+ params là Promise

**Giải pháp:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Await params
}
```

### 4. Chữ trong input bị mờ
**Nguyên nhân:** Dark mode tự động

**Giải pháp:** Thêm vào `globals.css`:
```css
input, select, textarea {
  color: #111827 !important;
  background-color: #ffffff !important;
}
```

---

## 🚀 ROADMAP TIẾP THEO

### Tuần 1-2: Core Features (Ưu tiên cao)
1. **Quy trình Sản xuất** (3 ngày)
   - Giao diện theo dõi tiến độ
   - Cập nhật trạng thái công đoạn
   - Báo cáo tiến độ

2. **Quản lý Kho NVL** (2 ngày)
   - Xuất kho cho sản xuất
   - Nhập kho từ NCC
   - Đặt mua NVL

3. **Dashboard Xưởng** (2 ngày)
   - Tổng quan đơn hàng
   - Biểu đồ hiệu suất
   - Cảnh báo

### Tuần 3-4: Cửa hàng
4. **POS Bán hàng** (3 ngày)
5. **Kho Cửa hàng** (2 ngày)
6. **Dashboard Cửa hàng** (2 ngày)

### Tuần 5-6: Hoàn thiện
7. **Báo cáo** (3 ngày)
8. **Tài chính** (2 ngày)
9. **Chấm công** (2 ngày)

---

## 📞 HỖ TRỢ

### Tài liệu tham khảo:
- Next.js: https://nextjs.org/docs
- PostgreSQL: https://www.postgresql.org/docs/
- Tailwind CSS: https://tailwindcss.com/docs

### File quan trọng:
- `HuongDan/MoTa.txt` - Mô tả chi tiết 17 modules
- `HuongDan/sample_sql_fromdatabase.sql` - Schema database
- `.env.local` - Cấu hình database

---

## 📊 TIẾN ĐỘ HIỆN TẠI: 35-40%

**Đã làm:** 6/17 modules
**Đang làm:** 2/17 modules  
**Chưa làm:** 9/17 modules

**Thời gian ước tính hoàn thành:**
- 1 dev: 3-4 tuần
- 2 dev: 2-3 tuần

---

**Cập nhật lần cuối:** 2025-01-17
**Version:** 1.0.0
