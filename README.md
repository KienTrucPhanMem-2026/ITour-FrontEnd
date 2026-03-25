# 🌍 Du Lịch Việt - Website Du Lịch Next.js 

Một website du lịch Việt Nam hiện đại được xây dựng bằng **Next.js 14** + **Tailwind CSS** với dữ liệu mock, không cần backend API để test giao diện.

## 🎯 Chức Năng

### 📱 Trang Chủ
- Hiển thị danh sách tour du lịch nổi bật
- Các lợi ích của công ty du lịch
- Panel tìm kiếm tour nhanh

### 🗺️ Danh Sách Tours
- Lọc tour theo loại (biển, núi, thành phố, văn hóa)
- Sắp xếp theo giá, đánh giá
- Hiển thị giá, rating, từng tour

### 📖 Chi Tiết Tour
- Ảnh chất lượng cao (carousel)
- Mô tả đầy đủ, lịch trình chi tiết
- Danh sách bao gồm/không bao gồm trong tour
- Form đặt tour (chọn ngày, số người, tính tiền)

### 🔐 Đăng Nhập (Mock)
- Thử đăng nhập với:
  - Email: `demo@example.com` / Mật khẩu: `123456`
  - Email: `user@example.com` / Mật khẩu: `123456`
- Lưu trữ dữ liệu xác thực trên localStorage

### 📊 Dashboard (Sau Đăng Nhập)
- Tổng quan đơn đặt tour
- Danh sách đơn đặt với trạng thái
- Thông tin cá nhân người dùng
- Nút đăng xuất

## 🚀 Cấu Trúc Project

```
du-lich-viet/
├── app/
│   ├── layout.tsx                 # Layout chính
│   ├── page.tsx                   # Trang chủ
│   ├── globals.css               # Tailwind CSS global
│   ├── login/
│   │   └── page.tsx              # Trang đăng nhập
│   ├── tours/
│   │   ├── page.tsx              # Danh sách tours
│   │   └── [slug]/
│   │       └── page.tsx          # Chi tiết tour
│   └── dashboard/
│       └── page.tsx              # Dashboard người dùng
├── components/
│   ├── LoginPage.tsx             # Component đăng nhập
│   └── TourCard.tsx              # Component card tour
├── lib/
│   └── mockData.ts               # Dữ liệu mock (tours, users, bookings)
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
└── .gitignore
```

## 🔧 Dữ Liệu Mock

### Tài Khoản Test
```javascript
// Tài khoản 1
Email: demo@example.com
Mật khẩu: 123456

// Tài khoản 2
Email: user@example.com
Mật khẩu: 123456
```

### Tours Mẫu
- Hà Nội - Hạ Long 3N2Đ (4.5M₫)
- Sapa - Fansipan 2N1Đ (3.2M₫)
- Đà Nẵng - Hội An 3N2Đ (3.8M₫)
- TP. Hồ Chí Minh - Cần Thơ 2N1Đ (2.5M₫)

## 📦 Cài Đặt & Chạy

### 1. Clone Project
```bash
git clone <your-repo-url>
cd du-lich-viet
```

### 2. Cài Đặt Dependencies
```bash
npm install
# hoặc
yarn install
```

### 3. Chạy Development Server
```bash
npm run dev
# hoặc
yarn dev
```

Truy cập: **http://localhost:3000**

### 4. Build Production
```bash
npm run build
npm start
```

## 🎨 Thiết Kế

### Màu Sắc
- **Xanh chính**: `#0EA5E9` (Primary)
- **Xanh nhạt**: `#38BDF8` (Secondary)
- **Nền**: `#F5F8F8` (Background)
- **Trắng**: `#FFFFFF` (Card)

### Font
- Hệ thống font mặc định: Inter, system-ui

## 🔄 Flow Ứng Dụng

```
Trang Chủ 
   ↓
Danh Sách Tours ← Người dùng có thể tìm kiếm, lọc
   ↓
Chi Tiết Tour → Xem thông tin, đặt tour
   ↓
Login (để tiếp tục đặt)
   ↓
Dashboard → Quản lý đơn đặt, thông tin cá nhân
```

## 📝 Tính Năng Nổi Bật

✅ **Responsive Design** - Hoạt động trên mobile, tablet, desktop
✅ **Mock Data** - Không cần backend để test
✅ **TypeScript** - Type-safe code
✅ **Tailwind CSS** - Styling hiện đại, nhanh
✅ **Next.js 14** - App Router, SSR/SSG tối ưu
✅ **localStorage** - Lưu trữ xác thực tại client
✅ **Dynamic Routing** - Chi tiết tour theo slug

## 🔗 Routes Chính

| Route | Mô Tả |
|-------|-------|
| `/` | Trang chủ |
| `/tours` | Danh sách tours |
| `/tours/[slug]` | Chi tiết tour (vd: `/tours/hanoi-halong-3d2n`) |
| `/login` | Trang đăng nhập |
| `/dashboard` | Dashboard người dùng (cần đăng nhập) |

## 🚧 Phát Triển Tiếp Theo

- [ ] Kết nối API Spring Boot thực
- [ ] Xác thực JWT token
- [ ] Payment integration
- [ ] Email notification
- [ ] Review & ratings
- [ ] Favorites / Wishlist
- [ ] Advanced search
- [ ] Admin dashboard

## 📞 Liên Hệ Hỗ Trợ

- Email: support@dulichviet.com
- Hotline: 0123 456 789
- Website: dulichviet.com

## 📄 License

MIT - Copyright 2026 Du Lịch Việt

---

**Tạo lúc**: March 2026
**Phiên bản**: 0.1.0
