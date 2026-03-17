# Project Overview

## 1. Mục tiêu hiện tại

Đây là frontend React + Vite cho học sinh, hiện đang tập trung vào các luồng:

- xem danh sách khối, môn và bộ đề
- xem danh sách đề theo `exam-set`
- vào chi tiết đề
- bắt đầu làm bài
- nộp bài và xem review
- xem lịch sử thi và dashboard
- đăng nhập học sinh
- xem và cập nhật hồ sơ cá nhân

Trạng thái hiện tại đã chuyển một phần từ mock/demo UI sang gọi API thật, nhưng vẫn còn pha trộn giữa dữ liệu thật, dữ liệu local và một số phần mock.

## 2. Tech Stack

- React 19
- Vite 7
- React Router DOM 7
- Tailwind CSS 4
- Lucide React
- Recharts
- React Hot Toast

Dependency đã bỏ:

- `axios`

Dependency đã cài nhưng hiện chưa thấy dùng trong source:

- `@reduxjs/toolkit`
- `react-redux`

## 3. Cấu trúc thư mục chính

```text
src/
  api/
    attempt.js
    auth.js
    client.js
    endpoint.js
    grade.js
    student.js
  assets/
  components/
    layout/
      Header.jsx
    profile/
      ProfileCard.jsx
      ProfileInfo.jsx
      ProfileStats.jsx
  datas/
    mockExamData.js
  pages/
    Home.jsx
    Login.jsx
    ExamList.jsx
    ExamDetail.jsx
    ExamDoing.jsx
    ExamDashboard.jsx
    ExamReview.jsx
    Profile.jsx
  App.jsx
  main.jsx
  index.css
```

## 4. Entry Point và Routing

### `src/main.jsx`

- mount app bằng `createRoot`
- bọc app trong `BrowserRouter`

### `src/App.jsx`

Router chính hiện đang render:

- `Toaster`
- `Header`
- các route page

Route hiện có:

- `/` -> `Home`
- `/exam-set/:examSetId` -> `ExamList`
- `/exam/:examSetId/:id` hoặc route exam detail hiện dùng luồng đề cụ thể
- `/exam-doing/:id` -> `ExamDoing`
- `/exam-dashboard` -> `ExamDashboard`
- `/profile-user` -> `Profile`
- `/notifications` -> placeholder
- `/login` -> `Login`

Hiện chưa có:

- protected route
- route guard
- layout tách public/private
- error boundary

## 5. Cấu hình môi trường

### `.env`

Hiện file env đang dùng 2 biến chính:

- `VITE_API_BASE_URL`
- `VITE_API_PREFIX`

Ví dụ local:

```env
VITE_API_BASE_URL=http://160.250.132.143:3001
VITE_API_PREFIX=
```

Ví dụ production qua proxy:

```env
VITE_API_BASE_URL=https://be.kidostudent.kidoedu.vn
VITE_API_PREFIX=/api
```

Ý nghĩa hiện tại:

- `VITE_API_BASE_URL` là domain backend
- `VITE_API_PREFIX` là prefix tùy môi trường
- local HTTP có thể để prefix rỗng
- production HTTPS qua proxy/nginx có thể để prefix là `/api`

### `vite.config.js`

Vẫn còn cấu hình proxy dev cho `/api`, nhưng hiện flow API trong app đang ưu tiên đọc trực tiếp từ `.env`.

Điều này có nghĩa:

- nếu dùng direct backend thì `.env` phải đúng
- nếu dùng proxy/nginx thì prefix nên được điều khiển bằng `VITE_API_PREFIX`

## 6. Tầng API

### `src/api/client.js`

Đây là API client chung hiện tại.

Nó đang phụ trách:

- đọc `VITE_API_BASE_URL`
- đọc `VITE_API_PREFIX`
- build `BASE_URL`
- build `API_BASE_URL`
- build URL API bằng `buildApiUrl(path)`
- build URL ảnh/file bằng `buildAssetUrl(path)`
- cung cấp helper `fetch(url, options, token)`
- parse response qua `parseResponse(response)`
- cung cấp `apiRequest(path, options)`

Hành vi hiện tại:

- API JSON dùng `API_BASE_URL`
- asset/image dùng `BASE_URL`
- request API mặc định `cache: "no-store"`
- nếu response lỗi sẽ throw `Error(message)`

