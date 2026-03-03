# Project Overview

## 1. Mục tiêu hiện tại

Đây là một frontend React + Vite cho học sinh, tập trung vào các luồng:

- xem danh sách đề thi
- vào chi tiết đề
- làm bài thi thử
- xem lịch sử làm bài
- xem dashboard thành tích
- đăng nhập học sinh
- xem và chỉnh sửa hồ sơ cá nhân ở mức local UI

Trạng thái hiện tại của dự án vẫn thiên về mock/demo UI hơn là production-ready. Một phần dữ liệu đang hardcode trong component hoặc lưu tạm bằng `localStorage`.

## 2. Tech Stack

- React 19
- Vite 7
- React Router DOM 7
- Tailwind CSS 4
- Lucide React
- Recharts
- React Hot Toast

Dependency đã cài nhưng hiện chưa thấy được dùng trong source:

- `@reduxjs/toolkit`
- `react-redux`

## 3. Cấu trúc thư mục chính

```text
src/
  api/
    auth.js
    client.js
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
    Profile.jsx
  App.jsx
  main.jsx
  index.css
```

## 4. Entry Point và Routing

### `src/main.jsx`

- mount app bằng `createRoot`
- bọc toàn bộ app trong `BrowserRouter`

### `src/App.jsx`

`App.jsx` là router chính và luôn render:

- `Toaster`
- `Header`
- các route page

Route hiện có:

- `/` -> `Home`
- `/exam-dashboard` -> `ExamDashboard`
- `/profile-user` -> `Profile`
- `/notifications` -> placeholder text
- `/login` -> `Login`
- `/exam-list` -> `ExamList`
- `/exam/:id` -> `ExamDetail`
- `/exam-doing/:id` -> `ExamDoing`

Hiện chưa có:

- route guard
- protected route
- layout chia public/private
- error boundary

## 5. Cấu hình môi trường và dev proxy

### `.env`

Biến môi trường hiện tại:

- `VITE_API_BASE_URL=http://160.250.132.143:3001`
- `VITE_API_PROXY_PREFIX=/api`
- `VITE_LOGIN_PATH=/auth/login/student`

### `vite.config.js`

Đã cấu hình proxy dev:

- request bắt đầu bằng `/api`
- proxy sang `http://160.250.132.143:3001`
- rewrite bỏ prefix `/api`

Mục tiêu là tránh lỗi CORS khi gọi backend từ local dev.

## 6. Tầng API

### `src/api/client.js`

Đây là API client chung:

- ưu tiên gọi qua `VITE_API_PROXY_PREFIX`
- fallback sang `VITE_API_BASE_URL`
- luôn set `Content-Type: application/json`
- parse JSON nếu response là JSON
- nếu response lỗi thì ném `Error` với `message` từ payload

### `src/api/auth.js`

Hiện mới có một API auth:

- `loginStudent({ username, password, deviceId })`

Hàm này gọi tới:

- `VITE_LOGIN_PATH`
- mặc định là `/auth/login/student`

## 7. Luồng đăng nhập

### `src/pages/Login.jsx`

Luồng hiện tại:

- form gồm `id` và `password`
- khi submit:
  - map `id` -> `username`
  - gửi `deviceId: "web-browser"`
  - gọi `loginStudent`
- nếu thành công:
  - lưu `user` vào `localStorage`
  - lưu `userId` vào `localStorage`
  - lưu `accessToken` nếu backend trả về
  - lưu `refreshToken` nếu backend trả về
  - toast success
  - redirect về `/`
- nếu lỗi:
  - hiển thị `error`
  - toast error

Các key localStorage đang dùng cho auth:

- `user`
- `userId`
- `accessToken`
- `refreshToken`

Ghi chú:

- component đang suy đoán nhiều shape response khác nhau từ backend như `response.user.fullName`, `response.name`, `response.username`, `response.id`, `response.userId`
- chưa có typing/schema validation cho response

## 8. Header và điều hướng toàn cục

### `src/components/layout/Header.jsx`

Header là component lớn nhất của app hiện tại. Nó đang gánh nhiều trách nhiệm:

- logo và điều hướng chính
- menu "Thi"
- mega menu "Giáo dục phổ thông"
- mega menu "Ngoại ngữ"
- đọc trạng thái đăng nhập từ `localStorage`
- hiển thị dropdown user menu
- logout bằng cách xóa `localStorage.user` rồi reload về `/`

Data trong header đang hardcode hoàn toàn:

- khối lớp 1 đến 12
- danh sách môn học
- danh sách loại đề
- nhóm ngoại ngữ và chứng chỉ

Điểm đáng chú ý:

- `Header` chỉ xóa `user` khi logout, chưa xóa `userId`, `accessToken`, `refreshToken`
- state active menu đang quản lý cục bộ khá nhiều
- logic UI của mega menu đang dài và có thể cần tách nhỏ sau này

## 9. Các page chính

### `src/pages/Home.jsx`

Trang home đang render danh sách khối lớp và một số bộ đề mẫu.

Đặc điểm:

- dữ liệu hardcode trong component
- click item sẽ điều hướng sang `/exam-list`
- chưa truyền context thật như lớp, môn học, loại đề

### `src/pages/ExamList.jsx`

Trang danh sách đề:

