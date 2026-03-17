// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import logo from "../assets/kido.jpg";
// import toast from "react-hot-toast";
// import cancelIcon from "../assets/cancle.png";
// import { loginStudent } from "../api/auth";

// const Login = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     id: "",
//     password: "",
//   });

//   const [error, setError] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   };

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

//       // Lấy đúng dữ liệu từ API
//       const payload = response?.data?.data || response?.data || response;

//       const accessToken = payload?.accessToken;
//       const userId = payload?.userId;
//       const userType = payload?.userType;

//       if (!accessToken) {
//         throw new Error("Không nhận được accessToken");
//       }

//       // Lưu vào localStorage

//       localStorage.setItem("accessToken", accessToken);
//       localStorage.setItem("userId", userId);
//       localStorage.setItem("userType", userType);
//       localStorage.setItem("user", form.id);

//       toast.success("Đăng nhập thành công!");

//       navigate("/");

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

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
//       <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">

//         {/* LEFT SIDE */}
//         <div className="hidden md:flex flex-col items-center justify-center bg-green-700 text-white p-10">

//           <img
//             src={logo}
//             alt="KIDO Logo"
//             className="w-56 h-56 object-cover rounded-full shadow-xl border-8 border-white mb-6"
//           />

//           <h1 className="text-3xl font-bold tracking-wide">
//             KIDO Education
//           </h1>

//         </div>

//         {/* RIGHT SIDE */}
//         <div className="flex items-center justify-center p-10">

//           <div className="w-full max-w-md relative">

//             <img
//               src={cancelIcon}
//               alt="cancel"
//               onClick={() => navigate("/")}
//               className="w-6 h-6 absolute top-0 right-0 cursor-pointer hover:scale-110 transition"
//             />

//             <h2 className="text-2xl font-bold text-green-700 mb-8 text-center">
//               Đăng nhập
//             </h2>

//             <form onSubmit={handleSubmit} className="space-y-6">

//               <div>
//                 <label className="block text-sm font-medium mb-2">
//                   ID
//                 </label>

//                 <input
//                   type="text"
//                   name="id"
//                   value={form.id}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600"
//                   placeholder="Nhập ID"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-2">
//                   Mật khẩu
//                 </label>

//                 <input
//                   type="password"
//                   name="password"
//                   value={form.password}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600"
//                   placeholder="Nhập mật khẩu"
//                 />
//               </div>

//               {error && (
//                 <div className="text-red-500 text-sm text-center">
//                   {error}
//                 </div>
//               )}

//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-800 transition"
//               >
//                 {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
//               </button>

//             </form>

//           </div>

//         </div>

//       </div>
//     </div>
//   );
// };

// export default Login;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/kido.jpg";
import toast from "react-hot-toast";
import cancelIcon from "../assets/cancle.png";
import { loginStudent } from "../api/auth";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ⭐ kiểm tra token từ WebView2
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      console.log("Token tồn tại, auto login");
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

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

      // lưu token
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userType", userType);
      // localStorage.setItem("user", form.id);

      //setUser(form.id);

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