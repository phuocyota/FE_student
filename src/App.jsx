import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ExamList from "./pages/ExamList";
import ExamDetail from "./pages/ExamDetail";
import ExamDoing from "./pages/ExamDoing";
import ExamDoingEnglish from "./pages/ExamDoingEnglish"; // ✅ thêm dòng này
import { Toaster } from "react-hot-toast";
import ExamDashboard from "./pages/ExamDashboard";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import ExamReview from "./pages/ExamReview";

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/exam-dashboard"
          element={
            <ProtectedRoute>
              <ExamDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile-user"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="/notifications" element={<div>Thông báo</div>} />
        <Route path="/login" element={<Login />} />

        <Route path="/exam-set/:examSetId" element={<ExamList />} />
        <Route path="/exam-set-detail/:examSetId" element={<ExamDetail />} />
        <Route path="/exam-set-all/:subjectId" element={<ExamList />} />

        <Route
          path="/exam/:examSetId/:id"
          element={
            <ProtectedRoute>
              <ExamDetail />
            </ProtectedRoute>
          }
        />

        {/* EXAM NORMAL */}
        <Route
          path="/exam-doing/:id"
          element={
            <ProtectedRoute>
              <ExamDoing />
            </ProtectedRoute>
          }
        />

        {/* ✅ EXAM ENGLISH */}
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

        {/* ⚠️ bạn đang bị trùng route này */}
        <Route
          path="/exam-review/:attemptId"
          element={
            <ProtectedRoute>
              <ExamDoing />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;