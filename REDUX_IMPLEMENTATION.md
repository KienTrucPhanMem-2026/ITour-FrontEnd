# Redux Toolkit Implementation Guide

## 📋 Cấu Trúc Dự Án

```
lib/
└── store/
    ├── store.ts           # Redux store configuration
    ├── hooks.ts           # Pre-typed Redux hooks
    └── slices/
        └── counterSlice.ts # Counter state slice
```

## 🚀 Tệp Được Tạo

### 1. **lib/store/store.ts** - Redux Store Configuration
Cấu hình store chính sử dụng `configureStore` từ Redux Toolkit:
- Thiết lập reducers
- Export RootState và AppDispatch types cho TypeScript support

### 2. **lib/store/slices/counterSlice.ts** - Counter Slice
Định nghĩa state slice cho counter:
- **State**: `{ value: number }`
- **Actions**:
  - `increment`: Tăng giá trị lên 1
  - `decrement`: Giảm giá trị đi 1
  - `incrementByAmount`: Tăng với số lượng tùy chỉnh
  - `reset`: Đưa về giá trị ban đầu (1)

### 3. **lib/store/hooks.ts** - Pre-typed Hooks
Export các hooks đã được type:
- `useAppDispatch`: Thay thế `useDispatch` với AppDispatch type
- `useAppSelector`: Thay thế `useSelector` với RootState type

### 4. **app/providers.tsx** - Redux Provider
Wrapper component để cung cấp Redux store cho toàn app:
- Sử dụng `<Provider>` từ `react-redux`
- Wrap children components với Redux store

### 5. **components/ComA.tsx** - Component A
Hiển thị và cập nhật counter state:
- Sử dụng `useAppSelector` để lấy state
- Sử dụng `useAppDispatch` để dispatch actions

### 6. **components/ComB.tsx** - Component B
Tương tự Component A, cùng quản lý state từ Redux

### 7. **app/redux-demo/page.tsx** - Demo Page
Trang demo đầy đủ hiển thị:
- Parent component (App) kiểm soát state
- Hai child components (Com A, Com B) chia sẻ state
- Thông tin chi tiết về implementation

### 8. **app/layout.tsx** - Updated Root Layout
Được cập nhật để:
- Import `Providers` component
- Wrap children với `<Providers>` để cung cấp Redux store

## 🔄 Cách Hoạt Động

```
┌─────────────────────────────────────┐
│      Redux Store (counterSlice)      │
│      { counter: { value: 1 } }      │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    ┌───▼───┐     ┌───▼───┐
    │ Com A │     │ Com B │
    │ value │     │ value │
    │   1   │     │   1   │
    └───────┘     └───────┘
        │             │
        └──────┬──────┘
             App
```

## 💻 Cách Sử Dụng

### Lấy State
```tsx
import { useAppSelector } from "@/lib/store/hooks";

const count = useAppSelector((state) => state.counter.value);
```

### Dispatch Action
```tsx
import { useAppDispatch } from "@/lib/store/hooks";
import { increment, decrement } from "@/lib/store/slices/counterSlice";

const dispatch = useAppDispatch();

dispatch(increment()); // Tăng giá trị
dispatch(decrement()); // Giảm giá trị
```

## 🧪 Testing Demo

Truy cập: `http://localhost:3000/redux-demo`

Bạn sẽ thấy:
1. **App Component**: Hiển thị counter và 3 nút (Increment, Decrement, Reset)
2. **Component A**: Hiển thị counter và 2 nút (Increment, Decrement)
3. **Component B**: Hiển thị counter và 2 nút (Increment, Decrement)

Tất cả components đều chia sẻ **cùng 1 state** từ Redux store. Thay đổi từ component nào cũng được phản ánh ngay trên các components khác!

## 🎯 Lợi Ích Redux Toolkit

✅ **Centralized State Management**: Toàn bộ state tập trung ở một nơi
✅ **Predictable Updates**: Sử dụng pure functions (reducers)
✅ **TypeScript Support**: Full type safety
✅ **Built-in Immer**: Cho phép mutate state một cách an toàn
✅ **Dev Tools Integration**: Redux DevTools support
✅ **Simplified Boilerplate**: Redux Toolkit giảm code cần viết

## 📦 Dependencies

```json
{
  "@reduxjs/toolkit": "latest",
  "react-redux": "latest"
}
```

## 🚁 Kếp Tiếp

Để mở rộng:

1. **Add More Slices**: Tạo thêm slices cho features khác
   ```tsx
   // lib/store/slices/userSlice.ts
   // lib/store/slices/toursSlice.ts
   ```

2. **Add Async Thunks**: Để xử lý API calls
   ```tsx
   createAsyncThunk('counter/fetchNumber', async () => {
     // API call
   })
   ```

3. **Configure DevTools**: Sử dụng Redux DevTools Chrome extension
