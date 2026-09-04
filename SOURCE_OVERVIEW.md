# SOURCE OVERVIEW — ICHI SKILL Student LMS

> **Project**: `fe_kidostudent` — Frontend ứng dụng thi trắc nghiệm dành cho học sinh  
> **Tech Stack**: React 19 + Vite 7 + TailwindCSS 4 + React Router v7  
> **Backend API**: `be.kidostudent.kidoedu.vn` (REST) + Socket.IO (realtime)

---

## 1. Tổng quan kiến trúc

```
FE_student/
├── index.html              ← HTML entry (title: ICHI SKILL STUDENT)
├── vite.config.js          ← Vite + TailwindCSS plugin, dev proxy /api → BE
├── package.json            ← Dependencies & scripts
├── .env                    ← Environment variables (API URL, Socket URL, Asset URL)
├── deploy.sh               ← Bash deploy script
└── src/
    ├── main.jsx            ← React entry: BrowserRouter → App
    ├── App.jsx             ← Routes definition + Header conditional rendering
    ├── index.css           ← TailwindCSS import + safe-area utilities + print styles
    ├── api/                ← API layer (HTTP client, endpoints, service modules)
    ├── components/         ← Reusable UI components
    ├── pages/              ← Page-level components (14 pages)
    ├── config/             ← Constants + Certificate template configs
    ├── utils/              ← Utility functions
    ├── datas/              ← Mock/static data files
    └── assets/             ← Images, audio, certificates
```

---

## 2. Environment & Configuration

### Environment Variables (`.env`)

| Variable               | Mô tả                                      | Ví dụ                                    |
|------------------------|---------------------------------------------|------------------------------------------|
| `VITE_API_BASE_URL`    | Base URL cho API backend                     | `http://160.250.132.143:3001`            |
| `VITE_ASSET_BASE_URL`  | Base URL cho static assets (ảnh, audio)      | `https://be.kidostudent.kidoedu.vn`      |
| `VITE_SOCKET_URL`      | URL cho Socket.IO connection                 | `https://be.kidostudent.kidoedu.vn`      |
| `VITE_API_PREFIX`      | Prefix cho API path (trống khi dev)          | `/api` (production)                      |

### Vite Config (`vite.config.js`)

- Plugin: `@tailwindcss/vite`
- Dev proxy: `/api` → `https://be.kidostudent.kidoedu.vn` (rewrite prefix)
- **Lưu ý**: Không sử dụng `@vitejs/plugin-react` trong config (có trong devDependencies nhưng chưa khai báo)

---

## 3. API Layer (`src/api/`)

### 3.1. `client.js` — HTTP Client Core

| Export              | Mô tả                                                                 |
|---------------------|------------------------------------------------------------------------|
| `BASE_URL`          | Normalized base URL từ env                                            |
| `ASSET_BASE_URL`    | URL riêng cho assets (ảnh, file)                                      |
| `API_BASE_URL`      | `BASE_URL + API_PREFIX`                                               |
| `buildApiUrl(path)` | Tạo full API URL                                                      |
| `buildAssetUrl(path)` | Tạo full asset URL (xử lý absolute URL + relative path)            |
| `fetch(url, options, token)` | Wrapper `window.fetch` tự thêm `Authorization: Bearer` header |
| `parseResponse(res)` | Parse JSON/text response, throw Error nếu `!response.ok`            |
| `apiRequest(path, options)` | High-level: build URL + fetch + parse, hỗ trợ `skipAuth`      |

**Auth pattern**: Token lưu `localStorage.getItem("accessToken")`, tự đính kèm mọi request trừ khi `skipAuth: true` hoặc token override = `null`.

### 3.2. `endpoint.js` — API Endpoints Registry

