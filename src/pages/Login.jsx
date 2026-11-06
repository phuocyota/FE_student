 

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo_ichi.png";
import toast from "react-hot-toast";
import cancelIcon from "../assets/cancle.png";
import { loginStudent } from "../api/auth";
import { getCurrentUser } from "../api/student";

const Login = () => {
  // localStorage.clear();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = location.state?.from;
  const redirectPath =
    typeof requestedPath === "string" && requestedPath.startsWith("/")
      ? requestedPath
      : "/";

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

      // 2️⃣ gọi API lấy thông tin user
      try {
        const res = await getCurrentUser();
        const userData = res.data ?? res;

        localStorage.setItem("fullName", userData.fullName || "");
        localStorage.setItem("user", userData.userName || form.id);
        localStorage.setItem("studentAvatar", userData.avatar || "");
        localStorage.setItem("studentSchoolName", userData.schoolName || "");
        localStorage.setItem("studentClassName", userData.className || "");
      } catch (fullNameError) {
        console.error("Lỗi fetch user:", fullNameError);
        localStorage.setItem("user", form.id);
        localStorage.removeItem("studentAvatar");
        localStorage.removeItem("studentSchoolName");
        localStorage.removeItem("studentClassName");
      }

      // 3️⃣ lưu user
      toast.success("Đăng nhập thành công!");

      navigate(redirectPath, { replace: true });

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
              aria-label="Đóng đăng nhập"
              onClick={() => navigate("/")}
              className="w-6 h-6 absolute top-0 right-0 cursor-pointer hover:scale-110 transition"
            >
              <img src={cancelIcon} alt="" className="h-full w-full" />
            </button>

            <h2 className="text-2xl font-bold text-green-700 mb-8 text-center">
              Đăng nhập
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label htmlFor="login-id" className="block text-sm font-medium mb-2">
                  ID
                </label>

                <input
                  type="text"
                  id="login-id"
                  name="id"
                  autoComplete="username"
                  value={form.id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Nhập ID"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium mb-2">
                  Mật khẩu
                </label>

                <input
                  type="password"
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
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

            <button type="button" disabled={isSubmitting} onClick={() => navigate("/register", { state: location.state })} className="mt-4 w-full rounded-xl border border-green-700 py-3 font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60">
              Đăng ký
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
