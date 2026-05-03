 

import React, { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/kido.jpg";
import toast from "react-hot-toast";
import cancelIcon from "../assets/cancle.png";
import { loginStudent } from "../api/auth";
import { getUserById } from "../api/student";

const Login = () => {
  // localStorage.clear();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ⭐ kiểm tra token từ WebView2
  // useEffect(() => {
  //   const token = localStorage.getItem("accessToken");

  //   if (token) {
  //     console.log("Token tồn tại, auto login");
  //     navigate("/");
  //   }
  // }, [navigate]);

//   useEffect(() => {
//   const token = localStorage.getItem("accessToken");

//   if (!token) return;

//   try {
//     const payload = JSON.parse(atob(token.split(".")[1]));

//     if (payload.exp * 1000 < Date.now()) {
//       console.log("Token hết hạn → xoá");
//       localStorage.removeItem("accessToken");
//       return;
//     }

//     console.log("Token hợp lệ → auto login");
//     navigate("/");
//   } catch (err) {
//     console.log("Token lỗi → xoá");
//     localStorage.removeItem("accessToken");
//   }
// }, [navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  //   const handleSubmit = async (e) => {
  //     e.preventDefault();
  //     setError("");
  //     setIsSubmitting(true);

  //     try {
  //       const response = await loginStudent({
  //         username: form.id,
  //         password: form.password,
  //         deviceId: "web-browser",
  //       });

  //       console.log("LOGIN RESPONSE:", response);

  //       const payload = response?.data?.data || response?.data || response;

  //       const accessToken = payload?.accessToken;
  //       const userId = payload?.userId;
  //       const userType = payload?.userType;

  //       if (!accessToken) {
  //         throw new Error("Không nhận được accessToken");
  //       }

  //       // lưu token
  //       // localStorage.setItem("accessToken", accessToken);
  //       // localStorage.setItem("userId", userId);
  //       // localStorage.setItem("userType", userType);
  //       // localStorage.setItem("user", form.id);

  //       const res = await getUserById(userId);
  // const name = res.data.userName || res.data.fullName;

  // localStorage.setItem("user", name);
  // localStorage.setItem("accessToken", accessToken);
  // localStorage.setItem("userId", userId);

  // toast.success("Đăng nhập thành công!");
  // navigate("/");

  //       //setUser(form.id);


  //       // navigate("/");

  //     } catch (submitError) {
  //       const message =
  //         submitError?.response?.data?.message ||
  //         submitError.message ||
  //         "Sai ID hoặc mật khẩu!";

  //       setError(message);
  //       toast.error(message);
  //     } finally {
  //       setIsSubmitting(false);
  //     }
  //   };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginStudent({
        username: form.id,
        password: form.password,
        deviceId: "web-browser",
      });

      console.log("LOGIN RESPONSE:", response);

      const payload = response?.data?.data || response?.data || response;

      const accessToken = payload?.accessToken;
      const userId = payload?.userId;
      const userType = payload?.userType;

      if (!accessToken) {
        throw new Error("Không nhận được accessToken");
      }

      // 1️⃣ lưu token trước
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userType", userType);
      localStorage.setItem("user", JSON.stringify(mappedUser));

      // 2️⃣ gọi API lấy thông tin user
      try {
      const res = await getUserById(userId);

      const userData = res.data; // đúng theo API bạn gửi trước

      localStorage.setItem("fullName", userData.fullName || "");
      localStorage.setItem("user", userData.userName || "");

      } catch (fullNameError) {
        localStorage.removeItem("fullName");
      }

      // 3️⃣ lưu user
      toast.success("Đăng nhập thành công!");

      navigate("/");

    } catch (submitError) {
      const message =
        submitError?.response?.data?.message ||
        submitError.message ||
        "Sai ID hoặc mật khẩu!";

      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">

        {/* LEFT */}
        <div className="hidden md:flex flex-col items-center justify-center bg-green-700 text-white p-10">

          <img
            src={logo}
            alt="KIDO Logo"
            className="w-56 h-56 object-cover rounded-full shadow-xl border-8 border-white mb-6"
          />

          <h1 className="text-3xl font-bold tracking-wide">
            KIDO Education
          </h1>

        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center p-10">

          <div className="w-full max-w-md relative">

            <img
              src={cancelIcon}
              alt="cancel"
              onClick={() => navigate("/")}
              className="w-6 h-6 absolute top-0 right-0 cursor-pointer hover:scale-110 transition"
            />

            <h2 className="text-2xl font-bold text-green-700 mb-8 text-center">
              Đăng nhập
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block text-sm font-medium mb-2">
                  ID
                </label>

                <input
                  type="text"
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Nhập ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mật khẩu
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Nhập mật khẩu"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-800 transition"
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>

            </form>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