```
API.AUTH.LOGIN_STUDENT          POST  /auth/login/student
API.AUTH.LOGIN_TEACHER          POST  /auth/login/teacher
API.GRADE.GET_ALL               GET   /grade?isGetAllDetail=true
API.EXAM_SET.DETAIL(id)         GET   /exam-set/:id
API.EXAM_SET.GET_BY_SUBJECT(id) GET   /exam-set?subjectId=:id
API.STUDENT.UPLOAD_AVATAR       POST  /upload/single
API.STUDENT.DETAIL(id)          GET   /users/:id
API.STUDENT.UPDATE_AVATAR(id)   PUT   /users/:id
API.STUDENT.ME                  GET   /users/me
API.STUDENT.CERTIFICATES        GET   /users/me/certificates
API.ATTEMPT.START               POST  /attempt/start
API.ATTEMPT.START_WITH_GROUP    POST  /attempt/start-with-group
API.ATTEMPT.SUBMIT(id)          POST  /attempt/:id/end
API.ATTEMPT.REVIEW(id)          GET   /attempt/:id/review
API.ATTEMPT.EXAM_HISTORY        GET   /attempt/exam-history?fromDate=&toDate=
API.ATTEMPT.LIST                GET   /attempt?questionBankId=&examSetId=&status=&page=&size=
API.ATTEMPT.MY_STATISTICS       GET   /attempt/my-statistics
API.PUBLIC_ATTEMPT.START        POST  /public-attempt/start
API.PUBLIC_ATTEMPT.START_WITH_GROUP  POST  /public-attempt/start-with-group
API.PUBLIC_ATTEMPT.SUBMIT(id)   POST  /public-attempt/:id/end
API.QUESTION_BANK.LIST          GET   /question-bank
API.QUESTION_BANK.DETAIL(id)    GET   /question-bank/:id
API.QUESTION_BANK.RANDOM(id)    GET   /question-bank/random/:id
```

### 3.3. Service Modules

| File               | Chức năng                                                        |
|--------------------|------------------------------------------------------------------|
| `auth.js`          | `loginStudent()`, `loginTeacher()` — POST credentials + deviceId |
| `attempt.js`       | Attempt lifecycle: start → submit → review → history → statistics. Hỗ trợ cả authenticated (`startAttempt`) và public (`startPublicAttempt`). `normalizeGroupedAttempt()` flatten groups thành flat questions list. |
| `grade.js`         | `getGrades()` — Lấy tất cả khối/lớp. `getExamSetDetail()` / `getPublicExamSetDetail()` |
| `student.js`       | CRUD user profile: upload avatar, update avatar/profile, get user, get certificates |
| `questionBank.js`  | `getQuestionBankDetail()`, `getQuestionBankOptions()` (paginated list), `getRandomQuestion()` (loại trừ đã hỏi), `getCurrentGoldenBellQuestionBank()` |
| `socket.js`        | `createAppSocket(tokenOverride)` — tạo Socket.IO client (websocket + polling, reconnect 8 lần) |

### 3.4. `service/` — Thư mục trống (reserved)

---

## 4. Routing & Navigation (`App.jsx`)

### Route Map

| Path                        | Component            | Auth | Header |
|-----------------------------|----------------------|------|--------|
| `/`                         | `Home`               | ❌   | ✅     |
| `/login`                    | `Login`              | ❌   | ✅     |
| `/login/random-exam`        | `ExamRandom`         | ❌   | ✅     |
| `/placement-test`           | `PlacementTest`      | ❌   | ✅     |
| `/exam-set/:examSetId`      | `ExamList`           | ❌   | ✅     |
| `/exam-set-detail/:examSetId` | `ExamDetail`       | ❌   | ✅     |
| `/exam-set-all/:subjectId`  | `ExamList`           | ❌   | ✅     |
| `/exam/:examSetId/:id`      | `ExamDetail`         | ✅   | ✅     |
| `/exam-doing/:id`           | `ExamDoing`          | ✅   | ✅     |
| `/exam-doing-english`       | `ExamDoingEnglish`   | ✅   | ✅     |
| `/exam-random/:id`          | `ExamRandom`         | ❌   | ✅     |
| `/exam-random`              | `ExamRandom`         | ❌   | ✅     |
| `/exam-review/:id`          | `ExamReview`         | ✅   | ✅     |
| `/exam-dashboard`           | `ExamDashboard`      | ✅   | ✅     |
| `/profile-user`             | `Profile`            | ✅   | ✅     |
| `/golden-bell`              | `GoldenBellExam`     | ✅   | ✅     |
| `/golden-bell/:id`          | `GoldenBellExam`     | ✅   | ✅     |
| `/golden-bell-arena`        | `GoldenBellArena`    | ❌   | ❌     |
| `/golden-bell-arena/:id`    | `GoldenBellArena`    | ❌   | ❌     |
| `/teacher`                  | `TeacherGoldenBell`  | ❌   | ❌     |
| `/teacher/:id`              | `TeacherGoldenBell`  | ❌   | ❌     |
| `/certificate-view`         | `CertificateView`   | ❌   | ❌     |

