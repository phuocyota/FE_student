
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Clock } from "lucide-react";
import avatar from "../assets/avatar.png";
import { startAttempt, getAttemptList } from "../api/attempt";
import { API } from "../api/endpoint";
import { fetch, parseResponse } from "../api/client";
import { getCurrentUser } from "../api/student";
const ExamDetail = () => {
  const { examSetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // console.log("🔥 SUBJECT:", location.state);
  const subjectName = location.state?.subject?.name;
  // console.log("🔥 SUBJECT NAME:", location.state?.subject?.name);

  const [exam, setExam] = useState(null);

  useEffect(() => {
    const data =
      location.state?.exam ||
      JSON.parse(localStorage.getItem("current_exam") || "null");

    setExam(data);
  }, [location.state]);

  const examSetName = location.state?.examSetName || "Danh sách đề";

  const [questionBanks, setQuestionBanks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH QUESTION BANK =================
  useEffect(() => {
    const fetchExamDetail = async () => {
      try {
        const res = await fetch(API.EXAM_SET.DETAIL(examSetId));
        const data = await parseResponse(res);

        const qBanks = data?.data?.questionBanks || [];
        setQuestionBanks(qBanks);

        // 🔥 FIX: set exam giống header
        if (qBanks.length && !exam) {
          const first = qBanks[0];

          const examItem = {
            id: first.id,
            title: first.title,
            examSetId
          };

          localStorage.setItem("current_exam", JSON.stringify(examItem));
          setExam(examItem);
        }

      } catch (err) {
        console.error(err);
      }
    };

    fetchExamDetail();
  }, [examSetId]);
  // ================= START EXAM =================
  // const handleStartExam = async (qb) => {
  //   try {
  //     const res = await startAttempt({
  //       questionBankId: qb.id,
  //       examSetId,
  //     });

  //     if (res.success) {
  //       navigate(`/exam-doing/${qb.id}`, {
  //         state: {
  //           attemptId: res.data.attemptId,
  //           questions: res.data.questions,
  //         },
  //       });
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };
  const [isStarting, setIsStarting] = useState(false);

  const handleStartExam = async (qb) => {
    if (isStarting) return; // ❌ chặn bấm nhiều lần

    setIsStarting(true);

    try {
      const res = await startAttempt({
        questionBankId: qb.id,
        examSetId,
      });

      if (res.success) {
        // 🔥 Lưu questionBankName từ API
        const updatedExam = {
          ...exam,
          title: res.data.questionBankName || qb.title,
        };
        setExam(updatedExam);
        localStorage.setItem("current_exam", JSON.stringify(updatedExam));

        navigate(`/exam-doing/${qb.id}`, {
          state: {
            attemptId: res.data.attemptId,
            questions: res.data.questions,
          },
        });
      }
    } catch (error) {
      console.error(error);
      setIsStarting(false); // nếu lỗi thì mở lại
    }
  };

  // ================= FORMAT TIME =================
  const calculateTime = (start, end) => {
    if (!start || !end) return "--";
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes} phút ${seconds} giây`;
  };

  // ================= FETCH HISTORY =================
  useEffect(() => {
    if (!exam?.id) return;

    const fetchHistory = async () => {
      try {
        const res = await getAttemptList({
          questionBankId: exam.id,
          examSetId,
          page: 1,
          size: 1000,
          status: "SUBMITTED",
        });

        if (res.success) {
          const mapped = res.data.data.map(item => ({
            attemptId: item.id,
            score: item.score || 0,
            total: item.fullScore || 10,
            date: item.submittedAt || item.startedAt,
            time: calculateTime(item.startedAt, item.submittedAt),
          }));

          setHistory(mapped);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

  }, [exam?.id, examSetId]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ================= POPUP =================
  const [showPopup, setShowPopup] = useState(false);
  const [score, setScore] = useState(0);
  const [lastExam, setLastExam] = useState(null);
// xem chứng chỉ 
  const getCertificateLevel = (score) => {
    if (score >= 8) return "Xuất sắc";
    if (score >= 5) return "Hoàn thành";
    return "Chưa hoàn thành";
  };

  useEffect(() => {
  const handlePopup = async () => {
    const result = localStorage.getItem("exam_result_popup");
    if (!result) return;

    const data = JSON.parse(result);

    // console.log("🔥 RESULT DATA:", data);
    console.log("🔥 LAST EXAM:", lastExam);

    setScore(data.score);
    setLastExam(data);

    
    setShowPopup(true);

    try {
      // 🔥 lấy user
      let user = JSON.parse(localStorage.getItem("user") || "null");

      if (!user) {
        const res = await getCurrentUser();
        const u = res.data;

        user = {
          fullName: u.fullName,
          className: u.className,
          school: u.schoolName,
        };

        localStorage.setItem("user", JSON.stringify(user));
      }

      // 🔥 LẤY SUBJECT THẬT
      const subjectName =
  location.state?.subject?.name ||
  JSON.parse(localStorage.getItem("current_subject"))?.name ||
  "Unknown";
      // 🔥 tạo certificate
      const newCert = {
        id: Date.now(),
        subject: subjectName,
        name: user.fullName,
        className: user.className,
        school: user.school,
        level: getCertificateLevel(data.score),
        date: new Date().toISOString(),
      };

      // 🔥 LƯU LIST (KHÔNG GHI ĐÈ)
      const oldList = JSON.parse(localStorage.getItem("certificates") || "[]");

      localStorage.setItem(
        "certificates",
        JSON.stringify([newCert, ...oldList])
      );

    } catch (err) {
      console.error("Create certificate error:", err);
    }

    localStorage.removeItem("exam_result_popup");
  };

  handlePopup();
}, []);
  // ================= FORMAT DATE =================
  const formatDateVN = (date) =>
    new Date(date).toLocaleDateString("vi-VN");

  if (loading) {
    return <div className="text-center py-20">Đang tải...</div>;
  }

  

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4">

        <div className="bg-white p-6 rounded-xl">

          {/* BACK */}
          <button onClick={() => navigate(-1)} className="text-blue-600 mb-4">
            ← Quay lại
          </button>

          {/* TITLE */}
          <h1 className="text-xl font-semibold mb-6">
            {examSetName}
          </h1>

          {/* ================= LIST QUESTION ================= */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Danh sách đề</h2>

            {questionBanks.map((qb) => (
              <div
                key={qb.id}
                className="border border-gray-400 p-4 rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3>{qb.title}</h3>
                  <p className="text-sm text-gray-500">
                    ⏱ {qb.durationSeconds
                      ? `${qb.durationSeconds / 60} phút`
                      : "Không rõ"}
                  </p>
                </div>

                <button
                  onClick={() => handleStartExam(qb)}
                  disabled={isStarting}
                  className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700 transition"
                >
                  {isStarting ? "Đang vào bài..." : "Làm bài"}
                </button>
              </div>
            ))}
          </div>

          {/* ================= HISTORY ================= */}
          {history.length > 0 && (
            <div className="mt-12">
              <h2 className="font-semibold mb-4">
                Đã thi {history.length} lần (đã nộp bài)
              </h2>

              {(() => {
                const highestIndex = history.reduce(
                  (maxIndex, item, index, arr) =>
                    item.score > arr[maxIndex].score ? index : maxIndex,
                  0
                );

                const highestAttempt = history[highestIndex];

                const otherAttempts = history.filter(
                  (_, index) => index !== highestIndex
                );

                const totalPages = Math.ceil(otherAttempts.length / itemsPerPage);

                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;

                const currentHistory = otherAttempts.slice(startIndex, endIndex);

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse">

                      <thead>
                        <tr className="bg-gray-100 text-gray-600">
                          <th className="px-6 py-3">Lần</th>
                          <th className="px-6 py-3">Ngày</th>
                          <th className="px-6 py-3">Điểm</th>
                          <th className="px-6 py-3">Thời gian</th>
                          <th className="px-6 py-3">Hành động</th>
                        </tr>
                      </thead>

                      <tbody className="text-sm">

                        {/* 🏆 CAO NHẤT */}
                        <tr className="bg-yellow-50 font-semibold border-b border-gray-300">
                          <td className="py-4 px-6">🏆 Cao nhất</td>

                          <td className="py-4 px-6">
                            {formatDateVN(highestAttempt.date)}
                          </td>

                          <td className="py-4 px-6 text-red-600 font-bold text-base">
                            {highestAttempt.score}/{highestAttempt.total}
                          </td>

                          <td className="py-4 px-6">
                            {highestAttempt.time}
                          </td>

                          <td className="py-4 px-6">
                            <button
                              onClick={() =>
                                navigate(`/exam-review/${exam?.id}`, {
                                  state: {
                                    attemptId: highestAttempt.attemptId
                                  }
                                })
                              }
                              className="px-4 py-2 text-green-700 border rounded-full hover:bg-green-600 hover:text-white transition"
                            >
                              XEM
                            </button>
                          </td>
                        </tr>

                        {/* CÁC LẦN KHÁC */}
                        {currentHistory.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-300 hover:bg-gray-50 transition"
                          >
                            <td className="py-4 px-6 font-medium">
                              Lần {startIndex + index + 1}
                            </td>

                            <td className="py-4 px-6">
                              {formatDateVN(item.date)}
                            </td>

                            <td className="py-4 px-6 text-red-600 font-semibold text-base">
                              {item.score}/{item.total}
                            </td>

                            <td className="py-4 px-6 text-gray-600">
                              {item.time}
                            </td>

                            <td className="py-4 px-6">
                              <button
                                onClick={() =>
                                  navigate(`/exam-review/${exam?.id}`, {
                                    state: {
                                      attemptId: item.attemptId
                                    }
                                  })
                                }
                                className="px-4 py-2 text-green-700 border rounded-full hover:bg-green-600 hover:text-white transition"
                              >
                                XEM
                              </button>
                            </td>
                          </tr>
                        ))}

                      </tbody>
                    </table>
                    {/* phân trang */}
                    <div className="flex justify-center items-center gap-4 mt-6">

                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        ←
                      </button>

                      <span className="text-sm font-medium">
                        Trang {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage(prev => Math.min(prev + 1, totalPages))
                        }
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        →
                      </button>

                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================= RANKING ================= */}
          <div className="mt-12 px-3">
            <h2 className="text-2xl font-bold mb-6 text-center">
              BẢNG XẾP HẠNG
            </h2>

            <div className="w-full md:w-2/3 mx-auto bg-gray-100 rounded-3xl p-6">

              <h3 className="text-center text-gray-600 mb-6">
                Top thành viên điểm cao
              </h3>

              {/* TOP 3 */}
              <div className="flex justify-center gap-10 mb-8">

                {[2, 1, 3].map((rank) => (
                  <div key={rank} className="text-center">
                    <img
                      src={avatar}
                      className={`rounded-full mx-auto ${rank === 1 ? "w-16 h-16 border-4 border-yellow-400" : "w-12 h-12"
                        }`}
                    />
                    <p className="mt-2 text-sm">User {rank}</p>
                    <p className="text-red-600 font-semibold">10 điểm</p>
                  </div>
                ))}

              </div>

              {/* LIST */}
              <div className="space-y-3">
                {[4, 5, 6, 7, 8].map((rank) => (
                  <div key={rank} className="flex justify-between bg-white p-3 rounded-xl">
                    <div className="flex gap-3 items-center">
                      <span>{rank}</span>
                      <img src={avatar} className="w-8 h-8 rounded-full" />
                      <span>User {rank}</span>
                    </div>
                    <span className="text-red-600">10 điểm</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>


      {/* ================= POPUP ================= */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white p-8 rounded-2xl text-center shadow-xl w-[350px]">

            {/* TITLE */}
            <h2 className="text-green-600 font-bold text-xl mb-4">
              🎉 Chúc mừng!
            </h2>

            {/* SCORE */}
            <p className="text-gray-700">
              Bạn đạt
            </p>

            <p className="text-3xl font-bold text-blue-600 mt-1">
              {score} điểm
            </p>

            {/* LEVEL */}
            <p className="mt-3 text-gray-600">
              Xếp loại:
            </p>

            <p className="text-lg font-bold text-red-600">
              {getCertificateLevel(score)}
            </p>

            {/* NOTE */}
            {score >= 5 && (
              <p className="text-sm text-gray-500 mt-2">
                🎓 Bạn đủ điều kiện nhận chứng chỉ
              </p>
            )}

            {/* BUTTON */}
            <div className="flex justify-center gap-3 mt-6">

              {/* ĐÓNG */}
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Đóng
              </button>

              {/* XEM CHỨNG CHỈ */}
              <button
                onClick={() => navigate("/profile-user")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🎓 Chứng chỉ
              </button>

              {/* LÀM LẠI */}
              <button
                onClick={async () => {
                  if (!lastExam) return;

                  try {
                    const res = await startAttempt({
                      questionBankId: lastExam.questionBankId,
                      examSetId: lastExam.examSetId
                    });

                    if (res.success) {
                      navigate(`/exam-doing/${lastExam.questionBankId}`, {
                        state: {
                          attemptId: res.data.attemptId,
                          questions: res.data.questions
                        }
                      });
                    }

                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Làm lại
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamDetail;