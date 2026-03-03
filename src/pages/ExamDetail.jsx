import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import avatar from "../assets/avatar.png";
const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  const examTitle = "Đề kiểm tra 15 phút - Đề số 02";

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`exam_${id}`)) || [];
    setHistory(saved);
  }, [id]);

  const handleMockTest = () => {
    navigate(`/exam-doing/${id}`);
  };
  const formatDateVN = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      {/* <div className="max-w-6xl mx-auto px-4"> */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl">

          <button
            onClick={() => navigate("/exam-list")}
            className="text-blue-600 text-sm mb-4 cursor-pointer "
          >
            ← Quay lại
          </button>

          <div className="flex items-center justify-between w-full gap-6">


            {/* LEFT SIDE */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">
                  {examTitle}
                </h1>
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                <Clock size={16} /> 15 phút
              </div>
            </div>

            <button
              onClick={handleMockTest}
              className="bg-green-700 hover:bg-green-800
             text-white font-bold text-lg
             min-w-[100px]
             py-4 px-6
             rounded-full
             flex items-center justify-end
             flex-shrink-0
             transition duration-200"
            >
              THI THỬ
            </button>

          </div>

          {/* HISTORY TABLE */}
          {history.length > 0 && (
            <div className="mt-12">
              <h2 className="font-semibold mb-4">
                Đã thi {history.length} lần
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600">
                      <th className="px-8 py-3">Lần</th>
                      <th className="px-8 py-3">Ngày</th>
                      <th className="px-8 py-3">Điểm</th>
                      <th className="px-8 py-3">Thời gian</th>
                      <th className="px-8 py-3">Hành động</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item, index) => (
                      <tr
                        key={index}
                        className="bg-white hover:bg-gray-50 transition"
                      >
                        <td className="px-8 py-3">Lần {index + 1}</td>

                        <td className="px-8 py-3">
                          {formatDateVN(item.date)}
                        </td>

                        <td className="px-8 py-3 font-semibold text-red-600 text-base">
                          {item.score}
                        </td>

                        <td className="px-8 py-3">{item.time}</td>

                        <td className="px-8 py-3      ">
                          <button
                            onClick={() =>
                              navigate(`/exam-doing/${id}?review=${index}`)
                            }
                            className="
  px-10
  py-3
  text-green-700
  text-sm font-semibold
  bg-white
  hover:bg-green-600 hover:text-white hover:border-green-600
  active:scale-95
  transition-all duration-200 cursor-pointer
  rounded-full
"
                          >
                            XEM
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================== BẢNG XẾP HẠNG ================== */}
          <div className="mt-12 px-3">

            <h2 className="text-2xl font-bold mb-6 text-center">
              BẢNG XẾP HẠNG
            </h2>

            {/* Container responsive */}
            <div className="w-full md:w-3/4 lg:w-1/2 mx-auto bg-gray-100 rounded-3xl p-5 sm:p-8">

              <h3 className="text-center text-gray-600 mb-8">
                Top thành viên điểm cao
              </h3>

              {/* ================= TOP 3 ================= */}
              {/* ================= TOP 3 ================= */}
              <div className="flex justify-center items-end gap-6 sm:gap-12 mb-10">

                {/* HẠNG 2 */}
                <div className="text-center translate-y-4 sm:translate-y-6">
                  <img
                    src={avatar}
                    alt=""
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto"
                  />
                  <p className="mt-2 font-medium text-xs sm:text-base">
                    Huỳnh Thị B...
                  </p>
                  <p className="text-red-600 font-semibold text-sm sm:text-base">
                    10 điểm
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    1 phút 20 giây
                  </p>
                </div>

                {/* HẠNG 1 */}
                <div className="text-center">
                  <img
                    src={avatar}
                    alt=""
                    className="
        w-14 h-14 sm:w-20 sm:h-20
        rounded-full object-cover
        border-4 border-yellow-400
        mx-auto
      "
                  />
                  <p className="mt-2 font-semibold text-xs sm:text-base">
                    Đặng Thị Vân...
                  </p>
                  <p className="text-red-600 font-semibold text-sm sm:text-base">
                    10 điểm
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    0 phút 42 giây
                  </p>
                </div>

                {/* HẠNG 3 */}
                <div className="text-center translate-y-4 sm:translate-y-6">
                  <img
                    src={avatar}
                    alt=""
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto"
                  />
                  <p className="mt-2 font-medium text-xs sm:text-base">
                    Phạm Thị Mi...
                  </p>
                  <p className="text-red-600 font-semibold text-sm sm:text-base">
                    10 điểm
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    1 phút 42 giây
                  </p>
                </div>

              </div>

              {/* ================= DANH SÁCH 4-10 ================= */}
              <div className="space-y-3">

                {[4, 5, 6, 7, 8, 9, 10].map((rank) => (
                  <div
                    key={rank}
                    className="
            flex 
            items-center 
            justify-between 
            bg-white 
            px-4 sm:px-6 
            py-3 sm:py-4 
            rounded-xl
          "
                  >

                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="
              w-8 h-8 
              sm:w-10 sm:h-8 
              rounded-full 
              bg-gray-200 
              flex items-center justify-center 
              text-xs sm:text-sm
            ">
                        {rank}
                      </span>

                      <img
                        src={avatar}
                        alt="avatar"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                      />

                      <span className="font-medium text-sm sm:text-base">
                        Thành viên {rank}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-red-600 font-semibold text-sm sm:text-base">
                        10 điểm
                      </p>
                      <p className="text-xs text-gray-500">
                        2 phút 02 giây
                      </p>
                    </div>

                  </div>
                ))}

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>

  );
};

export default ExamDetail;