**Header ẩn**: `/certificate-view`, `/golden-bell-arena/*`, `/teacher/*`

### `ProtectedRoute`
- Check `localStorage.getItem("accessToken")`
- Nếu không có → redirect `/login` với `state.from` = current path
- Login xong sẽ redirect về path cũ

---

## 5. Pages (`src/pages/`) — Chi tiết

### 5.1. `Home.jsx` — Trang chủ

- Gọi `getGrades()` để lấy danh sách khối + môn học + examSets
- Render grid: Mỗi grade → card chứa danh sách subjects
- Click subject → navigate `/exam-set-all/:subjectId`
- **Banner CTA**: "Bài test đầu vào" → navigate `/placement-test`
- Component phụ: `SubjectImage` — lazy load ảnh với skeleton

### 5.2. `Login.jsx` — Đăng nhập

- Form: ID + Password
- Flow: `loginStudent()` → lưu `accessToken`, `userId`, `userType` vào localStorage → `getUserById()` lấy `fullName` → redirect về `state.from` hoặc `/`
- UI: Split layout (logo bên trái, form bên phải), responsive

### 5.3. `ExamList.jsx` — Danh sách bộ đề

- Nhận `subject` từ `location.state` → map `subject.examSets` thành danh sách
- Search + Pagination (10 items/page)
- Click "Xem" → navigate `/exam-set-detail/:id` với state

### 5.4. `ExamDetail.jsx` — Chi tiết bộ đề + Lịch sử thi

- Fetch `EXAM_SET.DETAIL(examSetId)` → lấy `questionBanks`
- Mỗi questionBank có nút "Làm bài":
  - Nếu `sectionCount > 0` → `startAttemptWithGroup()`, ngược lại `startAttempt()`
  - Navigate `/exam-doing/:id` với `attemptId`, `questions`, `groups`
- **Lịch sử thi**: Fetch `getAttemptList()` → bảng hiển thị: Lần, Ngày, Điểm, Thời gian
  - Highlight lần điểm cao nhất 🏆
  - Nút "XEM" → navigate `/exam-review/:id`
- **Bảng xếp hạng**: Top 3 + list (hiện tại mock data)
- **Popup kết quả**: Sau khi nộp bài, hiển thị điểm + xếp loại + option xem chứng chỉ hoặc làm lại

### 5.5. `ExamDoing.jsx` — Làm bài thi

- Layout: Header (tên đề + timer) + Content area + Sidebar (progress + question navigator)
- **Timer**: Countdown từ `mockExamData.duration * 60` giây
  - Cảnh báo bell sound tại 1/3 và 2/3 thời gian
  - Hết giờ → auto submit
- **Section support**: Nếu có `groups` → hiển thị tabs theo phần (Part 1, Part 2...)
- **Content rendering**: TEXT, IMAGE, AUDIO cho cả câu hỏi và đáp án (hỗ trợ `chain` content)
- **Submit**: `submitAttempt(attemptId, answers)` → lưu kết quả localStorage → navigate back
- **Modals**: Confirm thoát, Confirm nộp bài, Hết giờ

### 5.6. `ExamDoingEnglish.jsx` — Làm bài tiếng Anh (variant)

- Tương tự `ExamDoing` nhưng specific cho đề tiếng Anh

### 5.7. `ExamReview.jsx` — Xem lại bài thi

- Fetch `getAttemptReview(attemptId)` → hiển thị tất cả câu hỏi + đáp án
- Color-coded: Đúng (xanh), Sai (đỏ), Đáp án đúng (viền xanh)
- Sidebar: Question navigator (xanh = đúng, đỏ = sai)
- Statistics: Đúng / Sai / Chưa làm
- Nút "Làm lại" → start attempt mới

### 5.8. `ExamDashboard.jsx` — Thành tích tổng hợp

- Date range filter (fromDate → toDate)
- `getExamHistory()` → Table + LineChart (Recharts)
- Pagination cho table
- Click "Xem" → navigate tới exam detail

### 5.9. `ExamRandom.jsx` — Câu hỏi ngẫu nhiên