### `src/api/endpoint.js`

Toàn bộ endpoint đã được gom về object `API`:

- `API.AUTH.LOGIN_STUDENT`
- `API.GRADE.GET_ALL`
- `API.EXAM_SET.DETAIL(id)`
- `API.STUDENT.*`
- `API.ATTEMPT.*`

### `src/api/auth.js`

- `loginStudent({ username, password, deviceId })`

Hiện đang dùng `apiRequest(...)`.

### `src/api/grade.js`

- `getGrades()`
- `getExamSetDetail(id)`

Hiện đang dùng `apiRequest(...)`.

### `src/api/attempt.js`

Các hàm hiện có:

- `startAttempt(data)`
- `submitAttempt(attemptId, answers)`
- `getAttemptReview(attemptId)`
- `getExamHistory(fromDate, toDate)`

Hiện đang dùng `fetch(...)` từ `client.js` + `parseResponse(...)`.

### `src/api/student.js`

Các hàm hiện có:

- `uploadAvatar(file)`
- `updateUserAvatar(userId, userData)`
- `updateStudentProfile(userId, data)`
- `getUserById(userId)`

Đã chuyển từ `axios` sang `fetch(...)` + `parseResponse(...)`.

## 7. Luồng đăng nhập

### `src/pages/Login.jsx`

Luồng hiện tại:

- form gồm `id` và `password`
- map `id` -> `username`
- gửi `deviceId`
- gọi `loginStudent(...)`
- nếu thành công:
  - lưu `accessToken`
  - lưu `userId`
  - lưu `userType`
  - gọi `getUserById(userId)` để lấy tên
  - lưu `user` vào `localStorage`
  - điều hướng về `/`

LocalStorage liên quan auth:

- `user`
- `userId`
- `userType`
- `accessToken`
- `refreshToken` nếu có

## 8. Header và điều hướng toàn cục

### `src/components/layout/Header.jsx`

`Header` hiện vừa có UI điều hướng, vừa có logic dữ liệu:

- gọi `getGrades()` để lấy danh sách khối và môn
- gọi `getUserById()` để lấy thông tin user
- đọc/trạng thái đăng nhập từ `localStorage`
- mega menu cho khối học
- menu ngoại ngữ vẫn đang hardcode
- dropdown user menu
- logout xóa:
  - `accessToken`
  - `refreshToken`
  - `aToken`
  - `user`
  - `userId`

Điểm cần lưu ý:

- `Header.jsx` vẫn khá lớn
- dữ liệu phần ngoại ngữ vẫn hardcode
- state UI trong header còn nhiều và dày

## 9. Các page chính

### `src/pages/Home.jsx`

Trang home hiện đã dùng API thật:

- gọi `getGrades()`
- render danh sách khối
- render subject theo dữ liệu backend
- click subject sẽ đi sang `/exam-set/:examSetId`

Phần ảnh:

- dùng `buildAssetUrl(...)`
- có `SubjectImage`
- có placeholder xám khi ảnh chưa load
- ảnh dùng `loading="lazy"` và `decoding="async"`

### `src/pages/ExamList.jsx`

Trang danh sách đề:

- lấy `examSetId` từ params
- gọi `API.EXAM_SET.DETAIL(examSetId)`
- search client-side theo title
- phân trang client-side
- click `Xem` sang route exam detail

Điểm cần lưu ý:

- shape response của endpoint `exam-set/:id` đang là điểm nhạy cảm
- hiện code đã cố đọc nhiều khả năng shape khác nhau của `questionBanks`
- đây là màn cần kiểm tra thêm nếu backend đổi response

### `src/pages/ExamDetail.jsx`

Trang chi tiết đề:

- đọc thông tin đề từ `location.state` hoặc `localStorage`
- `handleMockTest()` gọi `startAttempt(...)`
- nếu thành công thì điều hướng sang `ExamDoing`
- lịch sử làm bài vẫn đọc từ `localStorage`
- có một số phần UI/leaderboard còn hardcode

### `src/pages/ExamDoing.jsx`

Page làm bài hiện tại:

- dùng dữ liệu câu hỏi từ `location.state`
- có countdown timer
- chọn đáp án
- submit qua `submitAttempt(...)`
- lưu kết quả vào `localStorage`
- render nội dung ảnh bằng `buildAssetUrl(...)`

