# 📚 FE Student - Tổng Quan Chi Tiết

## 1. Giới Thiệu Dự Án

**FE Student** là một ứng dụng web frontend học sinh được xây dựng bằng **React 19** + **Vite 7**, cho phép học sinh:
- Xem danh sách các khối lớp, môn học và bộ đề thi
- Xem chi tiết các đề thi trong một bộ đề
- Làm bài thi trực tuyến với hệ thống timer
- Nộp bài và xem lại kết quả
- Xem lịch sử thi và dashboard thành tích
- Quản lý hồ sơ cá nhân
- Tải xuống chứng chỉ (PDF)

Dự án hiện đang ở giai đoạn **chuyển tiếp từ mock data sang API thực** - một số phần vẫn sử dụng dữ liệu giả lập trong khi phần khác gọi API backend.

---

## 2. Tech Stack

### Dependencies chính:
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.1",
  "vite": "^7.3.1",
  "tailwindcss": "^4.2.4",
  "@tailwindcss/vite": "^4.2.1",
  "lucide-react": "^0.575.0",
  "recharts": "^3.7.0",
  "react-hot-toast": "^2.6.0",
  "react-toastify": "^11.1.0",
  "html2canvas": "^1.4.1",
  "jspdf": "^4.2.1"
}
```

### Dependencies chưa sử dụng:
- `@reduxjs/toolkit` + `react-redux` (đã cài nhưng chưa dùng)

### Build & Deploy:
- Vite cho development & build
- ESLint cho code quality
- Deploy script có sẵn (bash script)

---

## 3. Cấu Trúc Thư Mục

```
src/
├── api/                      # Tất cả API calls
│   ├── client.js            # HTTP client & URL builders
│   ├── endpoint.js          # API endpoints constants
│   ├── auth.js              # Authentication APIs
│   ├── student.js           # Student profile APIs
│   ├── attempt.js           # Exam attempt APIs
│   └── grade.js             # Grade/Subject APIs
│
├── components/              # Reusable React components
│   ├── ProtectedRoute.jsx   # Route wrapper cho protected pages
│   └── layout/
│       └── Header.jsx       # Main navigation header
│   └── profile/
│       ├── ProfileCard.jsx          # User info card
│       ├── ProfileInfo.jsx          # Editable user info
│       ├── ProfileStats.jsx         # User statistics
│       ├── ProfileCertificate.jsx   # Certificate list
│       ├── Certificate.jsx          # Certificate display
│       └── CertificateView.jsx      # Full certificate view
│
├── pages/                   # Page components (routes)
│   ├── Home.jsx             # Trang chủ - hiển thị danh sách khối
│   ├── Login.jsx            # Đăng nhập
│   ├── ExamList.jsx         # Danh sách đề theo khối/môn
│   ├── ExamDetail.jsx       # Chi tiết bộ đề + danh sách câu hỏi
│   ├── ExamDoing.jsx        # Làm bài thi
│   ├── ExamDoingEnglish.jsx # Làm bài thi tiếng Anh (riêng)
│   ├── ExamReview.jsx       # Xem lại kết quả thi
│   ├── ExamDashboard.jsx    # Dashboard thành tích & lịch sử
│   └── Profile.jsx          # Hồ sơ cá nhân
│
├── datas/                   # Mock data
│   ├── mockExamData.js      # Mẫu dữ liệu bài thi
│   └── mockEnglishExam.js   # Mẫu dữ liệu thi tiếng Anh
│
├── assets/                  # Static assets
│   ├── kido.jpg
│   ├── avatar.png
│   ├── cancle.png
│   ├── menu_bar.png
│   ├── bell.mp3
│   └── certificates/
│
├── App.jsx                  # Main app router
├── main.jsx                 # Entry point
└── index.css                # Global styles
```

---

## 4. Entry Point & Routing

### `src/main.jsx`
```jsx
- Mounts React app vào DOM element #root
- Wraps app trong BrowserRouter (React Router)
```

### `src/App.jsx`
Hiện tại file này bị comment hết. Khi uncomment, nó sẽ render:
- `<Toaster />` - toast notifications (react-hot-toast)
- `<Header />` - navigation header
- `<Routes>` - các page routes

### Routes hiện có (trong App.jsx):
```
✅ /                    → Home (list khối lớp)
✅ /login               → Login
✅ /exam-set/:examSetId → ExamList (danh sách đề)
✅ /exam-set-detail/:examSetId → ExamDetail (chi tiết bộ đề)
✅ /exam/:examSetId/:id → ExamDetail (protected)
✅ /exam-doing/:id      → ExamDoing (làm bài - protected)
✅ /exam-doing-english  → ExamDoingEnglish (tiếng Anh - protected)
✅ /exam-review/:id     → ExamReview (xem kết quả - protected)
✅ /exam-dashboard      → ExamDashboard (dashboard - protected)
✅ /profile-user        → Profile (hồ sơ - protected)
✅ /certificate-view    → CertificateView
✅ /notifications       → Placeholder
⚠️  ❌ Duplicate: /exam-review/:attemptId → ExamDoing
```

---

## 5. API Configuration

### `src/api/client.js`
Quản lý HTTP requests:
```javascript
BASE_URL         // từ env variables (VITE_API_URL)
API_PREFIX       // từ env variables (VITE_API_PREFIX)
API_BASE_URL     // combined URL
buildApiUrl()    // build endpoint URLs
buildAssetUrl()  // build asset URLs (images, etc)
fetch()          // wrapper around window.fetch, tự động thêm Authorization header
parseResponse()  // parse response, handle JSON vs text, throw errors
apiRequest()     // high-level API call function
```

### `src/api/endpoint.js`
Định nghĩa tất cả API endpoints:
```javascript
AUTH.LOGIN_STUDENT              // POST /auth/login/student
GRADE.GET_ALL                   // GET /grade?isGetAllDetail=true
EXAM_SET.DETAIL(id)             // GET /exam-set/{id}
EXAM_SET.GET_BY_SUBJECT(id)     // GET /exam-set?subjectId={id}
STUDENT.DETAIL(id)              // GET /users/{id}
STUDENT.UPDATE_AVATAR(id)       // PUT /users/{id}
STUDENT.UPDATE_PROFILE(id)      // PUT /users/{id}
STUDENT.ME                      // GET /users/me
STUDENT.UPLOAD_AVATAR           // POST /upload/single
ATTEMPT.START                   // POST /attempt/start
ATTEMPT.SUBMIT(attemptId)       // POST /attempt/{attemptId}/end
ATTEMPT.REVIEW(attemptId)       // GET /attempt/{attemptId}/review
ATTEMPT.EXAM_HISTORY(from, to)  // GET /attempt/exam-history
ATTEMPT.LIST(...)               // GET /attempt?questionBankId=...
ATTEMPT.MY_STATISTICS           // GET /attempt/my-statistics
```

---

## 6. API Modules

### `src/api/auth.js`
```javascript
loginStudent({ username, password, deviceId })
  → POST /auth/login/student
  ← returns { accessToken, userId, userType }
