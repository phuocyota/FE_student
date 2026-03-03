import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ExamList from "./pages/ExamList";
import ExamDetail from "./pages/ExamDetail";
import ExamDoing from "./pages/ExamDoing";
import { Toaster } from "react-hot-toast";
import ExamDashboard from "./pages/ExamDashboard";
import Profile from "./pages/Profile";


const App = () => {
  return (
    <>
    <Toaster position="top-right" />
      <Header />
      
      

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exam-dashboard" element={<ExamDashboard />} />
        <Route path="/profile-user" element={<Profile />} />
        <Route path="/notifications" element={<div>Thông báo</div>} />   
        <Route path="/login" element={<Login />} />
        <Route path="/exam-list" element={<ExamList />} />
        <Route path="/exam/:id" element={<ExamDetail />} />
        <Route path="/exam-doing/:id" element={<ExamDoing />} />
      </Routes>


     
    </>
  );
};

export default App;