import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import avatar from "../assets/avatar.png";
import { useLocation } from "react-router-dom";
import { startAttempt } from "../api/attempt";
const ExamDetail = () => {
  const { examSetId, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const exam =
  location.state?.exam ||
  JSON.parse(localStorage.getItem("current_exam"));

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const examTitle = exam?.title || "Đề thi";
  

  // load lịch sử làm bài
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`exam_${id}`)) || [];
    setHistory(saved);
    setLoading(false);
  }, [id]);

  // redirect nếu không có exam
  // useEffect(() => {
  //   if (!loading && !exam) {
  //     navigate(`/exam-set/${examSetId}`);
  //   }
  // }, [loading, exam, examSetId, navigate]);

  // bắt đầu thi
  const handleMockTest = async () => {
    try {
      const payload = {
        questionBankId: id,   // ⚠️ phải dùng id từ params
        examSetId: examSetId
      };

      const res = await startAttempt(payload);

      if (res.success) {
        const attemptId = res.data.attemptId;
        const questions = res.data.questions;

        navigate(`/exam-doing/${id}`, {
          state: {
            attemptId,
            questions
          }
        });
      }

    } catch (error) {
      console.error("Start attempt error:", error);
    }
  };

  // format ngày
  const formatDateVN = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // tìm lần thi cao nhất
  const highestIndex = history.length
    ? history.reduce(
        (maxIndex, item, index, arr) =>
          item.score > arr[maxIndex].score ? index : maxIndex,
        0
      )
    : -1;

  const highestAttempt = highestIndex !== -1 ? history[highestIndex] : null;

  // phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredHistory =
    highestIndex !== -1
      ? history.filter((_, index) => index !== highestIndex)
      : history;

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentHistory = filteredHistory.slice(startIndex, endIndex);

  // popup kết quả
  const [showPopup, setShowPopup] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const result = localStorage.getItem("exam_result_popup");

    if (result) {
      const data = JSON.parse(result);

      setScore(data.score);
      setTotal(data.total);
      setShowPopup(true);

      localStorage.removeItem("exam_result_popup");
    }
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      {/* <div className="max-w-6xl mx-auto px-4"> */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl">

          <button
            onClick={() => navigate(`/exam-set/${examSetId}`)}
            className="text-blue-600 text-sm mb-4 cursor-pointer "
          >
            ← Quay lại
          </button>

          <div className="flex items-center justify-between w-full gap-6">


            {/* LEFT SIDE */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">
                  {exam?.title}
                </h1>
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                <Clock size={16} /> {exam?.time}
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

              {(() => {
                // tìm lần thi điểm cao nhất
                const highestIndex = history.reduce(
                  (maxIndex, item, index, arr) =>
                    item.score > arr[maxIndex].score ? index : maxIndex,
                  0
                );

                const highestAttempt = history[highestIndex];

                return (
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

                        {/* ===== HÀNG CAO NHẤT ===== */}
                        <tr className="bg-yellow-50 font-semibold">
                          <td className="px-8 py-3">🏆 Cao nhất</td>

                          <td className="px-8 py-3">
                            {formatDateVN(highestAttempt.date)}
                          </td>

                          <td className="px-8 py-3 text-red-600 text-base">
                            {highestAttempt.score}/{highestAttempt.total}
                          </td>

                          <td className="px-8 py-3">
                            {highestAttempt.time}
                          </td>

                          <td className="px-8 py-3">
                            <button
                              onClick={() =>
                                navigate(`/exam-review/${id}`, {
                                  state: {
                                    attemptId: highestAttempt.attemptId,
                                    examTitle: exam?.title
                                  }
                                })
                              }
                              className="px-10 py-3 text-green-700 text-sm font-semibold bg-white
  hover:bg-green-600 hover:text-white transition-all rounded-full cursor-pointer"
                            >
                              XEM
                            </button>
                          </td>
                        </tr>

                        {/* ===== CÁC LẦN CÒN LẠI ===== */}
                        {currentHistory.map((item, index) => (
                          <tr
                            key={index}
                            className="bg-white hover:bg-gray-50 transition"
                          >
                            <td className="px-8 py-3">
                              Lần {startIndex + index + 1}
                            </td>

                            <td className="px-8 py-3">
                              {formatDateVN(item.date)}
                            </td>

                            <td className="px-8 py-3 font-semibold text-red-600 text-base">
                              {item.score}/{item.total}
                            </td>

                            <td className="px-8 py-3">
                              {item.time}
                            </td>

                            <td className="px-8 py-3">
                              <button
                                onClick={() =>
                                  navigate(`/exam-review/${id}`, {
                                    state: {
                                      attemptId: item.attemptId,
                                      examTitle: exam?.title
                                    }
                                  })
                                }
                                className="px-10 py-3 text-green-700 text-sm font-semibold bg-white
                        hover:bg-green-600 hover:text-white transition-all rounded-full cursor-pointer"
                              >
                                XEM
                              </button>
                            </td>
                          </tr>
                        ))}

                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ===== PAGINATION ===== */}
          <div className="flex justify-center items-center gap-4 mt-6">

            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition"
            >
              ←
            </button>

            <span className="text-sm font-medium">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
              }
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition"
            >
              →
            </button>

          </div>

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


      {/* popup kết quả thi */}

      {
        showPopup && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[400px] text-center shadow-lg">
              <h2 className="text-xl font-bold text-green-600 mb-3">
                🎉 Chúc mừng!
              </h2>

              <p className="text-gray-700 mb-6">
                Bạn đã đạt <span className="font-bold text-blue-600">{score}</span> điểm
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Đóng
                </button>

                <button
                  onClick={handleMockTest}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Làm lại
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >

  );
};

export default ExamDetail;