- dùng mảng `examData` hardcode
- có search client-side theo title
- có phân trang client-side
- click `Xem` sẽ đi tới `/exam/:id`

Hiện chưa dùng API và chưa có liên kết thật với lựa chọn từ header/home.

### `src/pages/ExamDetail.jsx`

Trang chi tiết đề:

- title đang hardcode
- đọc lịch sử làm bài từ `localStorage` theo key `exam_${id}`
- có nút `THI THỬ` sang `/exam-doing/:id`
- hiển thị bảng lịch sử thi nếu có dữ liệu
- có phần bảng xếp hạng hoàn toàn hardcode

### `src/pages/ExamDoing.jsx`

Đây là page có logic nghiệp vụ nhiều nhất hiện tại.

Nguồn dữ liệu:

- đọc đề từ `src/datas/mockExamData.js`

Chức năng:

- countdown timer
- chọn đáp án
- submit bài làm
- auto submit khi hết giờ
- review bài cũ qua query `?review=index`
- tính số câu đúng, sai, chưa làm
- lưu lịch sử làm bài vào `localStorage`

Key localStorage:

- `exam_${id}`

Dữ liệu lưu mỗi lần nộp bài:

- `date`
- `score`
- `time`
- `answers` trong một số luồng submit

Lưu ý kỹ thuật:

- trong file đang tồn tại cả `handleSubmit` và `submitExam`, logic khá giống nhau
- `handleSubmit` lưu thiếu `answers`, còn `submitExam` thì có lưu `answers`
- review mode phụ thuộc vào dữ liệu đã lưu trước đó

### `src/pages/ExamDashboard.jsx`

Dashboard thành tích:

- bảng lịch sử đề hardcode
- biểu đồ line chart bằng `recharts`
- filter ngày chỉ là UI, chưa có logic lọc thật
- có nút `Xuất PDF` nhưng đang gọi `handleExportPDF(item)` chưa được định nghĩa

Đây là một lỗi runtime rõ ràng nếu người dùng bấm nút này.

### `src/pages/Profile.jsx`

Page hồ sơ:

- quản lý state `user` cục bộ trong page
- truyền xuống các component profile con
- toàn bộ dữ liệu hồ sơ đang hardcode

## 10. Nhóm component profile

### `ProfileCard.jsx`

- hiển thị avatar, tên, lớp, trường
- hỗ trợ đổi avatar cục bộ bằng `URL.createObjectURL`
- toggle trạng thái edit

### `ProfileInfo.jsx`

- render form xem/sửa thông tin cá nhân
- lưu thay đổi chỉ trong state React
- không có API persistence

### `ProfileStats.jsx`

- hiển thị 4 ô thống kê thành tích
- toàn bộ số liệu hardcode

## 11. Dữ liệu mock

### `src/datas/mockExamData.js`

File này cung cấp:

- 1 đề thi mock
- `duration`
- danh sách 10 câu hỏi trắc nghiệm
- mỗi câu có `correctAnswer`

Toàn bộ câu hỏi đang là placeholder:

- `This is question X`
- option A/B/C/D mẫu

## 12. Styling

### `src/index.css`

- import Tailwind CSS
- import Google Fonts
- áp font `Outfit` toàn cục bằng selector `*`

UI hiện tại dùng Tailwind trực tiếp trong JSX, chưa có design token riêng ngoài utility classes.

## 13. Trạng thái dữ liệu trong app

Nguồn dữ liệu hiện tại của app chia làm 3 loại:

### Hardcoded trong component

- home data
- exam list
- dashboard exam history
- profile info
- header mega menu data
- leaderboard

### Mock file cục bộ

- `mockExamData.js`

### LocalStorage

- auth state cơ bản
- lịch sử làm bài theo từng exam id

Điều này có nghĩa:

- app hiện chưa có state management tập trung
- chưa có đồng bộ dữ liệu giữa backend và nhiều page khác ngoài login

## 14. Những điểm cần lưu ý trước khi mở rộng

### Điểm mạnh hiện tại

- cấu trúc nhỏ, dễ đọc
- UI đã có đủ skeleton cho các màn chính
- login đã được tách sang tầng `api`
- dev proxy đã xử lý được backend login

### Điểm yếu / nợ kỹ thuật

- dữ liệu phần lớn đang hardcode
- chưa có chuẩn response model cho backend
- chưa có auth guard
- logout chưa xóa toàn bộ auth key
- `ExamDashboard.jsx` có hàm `handleExportPDF` bị thiếu
- `ExamDoing.jsx` có logic submit bị lặp
- nhiều page chưa dùng dữ liệu thực từ API
- `Header.jsx` quá lớn, khó bảo trì
- dependency Redux đã cài nhưng chưa được dùng

## 15. Gợi ý hướng phát triển tiếp theo

Nếu tiếp tục hoàn thiện dự án này, thứ tự hợp lý là:

1. Chuẩn hóa auth:
   - login response model
   - logout đầy đủ
   - route guard
2. Tách các dữ liệu mock sang API hoặc mock service layer thống nhất
3. Chuẩn hóa module exam:
   - list
   - detail
   - doing
   - history
4. Tách nhỏ `Header.jsx`
5. Sửa các lỗi runtime tồn tại, đặc biệt là `handleExportPDF`

## 16. Cách chạy dự án

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```
