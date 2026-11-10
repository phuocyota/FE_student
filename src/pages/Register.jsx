import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo_ichi.png";
import cancelIcon from "../assets/cancle.png";
import StudentRegistration from "../components/StudentRegistration";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-5 bg-green-700 px-8 py-8 text-white md:gap-6 md:py-14">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white md:h-56 md:w-56 md:border-8">
            {/* Compensate for the off-center white disc in the source PNG. */}
            <img src={logo} alt="ICHI SKILL Logo" className="h-24 w-24 translate-x-[2%] translate-y-[2.5%] rounded-full object-contain md:h-48 md:w-48" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide md:text-3xl">ICHI SKILL</h1>
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10 md:px-12 lg:px-16">
          <div className="w-full max-w-md relative">
            <button
              type="button"
              aria-label="Đóng đăng ký"
              onClick={() => navigate("/")}
              className="w-6 h-6 absolute top-0 right-0 cursor-pointer hover:scale-110 transition"
            >
              <img src={cancelIcon} alt="" className="h-full w-full" />
            </button>
            <div className="pt-9">
              <StudentRegistration onBack={() => navigate("/login", { state: location.state })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