Lưu ý:

- thời lượng tổng vẫn đang phụ thuộc `mockExamData.duration`
- đây là chỗ còn pha giữa dữ liệu thật và dữ liệu mock

### `src/pages/ExamReview.jsx`

Trang review:

- gọi `getAttemptReview(attemptId)`
- render lại câu hỏi/đáp án
- hiển thị trạng thái đúng/sai/chưa làm
- có nút `Làm lại` gọi `startAttempt(...)`
- render ảnh bằng `buildAssetUrl(...)`

### `src/pages/ExamDashboard.jsx`

Dashboard hiện đã dùng API thật:

- gọi `getExamHistory(fromDate, toDate)`
- render bảng lịch sử thi
- render biểu đồ line chart bằng `recharts`
- filter ngày đã có logic gọi API

Điểm cần lưu ý:

- vẫn là UI/report cơ bản
- chưa thấy export/report nâng cao

### `src/pages/Profile.jsx`

Profile page:

- gọi `getUserById(userId)`
- map dữ liệu user từ response backend
- truyền state xuống `ProfileCard`, `ProfileInfo`, `ProfileStats`

## 10. Nhóm component profile

### `ProfileCard.jsx`

- hiển thị avatar, tên
- upload avatar qua `uploadAvatar(...)`
- update avatar qua `updateUserAvatar(...)`
- render avatar bằng `buildAssetUrl(...)`

### `ProfileInfo.jsx`

- cập nhật email / phone / note
- gọi `updateStudentProfile(...)`
- map dữ liệu response vào `user`

### `ProfileStats.jsx`

- vẫn chủ yếu là UI thống kê
- chưa thấy gắn dữ liệu backend thật

## 11. Dữ liệu mock

### `src/datas/mockExamData.js`

Hiện vẫn còn được dùng cho một phần logic:

- thời lượng trong `ExamDoing`
- một số nội dung phụ trợ của UI

Điều này nghĩa là module thi chưa hoàn toàn tách khỏi mock.

## 12. Styling

### `src/index.css`

- dùng Tailwind CSS
- import font toàn cục
- phần lớn UI đang dùng utility classes trực tiếp trong JSX

## 13. Trạng thái dữ liệu trong app

Nguồn dữ liệu hiện tại đang gồm:

### API thật

- login
- lấy grades
- lấy exam set detail
- start attempt
- submit attempt
- review attempt
- exam history
- get/update student
- upload avatar

### LocalStorage

- auth state cơ bản
- lịch sử làm bài theo `exam_${id}`
- popup kết quả thi
- một số context tạm như `current_exam`

### Mock / hardcode

- một phần dữ liệu ngoại ngữ trong header
- `mockExamData`
- một số UI thống kê / leaderboard / placeholder

## 14. Những điểm cần lưu ý trước khi mở rộng

### Điểm mạnh hiện tại

- đã có một tầng API tương đối thống nhất
- endpoint đã được gom vào `src/api/endpoint.js`
- đã bỏ `axios`
- env đã tách được `BASE_URL` và `API_PREFIX`
- nhiều màn đã chuyển từ mock sang API thật

### Điểm yếu / nợ kỹ thuật

- response backend chưa có model thống nhất rõ ràng
- một số màn vẫn phải “chịu lỗi” nhiều shape response
- `Header.jsx` vẫn quá lớn
- `ExamList.jsx` cần chốt chính xác shape response của `exam-set/:id`
- `ExamDoing.jsx` còn pha mock duration với dữ liệu thật
- app vẫn phụ thuộc khá nhiều vào `localStorage`
- env giữa local/prod cần được kiểm soát kỹ khi build
- ảnh và API production có thể gặp mixed content nếu build sai env

## 15. Hướng phát triển tiếp theo

Thứ tự hợp lý để tiếp tục:

1. Chốt contract response của backend cho từng endpoint
2. Chuẩn hóa tầng API để các màn không phải đoán shape response
3. Tách nhỏ `Header.jsx`
4. Bỏ phần mock còn sót trong luồng exam
5. Thêm route guard / auth guard
6. Chuẩn hóa xử lý asset/image theo môi trường deploy

## 16. Cách chạy dự án

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```