```
Được gọi trong: `Login.jsx`

### `src/api/student.js`
```javascript
uploadAvatar(file)                    // file upload
updateUserAvatar(userId, userData)    // PUT avatar
updateStudentProfile(userId, data)    // PUT profile
getUserById(userId)                   // GET user detail
getCurrentUser()                      // GET /users/me
```
Được gọi trong: `Profile.jsx`, `Header.jsx`

### `src/api/attempt.js`
```javascript
startAttempt(data)          // POST /attempt/start
submitAttempt(id, answers)  // POST /attempt/{id}/end
getAttemptReview(id)        // GET /attempt/{id}/review
getExamHistory(from, to)    // GET exam history
getAttemptList(...)         // GET list attempts
getMyStatistics()           // GET statistics
```
Được gọi trong: `ExamDoing.jsx`, `ExamDetail.jsx`, `ExamReview.jsx`, `ExamDashboard.jsx`

### `src/api/grade.js`
```javascript
getGrades()                 // GET /grade?isGetAllDetail=true
getExamSetDetail(id)        // GET /exam-set/{id}
```
Được gọi trong: `Home.jsx`, `Header.jsx`

---

## 7. Core Components

### `src/components/ProtectedRoute.jsx`
Simple wrapper để bảo vệ routes:
- Kiểm tra `localStorage.accessToken`
- Nếu không có token → redirect về `/login`
- Nếu có → render children

### `src/components/layout/Header.jsx`
Navigation header với:
- Logo KIDO
- Menu mega dropdown cho:
  - **Giáo dục phổ thông**: Lớp 1-12, các môn học
  - **Ngoại ngữ**: Tiếng Anh, IELTS, TOEIC
- User dropdown (logout, profile)
- Fetch data từ API (getGrades)
- State management cho menu expansion
- localStorage để lưu selected grades/subjects

### `src/components/profile/*`
Các component cho trang Profile:
- **ProfileCard**: Hiển thị avatar, tên học sinh, lớp
- **ProfileInfo**: Form chỉnh sửa thông tin (tên, ngày sinh, giới tính, email, etc)
- **ProfileStats**: Thống kê thi đấu
- **ProfileCertificate**: Danh sách chứng chỉ
- **CertificateView**: Hiển thị certificate full screen
- **Certificate**: Render certificate (HTML element để export PDF)

---

## 8. Pages (Routes)

### `src/pages/Home.jsx`
- Fetch danh sách khối lớp từ API: `getGrades()`
- Hiển thị grid các khối lớp
- Click khối lớp → navigate tới `/exam-set/{examSetId}` với state
- Có image loading logic (lazy load, placeholder)
- **Status**: Gọi API thực

### `src/pages/Login.jsx`
- Form đăng nhập (username, password)
- Gọi `loginStudent()` API
- Lưu token vào `localStorage.accessToken`
- Lưu userId + fullName + user data
- Redirect về `/`
- **Status**: Phần lớn code bị comment

### `src/pages/ExamList.jsx`
- Nhận exam set từ location.state
- Hiển thị danh sách đề thi trong bộ đề
- Search & pagination (10 items/page)
- Click đề → navigate tới `/exam-set-detail/{examSetId}`
- Lưu exam data vào localStorage
- **Status**: Chỉ dùng mock data từ state, không gọi API

### `src/pages/ExamDetail.jsx`
- Fetch question banks từ API: `getExamSetDetail(examSetId)`
- Hiển thị danh sách câu hỏi bank
- Fetch attempt history (chưa hoàn thành)
- Click "Làm bài" → `startAttempt()` → navigate `/exam-doing/{questionBankId}`
- Gọi API thực để start attempt
- **Status**: API call + start exam flow

### `src/pages/ExamDoing.jsx`
- **Timer**: Đếm ngược dựa trên `mockExamData.duration` (35 phút)
- **Questions**: Hiển thị từ `location.state.questions`
- **Answer selection**: Click option → lưu vào state
- **Submit modal**: Xác nhận trước khi submit
- **Time up modal**: Tự động submit khi hết giờ
- Gọi `submitAttempt(attemptId, answers)` → navigate `/exam-review/{attemptId}`
- **Status**: Gọi API submit, timer hoạt động

### `src/pages/ExamDoingEnglish.jsx`
- Tương tự ExamDoing nhưng cho bài thi tiếng Anh
- File riêng

### `src/pages/ExamReview.jsx`
- Fetch kết quả từ API: `getAttemptReview(attemptId)`
- Hiển thị các câu hỏi + đáp án được chọn + đáp án đúng
- Thống kê: ✓ (đúng), ✗ (sai), - (chưa làm)
- Nút "Làm lại" → gọi `startAttempt()` lại
- Render hình ảnh trong content (IMAGE contentType)
- **Status**: Gọi API thực

### `src/pages/ExamDashboard.jsx`
- **Date filter**: Chọn từ ngày → đến ngày
- Fetch: `getExamHistory(fromDate, toDate)` + `getMyStatistics()`
- **Left table**: Danh sách bài thi theo ngày, số lần làm
- **Right chart**: Recharts LineChart - score theo ngày
- **Pagination**: 10 items/page
- Click "Xem" → navigate `/exam/{examSetId}/{questionBankId}`
- **Status**: Gọi API, có chart

### `src/pages/Profile.jsx`
- Fetch user: `getCurrentUser()` → map dữ liệu
- Hiển thị ProfileCard, ProfileInfo, ProfileStats, ProfileCertificate
- Có toggle edit mode
- Lưu userId, user data vào localStorage
- Certificate download: `html2canvas` → `jsPDF`
- **Status**: Gọi API, complex component interactions

---

## 9. Data Flow & State Management

### Authentication Flow
```
Login.jsx
  ↓ (user submits form)
loginStudent() → API
  ↓ (success)
localStorage: accessToken, userId, fullName, user
  ↓
navigate("/")
  ↓
ProtectedRoute checks: localStorage.accessToken
```

### Exam Flow
```
Home.jsx
  ↓ (click khối lớp)
ExamList.jsx
  ↓ (click đề)
ExamDetail.jsx (fetch question banks from API)
  ↓ (click "Làm bài")
startAttempt() → API (POST /attempt/start)
  ↓ (returns attemptId + questions)
ExamDoing.jsx (timer + answer + submit)
  ↓ (click submit)
submitAttempt() → API (POST /attempt/{id}/end)
  ↓ (success)
navigate("/exam-review/{id}")
  ↓
ExamReview.jsx (fetch & display results)
```

### State Management:
- **No Redux** (despite having it installed)
- Dùng React hooks: `useState`, `useEffect`, `useRef`
- localStorage cho user session + exam data

---

## 10. Key Features & Implementation Details

### 🔐 Authentication
- Login form → API call
- Token lưu trong localStorage
- ProtectedRoute wrapper
- Auto-redirect nếu hết token (chưa implement)

### ⏱️ Timer (ExamDoing)
- Countdown từ mock duration (35 phút)
- 1 second interval
- Format: MM:SS
- Auto-submit khi hết giờ
- Visual progress bar (timeProgress)

### 📝 Answer Management
- Object map: `{ questionId: "orderNo+Label" }`
- Ví dụ: `{ 1: "1A", 2: "2B" }`
- Convert to array khi submit: `Object.values(answers)`

### 📊 Dashboard & Statistics
- Chart: Recharts LineChart
- Table: pagination + filtering
- Date range filter

### 📸 Image Handling
- `buildAssetUrl()`: Xử lý URLs
- Lazy loading + placeholder
- Error handling
- Render inline trong Q&A

### 📥 File Upload
- Avatar upload: FormData API
- html2canvas: Capture certificate HTML
- jsPDF: Generate PDF từ canvas

### 🎨 UI/UX
- Tailwind CSS 4
- Lucide icons (Clock, Heart, ChevronDown, ArrowLeft, etc)
- Toast notifications (react-hot-toast)
- Modals (custom built)
- Responsive design

### 🇻🇳 Localization
- Vietnamese UI text
- Viết hardcoded trong components (không i18n)
- Date formatting: toLocaleDateString('vi-VN')

---

## 11. Known Issues & TODOs

### ❌ Issues:
1. **App.jsx bị comment** - Router hiện không hoạt động
2. **Redux installed but unused** - overhead dependency
3. **Duplicate routes**: `/exam-review/:id` + `/exam-review/:attemptId`
4. **Login code bị comment** - Login không hoạt động
5. **Token expiry check** - Không auto-logout khi token hết
6. **Mixed data sources** - Vừa API, vừa localStorage, vừa mock data
7. **No error boundaries** - Crash toàn trang nếu API fail
8. **Missing i18n** - Hardcoded Vietnamese text

### 📋 TODOs (dựa trên comments trong code):
1. Enable App.jsx routes (currently commented)
2. Fix Login flow
3. Handle token expiry properly
4. Remove Redux if not needed
5. Consolidate data fetching (API vs localStorage)
6. Add error boundaries
7. Add i18n support
8. Fix duplicate routes
9. Implement ExamDoingEnglish properly
10. Add loading skeletons instead of text

---

## 12. Environment Variables

Cần thiết lập (trong `.env`):
```bash
VITE_API_URL=https://api.example.com        # Base URL
VITE_API_PREFIX=/api/v1                     # API prefix
```

Auto-load bởi Vite (via `import.meta.env`)

---

## 13. Build & Deployment

### Development:
```bash
npm run dev          # Start dev server
npm run lint         # Check code quality
npm run preview      # Preview build
```

### Production:
```bash
npm run build        # Build với Vite
bash ./deploy.sh     # Deploy script
```

---

## 14. Tóm Tắt Công Nghệ

| Aspect | Technology |
|--------|-----------|
| Framework | React 19 + Vite 7 |
| Routing | React Router v7 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Charts | Recharts |
| Notifications | react-hot-toast |
| PDF Export | jsPDF + html2canvas |
| State | React hooks (useState, useEffect) |
| HTTP | Fetch API |
| Build | Vite |
| Linting | ESLint |
| **NOT USED** | Redux (installed but unused) |

---

## 15. File Sizes & Performance Notes

- Lightweight: Không có heavy libraries
- Fast HMR: Vite dev server
- Lazy loading: Images với loading placeholder
- No code splitting implemented yet
- CSS: Tailwind + PurgeCSS (built-in Vite)

---

## 📌 Lộ Trình Phát Triển Tiếp Theo

1. ✅ **Uncomment App.jsx** → Enable routing
2. ✅ **Fix Login** → Enable authentication
3. ✅ **Test API integration** → Ensure all endpoints work
4. ✅ **Handle errors** → Add error boundaries & user feedback
5. ✅ **Token management** → Auto-logout on expiry
6. ✅ **Remove Redux** → Clean up dependencies
7. ✅ **Add tests** → Unit + integration tests
8. ✅ **Optimize** → Code splitting, lazy routes
9. ✅ **i18n** → Multi-language support
10. ✅ **Mobile optimization** → Responsive fixes

---

**Generated**: May 2026
**Status**: Development (Mixed API + Mock data)
**Last Updated**: Current