- Public (không cần auth), dùng `getRandomQuestion()`
- Loại trừ câu đã hiển thị qua `excludeQuestionIds`
- Hiển thị đáp án đúng/sai ngay sau khi chọn
- Hỗ trợ `contentChain` cho nội dung multi-type

### 5.10. `PlacementTest.jsx` — Bài test đầu vào

- **Public** (không cần auth), dùng `startPublicAttempt()` / `startPublicAttemptWithGroup()`
- 3 stages: `intro` → `test` → `result`
- **Intro**: Chọn đề thi từ exam set, nhập họ tên, hiển thị info (số câu, thời gian 20 phút)
- **Test**: Giống `ExamDoing` nhưng có sidebar câu hỏi + section support
- **Result**: Điểm + Đã trả lời + Tỷ lệ đúng
- Auto-save progress vào `localStorage` (`public_placement_attempt`)
- Timer: 20 phút, auto submit khi hết giờ

### 5.11. `GoldenBellExam.jsx` — Rung chuông vàng (Học sinh)

- 2 sub-components: `GoldenBellLobby` (nhập mã phòng 6 số) + `GoldenBellRoom` (sân thi)
- **Socket.IO realtime**: Join room → nhận câu hỏi từ giáo viên
- Countdown 15 giây mỗi câu
- Chọn đáp án → Đúng: "passed" → Sai: "eliminated" (bị loại)
- Sync state qua Socket + localStorage (cross-tab)
- Student ID: ưu tiên `userId` (nếu đã login) hoặc generate random UUID

### 5.12. `GoldenBellArena.jsx` — Sàn thi đấu (Spectator view)

- **Không cần auth**, readonly view
- Socket.IO join room → hiển thị câu hỏi + đáp án + countdown
- Danh sách thí sinh: Active / Eliminated (hạ bảng)
- Khi hết giờ → highlight đáp án đúng

### 5.13. `TeacherGoldenBell.jsx` — Điều khiển GCH (Giáo viên)

- **Login riêng**: `loginTeacher()`, lưu `sessionStorage`
- JWT validation: check `userType === "TEACHER"` + expiry
- Chức năng:
  - Tạo phòng mới (Socket emit `golden-bell:create-room`)
  - Chọn đề thi từ dropdown (search + filter)
  - Phát câu hỏi tiếp theo (`getRandomQuestion()`)
  - Reset phòng
  - Kết thúc phòng
  - Copy link học sinh / Mở Arena view
- Hiển thị danh sách học sinh: Active / Passed / Eliminated

### 5.14. `Profile.jsx` — Thông tin cá nhân

- Fetch `getCurrentUser()` → hiển thị:
  - `ProfileCard` — Avatar + tên + class
  - `ProfileInfo` — Thông tin chi tiết (DOB, gender, email, phone)
  - `ProfileStats` — Thống kê thi
  - `ProfileCertificate` — Danh sách chứng chỉ

---

## 6. Components (`src/components/`)

### 6.1. Layout

| Component     | File                        | Mô tả                                                       |
|---------------|-----------------------------|--------------------------------------------------------------|
| `Header`      | `layout/Header.jsx` (1080 lines) | Desktop: green bar + nav (Thi, Test đầu vào, Cá nhân) + user menu. Mobile: floating draggable logo button + popup menu. Mega menu cho "Giáo dục phổ thông" (chọn khối → môn → đề). |

### 6.2. Profile Components

| Component            | File                           | Mô tả                                   |
|----------------------|--------------------------------|------------------------------------------|
| `ProfileCard`        | `profile/ProfileCard.jsx`      | Avatar upload + hiển thị tên, lớp        |
| `ProfileInfo`        | `profile/ProfileInfo.jsx`      | Form thông tin chi tiết, có edit mode    |
| `ProfileStats`       | `profile/ProfileStats.jsx`     | Thống kê số lần thi (`getMyStatistics`) |
| `ProfileCertificate` | `profile/ProfileCertificate.jsx` | Danh sách chứng chỉ từ API            |
| `Certificate`        | `profile/Certificate.jsx`      | Render 1 chứng chỉ (background image + data overlay) |
| `CertificateView`    | `profile/CertificateView.jsx`  | Full-page certificate view, hỗ trợ print |

### 6.3. Auth

| Component        | File                        | Mô tả                     |
|------------------|-----------------------------|----------------------------|
| `ProtectedRoute` | `ProtectedRoute.jsx`        | Check token, redirect login |

