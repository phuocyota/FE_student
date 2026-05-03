// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import Header from "./components/layout/Header";
// import Login from "./pages/Login";
// import Home from "./pages/Home";
// import ExamList from "./pages/ExamList";
// import ExamDetail from "./pages/ExamDetail";
// import ExamDoing from "./pages/ExamDoing";
// import ExamDoingEnglish from "./pages/ExamDoingEnglish"; // ✅ thêm dòng này
// import { Toaster } from "react-hot-toast";
// import ExamDashboard from "./pages/ExamDashboard";
// import Profile from "./pages/Profile";
// import ProtectedRoute from "./components/ProtectedRoute";
// import ExamReview from "./pages/ExamReview";
// import CertificateView from "./components/profile/CertificateView";

// const App = () => {
//   return (
//     <>
//       <Toaster position="top-right" />
//       <Header />

//       <Routes>
//        <Route path="/certificate-view" element={<CertificateView />} />
//         <Route path="/" element={<Home />} />

//         <Route
//           path="/exam-dashboard"
//           element={
//             <ProtectedRoute>
//               <ExamDashboard />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/profile-user"
//           element={
//             <ProtectedRoute>
//               <Profile />
//             </ProtectedRoute>
//           }
//         />

//         <Route path="/notifications" element={<div>Thông báo</div>} />
//         <Route path="/login" element={<Login />} />

//         <Route path="/exam-set/:examSetId" element={<ExamList />} />
//         <Route path="/exam-set-detail/:examSetId" element={<ExamDetail />} />
//         <Route path="/exam-set-all/:subjectId" element={<ExamList />} />
       

//         <Route
//           path="/exam/:examSetId/:id"
//           element={
//             <ProtectedRoute>
//               <ExamDetail />
//             </ProtectedRoute>
//           }
//         />

//         {/* EXAM NORMAL */}
//         <Route
//           path="/exam-doing/:id"
//           element={
//             <ProtectedRoute>
//               <ExamDoing />
//             </ProtectedRoute>
//           }
//         />

//         {/* ✅ EXAM ENGLISH */}
//         <Route
//           path="/exam-doing-english"
//           element={
//             <ProtectedRoute>
//               <ExamDoingEnglish />
//             </ProtectedRoute>
//           }
//         />

//         {/* REVIEW */}
//         <Route
//           path="/exam-review/:id"
//           element={
//             <ProtectedRoute>
//               <ExamReview />
//             </ProtectedRoute>
//           }
//         />

//         {/* ⚠️ bạn đang bị trùng route này */}
//         <Route
//           path="/exam-review/:attemptId"
//           element={
//             <ProtectedRoute>
//               <ExamDoing />
//             </ProtectedRoute>
//           }
//         />
//       </Routes>
//     </>
//   );
// };

// export default App;

import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/layout/Header";

import Login from "./pages/Login";
import Home from "./pages/Home";
import ExamList from "./pages/ExamList";
import ExamDetail from "./pages/ExamDetail";
import ExamDoing from "./pages/ExamDoing";
import ExamDoingEnglish from "./pages/ExamDoingEnglish";
import ExamDashboard from "./pages/ExamDashboard";
import Profile from "./pages/Profile";
import ExamReview from "./pages/ExamReview";

import ProtectedRoute from "./components/ProtectedRoute";
import CertificateView from "./components/profile/CertificateView";

import { Toaster } from "react-hot-toast";

const App = () => {
  const location = useLocation();

  // 🔥 Các route KHÔNG hiển thị header
  const hideHeaderRoutes = ["/certificate-view"];

  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

  return (
    <>
      <Toaster position="top-right" />

      {/* ✅ HEADER chỉ hiển thị khi KHÔNG phải trang certificate */}
      {!shouldHideHeader && <Header />}

      <Routes>
        {/* 🔥 TRANG KHÔNG HEADER */}
        <Route path="/certificate-view" element={<CertificateView />} />

        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* DASHBOARD */}
        <Route
          path="/exam-dashboard"
          element={
            <ProtectedRoute>
              <ExamDashboard />
            </ProtectedRoute>
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile-user"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* EXAM LIST */}
        <Route path="/exam-set/:examSetId" element={<ExamList />} />
        <Route path="/exam-set-detail/:examSetId" element={<ExamDetail />} />
        <Route path="/exam-set-all/:subjectId" element={<ExamList />} />

        {/* EXAM DETAIL */}
        <Route
          path="/exam/:examSetId/:id"
          element={
            <ProtectedRoute>
              <ExamDetail />
            </ProtectedRoute>
          }
        />

        {/* EXAM DOING */}
        <Route
          path="/exam-doing/:id"
          element={
            <ProtectedRoute>
              <ExamDoing />
            </ProtectedRoute>
          }
        />

        {/* EXAM ENGLISH */}
        <Route
          path="/exam-doing-english"
          element={
            <ProtectedRoute>
              <ExamDoingEnglish />
            </ProtectedRoute>
          }
        />

        {/* REVIEW */}
        <Route
          path="/exam-review/:id"
          element={
            <ProtectedRoute>
              <ExamReview />
            </ProtectedRoute>
          }
        />

        {/* ⚠️ nếu không dùng thì nên xoá tránh conflict */}
        {/* 
        <Route
          path="/exam-review/:attemptId"
          element={
            <ProtectedRoute>
              <ExamDoing />
            </ProtectedRoute>
          }
        />
        */}
      </Routes>
    </>
  );
};

export default App;