---

## 7. Config (`src/config/`)

### `constants.js`

| Constant           | Values                                                   |
|--------------------|----------------------------------------------------------|
| `CertificateLevel` | Hoàn thành tốt, Hoàn thành, Chưa hoàn thành, Đạt, Chưa đạt, Xuất sắc |
| `CertificateSubject` | STEM, Công dân số, Kỹ năng sống, DI-ICHI              |
| `SubjectType`      | CDS, KNS, STEM, DI-ICHI                                 |
| `ExamStatus`       | SUBMITTED, PENDING, GRADED                               |
| `AchievementLevel` | Xuất sắc, Tốt, Trung bình, Yếu                         |
| `TemplateType`     | CDS, KNS, STEM, DI-ICHI                                 |

### `certificateTemplates.js`

- 8 certificate background images (4 môn × 2 variants: normal/excellent)
- Pixel-perfect text position configs cho mỗi template (name, className, school, day/month/year)
- `getTemplateConfig(subject, level, options)` → trả `{ bgImage, fieldPositions }`

### `certificatePrintTemplates.js`

- Print-specific positions (khác với screen positions)

---

## 8. Utils (`src/utils/`)

### `questionContent.js`

| Function                       | Mô tả                                                            |
|--------------------------------|-------------------------------------------------------------------|
| `buildContentChain(node)`      | Đệ quy flatten content chain (TEXT/IMAGE/AUDIO) từ nested structure |
| `getQuestionAnswerOptions(question)` | Lọc + sort answers theo `importOptionLabel` → `orderNo` → `createdAt` |

---

## 9. Static Data (`src/datas/`)

| File                  | Mô tả                                       |
|-----------------------|----------------------------------------------|
| `mockExamData.js`     | Mock exam config (title, duration, questions count) — dùng trong `ExamDoing` fallback |
| `mockEnglishExam.js`  | Mock data cho đề tiếng Anh                   |
| `placementTestData.js`| Mock data cho placement test                 |

---

## 10. Assets (`src/assets/`)

| File/Dir          | Mô tả                                            |
|-------------------|---------------------------------------------------|
| `logo_ichi.png`   | Logo ICHI SKILL (favicon + header)                |
| `avatar.png`      | Default avatar                                    |
| `bell.mp3`        | Bell sound cho timer warning                      |
| `cancle.png`      | Cancel/close icon                                 |
| `down-arrow.png`  | Down arrow icon                                   |
| `kido.jpg`        | Kido background image                             |
| `menu_bar.png`    | Hamburger menu icon                               |
| `certificates/`   | 8 certificate background images (CDS, KNS, STEM, DI-ICHI × 2) |

---

## 11. State Management

**Không sử dụng Redux** (có dependencies `@reduxjs/toolkit` + `react-redux` nhưng không import ở đâu).

State management hiện tại:
- **localStorage**: `accessToken`, `userId`, `userType`, `fullName`, `user`, `current_exam`, `current_subject`, `certificates`, `exam_result_popup`, `floating_header_position`
- **sessionStorage**: `teacherAccessToken`, `teacherName`, `teacherUserId`, `golden_bell_student_id`
- **React state**: Component-level `useState` + `useEffect` cho data fetching

---

## 12. Styling

- **TailwindCSS v4** (via `@tailwindcss/vite` plugin)
- `index.css`: 
  - Import `tailwindcss`
  - CSS custom properties cho safe-area insets (mobile viewport)
  - Custom scrollbar styles (`.placement-scrollbar`)
  - Print styles (A4 landscape, `#print-area` targeting)
- Font: `Segoe UI, Arial, sans-serif`
- Color scheme: Green-based (`green-700`, `emerald-600/700/800`)

---

## 13. Key Dependencies

| Package              | Version   | Dùng cho                            |
|----------------------|-----------|-------------------------------------|
| `react`              | 19.2.0    | UI framework                        |
| `react-router-dom`   | 7.13.1    | Client-side routing                 |
| `tailwindcss`        | 4.2.4     | Utility CSS                         |
| `lucide-react`       | 0.575.0   | Icon library                        |
| `recharts`           | 3.7.0     | Charts (LineChart trong Dashboard)  |
| `socket.io-client`   | 4.8.3     | WebSocket (Golden Bell realtime)    |
| `react-hot-toast`    | 2.6.0     | Toast notifications                 |
| `react-toastify`     | 11.1.0    | Toast (có install nhưng dùng react-hot-toast) |
| `html2canvas`        | 1.4.1     | Certificate screenshot              |
| `jspdf`              | 4.2.1     | Certificate PDF export              |
| `@reduxjs/toolkit`   | 2.11.2    | **Unused** — chưa implement        |
| `react-redux`        | 9.2.0     | **Unused** — chưa implement        |

---

## 14. Socket.IO Events (Golden Bell)

| Event                      | Direction | Payload                                  |
|----------------------------|-----------|------------------------------------------|
| `golden-bell:join`         | Client→Server | `{ roomId, student? }`               |
| `golden-bell:leave`        | Client→Server | `{ roomId }`                         |
| `golden-bell:create-room`  | Client→Server | `{ questionBankId }` → callback `{ ok, roomId, room }` |
| `golden-bell:end-room`     | Client→Server | `{ roomId }` → callback `{ ok }`    |
| `golden-bell:sync`         | Client→Server | `{ roomId, room }`                   |
| `golden-bell:room-state`   | Server→Client | Full room state object               |

---

## 15. Luồng chính (Core Flows)

### Flow 1: Làm bài thi (Authenticated)
```
Home → Chọn khối/môn → ExamList → ExamDetail → Bấm "Làm bài"
→ startAttempt/startAttemptWithGroup (API)
→ ExamDoing (làm bài + countdown)
→ submitAttempt (API) → Quay về ExamDetail (popup kết quả)
→ Xem lại: ExamReview
```

### Flow 2: Bài test đầu vào (Public)
```
Home → Banner CTA / Header "Test đầu vào"
→ PlacementTest (intro: chọn đề + nhập tên)
→ startPublicAttempt (API) → Làm bài (20 phút)
→ submitPublicAttempt (API) → Kết quả
```

### Flow 3: Rung chuông vàng
```
[Giáo viên]
TeacherGoldenBell → Login GV → Chọn đề → Tạo phòng (Socket)
→ Phát câu hỏi (getRandomQuestion) → Sync room state

[Học sinh]
GoldenBellExam → Nhập mã phòng → Join room (Socket)
→ Nhận câu hỏi realtime → Chọn đáp án → Đúng/Sai (passed/eliminated)

[Spectator]
GoldenBellArena → Join room (Socket) → Xem readonly
```

### Flow 4: Câu hỏi ngẫu nhiên (Public)
```
/exam-random hoặc /login/random-exam
→ ExamRandom → getRandomQuestion (API, no auth)
→ Chọn đáp án → Hiển thị đúng/sai → Next question
```

---

## 16. Ghi chú kỹ thuật

1. **Content Chain Pattern**: Câu hỏi và đáp án sử dụng cấu trúc `chain` (linked list of content nodes) hỗ trợ mixed content types (TEXT + IMAGE + AUDIO). Utility `buildContentChain()` đệ quy flatten structure này.

2. **Dual Attempt APIs**: Có 2 bộ attempt APIs:
   - Authenticated: `attempt/start`, `attempt/:id/end` — yêu cầu `accessToken`
   - Public: `public-attempt/start`, `public-attempt/:id/end` — không cần auth, dùng cho Placement Test

3. **Section/Group Support**: Đề thi có thể chia thành sections (groups). Nếu `sectionCount > 0` → dùng `startAttemptWithGroup()` thay vì `startAttempt()`. Response trả về `groups[]` chứa `questions[]` theo từng phần.

4. **Certificate Generation**: Client-side render certificate bằng cách overlay text lên background image theo pixel positions. Export PDF qua `html2canvas` + `jsPDF`.

5. **Mobile UX**: Header chuyển thành floating draggable button trên mobile, lưu vị trí vào localStorage. Hỗ trợ `safe-area-inset` cho notch devices.

6. **No State Management Library**: Mặc dù có Redux dependencies, toàn bộ state quản lý bằng `useState` + `localStorage`. Có thể gây issues với state sync giữa các components.

7. **Toast Conflict**: Cài cả `react-hot-toast` (đang dùng) và `react-toastify` (không dùng) — nên remove `react-toastify`.

8. **Teacher Auth Isolation**: Teacher login dùng `sessionStorage` riêng, không conflict với student login trong `localStorage`.
