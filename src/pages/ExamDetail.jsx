// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Clock } from "lucide-react";
// import avatar from "../assets/avatar.png";
// import { useLocation } from "react-router-dom";
// import { startAttempt, getAttemptList } from "../api/attempt";
// import { API } from "../api/endpoint";
// import { fetch, parseResponse } from "../api/client";
// const ExamDetail = () => {
//   const { examSetId, id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const exam =
//     location.state?.exam ||
//     JSON.parse(localStorage.getItem("current_exam"));

//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const examTitle = exam?.title || "Đề thi";
//   const [questionBanks, setQuestionBanks] = useState([]);


//   // load lịch sử làm bài
//   useEffect(() => {
//     const fetchHistory = async () => {
//       try {
//         const res = await getAttemptList({
//           questionBankId: id,
//           examSetId: examSetId,
//           page: 1,
//           size: 1000,
//           status: "SUBMITTED",
//         });

//         if (res.success) {
//           const mapped = res.data.data
//             .map(item => ({
//               attemptId: item.id,
//               score: item.score || 0,
//               total: item.questionBank?.totalScore || 100,
//               date: item.submittedAt || item.startedAt,
//               time: calculateTime(item.startedAt, item.submittedAt),
//             }))
//             .sort((a, b) => new Date(b.date) - new Date(a.date));

//           setHistory(mapped);
//         }
//       } catch (error) {
//         console.error("Fetch history error:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchHistory();
//   }, [id, examSetId]);

//   //gọi api lấy thông tin chi tiết đề thi (để lấy danh sách question bank)
// useEffect(() => {
//   const fetchExamDetail = async () => {
//     try {
//       const res = await fetch(API.EXAM_SET.DETAIL(examSetId));
//       const data = await parseResponse(res);

//       const qBanks = data?.data?.questionBanks || [];

//       setQuestionBanks(qBanks);

//     } catch (err) {
//       console.error("Fetch exam detail error:", err);
//     }
//   };

//   if (examSetId) {
//     fetchExamDetail();
//   }
// }, [examSetId]);

//   const calculateTime = (start, end) => {
//     if (!start || !end) return "--";

//     const diff = new Date(end) - new Date(start);

//     const minutes = Math.floor(diff / 60000);
//     const seconds = Math.floor((diff % 60000) / 1000);

//     return `${minutes} phút ${seconds} giây`;
//   };

//   // bắt đầu thi
//   // const handleMockTest = async () => {
//   //   try {
//   //     const payload = {
//   //       questionBankId: id,
//   //       examSetId: examSetId
//   //     };

//   //     const res = await startAttempt(payload);

//   //     if (res.success) {
//   //       const attemptId = res.data.attemptId;
//   //       const questions = res.data.questions;

//   //       navigate(`/exam-doing/${id}`, {
//   //         state: {
//   //           attemptId,
//   //           questions
//   //         }
//   //       });
//   //     }

//   //   } catch (error) {
//   //     console.error("Start attempt error:", error);
//   //   }
//   // };

// //   const handleMockTest = async () => {
// //   try {
// //     if (!questionBanks.length) {
// //       alert("Chưa có ngân hàng câu hỏi");
// //       return;
// //     }

// //     const questionBankId = questionBanks[0].id; // 👈 lấy cái đầu

// //     const payload = {
// //       questionBankId,
// //       examSetId
// //     };

// //     const res = await startAttempt(payload);

// //     if (res.success) {
// //       navigate(`/exam-doing/${questionBankId}`, {
// //         state: {
// //           attemptId: res.data.attemptId,
// //           questions: res.data.questions
// //         }
// //       });
// //     }

// //   } catch (error) {
// //     console.error("Start attempt error:", error);
// //   }
// // };

//   // format ngày
//   const formatDateVN = (dateString) => {
//     const date = new Date(dateString);

//     return date.toLocaleDateString("vi-VN", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//   };

//   // tìm lần thi cao nhất
//   const highestIndex = history.length
//     ? history.reduce(
//       (maxIndex, item, index, arr) =>
//         item.score > arr[maxIndex].score ? index : maxIndex,
//       0
//     )
//     : -1;

//   const highestAttempt = highestIndex !== -1 ? history[highestIndex] : null;

//   // phân trang
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const filteredHistory =
//     highestIndex !== -1
//       ? history.filter((_, index) => index !== highestIndex)
//       : history;

//   const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;

//   const currentHistory = filteredHistory.slice(startIndex, endIndex);

//   // popup kết quả
//   const [showPopup, setShowPopup] = useState(false);
//   const [score, setScore] = useState(0);
//   const [total, setTotal] = useState(0);

//   useEffect(() => {
//     const result = localStorage.getItem("exam_result_popup");

//     if (result) {
//       const data = JSON.parse(result);

//       setScore(data.score);
//       setTotal(data.total);
//       setShowPopup(true);

//       localStorage.removeItem("exam_result_popup");
//     }
//   }, []);

//   const handleStartExam = async (qb) => {
//   try {
//     const payload = {
//       questionBankId: qb.id,
//       examSetId
//     };

//     const res = await startAttempt(payload);

//     if (res.success) {
//       navigate(`/exam-doing/${qb.id}`, {
//         state: {
//           attemptId: res.data.attemptId,
//           questions: res.data.questions
//         }
//       });
//     }

//   } catch (error) {
//     console.error(error);
//   }
// };

//   return (
//     <div className="bg-gray-100 min-h-screen py-6">
//       {/* <div className="max-w-6xl mx-auto px-4"> */}
//       <div className="max-w-7xl mx-auto px-3 sm:px-6">

//         {/* HEADER */}
//         <div className="bg-white p-6 rounded-xl">

//           <button
//             // onClick={() => navigate(`/exam-set/${examSetId}`)}
//             onClick={() => navigate(-1)}
//             className="text-blue-600 text-sm mb-4 cursor-pointer "
//           >
//             ← Quay lại
//           </button>

//           <div className="flex items-center justify-between w-full gap-6">


//             {/* LEFT SIDE */}
//             <div className="flex-1">
//               <div className="flex items-center gap-2">
//                 <h1 className="text-xl font-semibold">
//                   {exam?.title}
//                 </h1>
//               </div>

//               <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
//                 <Clock size={16} /> {exam?.time}
//               </div>
//             </div>

//             <button
//               onClick={handleMockTest}
//               className="bg-green-700 hover:bg-green-800
//              text-white font-bold text-lg
//              min-w-[100px]
//              py-4 px-6
//              rounded-full
//              flex items-center justify-end
//              flex-shrink-0
//              transition duration-200"
//             >
//               THI THỬ
//             </button>

//           </div>

//           <div className="mt-8 space-y-4">
//   <h2 className="font-semibold text-lg">Danh sách đề</h2>

//   {questionBanks.length === 0 && (
//     <div className="text-gray-500">Chưa có đề</div>
//   )}

//   {questionBanks.map((qb) => (
//     <div
//       key={qb.id}
//       className="border p-4 rounded-lg flex justify-between items-center"
//     >
//       <div>
//         <h3 className="font-medium">{qb.title}</h3>
//         <p className="text-sm text-gray-500">
//           ⏱ {qb.durationSeconds / 60 || 0} phút
//         </p>
//       </div>

//       <button
//         onClick={() => handleStartExam(qb)}
//         className="bg-green-600 text-white px-4 py-2 rounded"
//       >
//         Làm bài
//       </button>
//     </div>
//   ))}
// </div>

//           {/* HISTORY TABLE */}
//           {history.length > 0 && (
//             <div className="mt-12">
//               <h2 className="font-semibold mb-4">
//                 Đã thi {history.length} lần (đã nộp bài)
//               </h2>

//               {(() => {
//                 // tìm lần thi điểm cao nhất
//                 if (!history.length) return null;

//                 const highestIndex = history.reduce(
//                   (maxIndex, item, index, arr) =>
//                     item.score > arr[maxIndex].score ? index : maxIndex,
//                   0
//                 );

//                 const highestAttempt = history[highestIndex];

//                 return (
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-sm text-center border-collapse">
//                       <thead>
//                         <tr className="bg-gray-100 text-gray-600">
//                           <th className="px-8 py-3">Lần</th>
//                           <th className="px-8 py-3">Ngày</th>
//                           <th className="px-8 py-3">Điểm</th>
//                           <th className="px-8 py-3">Thời gian</th>
//                           <th className="px-8 py-3">Hành động</th>
//                         </tr>
//                       </thead>

//                       <tbody>

//                         {/* ===== HÀNG CAO NHẤT ===== */}
//                         <tr className="bg-yellow-50 font-semibold">
//                           <td className="px-8 py-3">🏆 Cao nhất</td>

//                           <td className="px-8 py-3">
//                             {formatDateVN(highestAttempt.date)}
//                           </td>

//                           <td className="px-8 py-3 text-red-600 text-base">
//                             {highestAttempt.score}/{highestAttempt.total}
//                           </td>

//                           <td className="px-8 py-3">
//                             {highestAttempt.time}
//                           </td>

//                           <td className="px-8 py-3">
//                             <button
//                               onClick={() =>
//                                 navigate(`/exam-review/${id}`, {
//                                   state: {
//                                     attemptId: highestAttempt.attemptId,
//                                     examTitle: exam?.title
//                                   }
//                                 })
//                               }
//                               className="px-10 py-3 text-green-700 text-sm font-semibold bg-white
//   hover:bg-green-600 hover:text-white transition-all rounded-full cursor-pointer"
//                             >
//                               XEM
//                             </button>
//                           </td>
//                         </tr>

//                         {/* ===== CÁC LẦN CÒN LẠI ===== */}
//                         {currentHistory.map((item, index) => (
//                           <tr
//                             key={index}
//                             className="bg-white hover:bg-gray-50 transition"
//                           >
//                             <td className="px-8 py-3">
//                               Lần {startIndex + index + 1}
//                             </td>

//                             <td className="px-8 py-3">
//                               {formatDateVN(item.date)}
//                             </td>

//                             <td className="px-8 py-3 font-semibold text-red-600 text-base">
//                               {item.score}/{item.total}
//                             </td>

//                             <td className="px-8 py-3">
//                               {item.time}
//                             </td>

//                             <td className="px-8 py-3">
//                               <button
//                                 onClick={() =>
//                                   navigate(`/exam-review/${id}`, {
//                                     state: {
//                                       attemptId: item.attemptId,
//                                       examTitle: exam?.title
//                                     }
//                                   })
//                                 }
//                                 className="px-10 py-3 text-green-700 text-sm font-semibold bg-white
//                         hover:bg-green-600 hover:text-white transition-all rounded-full cursor-pointer"
//                               >
//                                 XEM
//                               </button>
//                             </td>
//                           </tr>
//                         ))}

//                       </tbody>
//                     </table>
//                   </div>
//                 );
//               })()}
//             </div>
//           )}

//           {/* ===== PAGINATION ===== */}
//           <div className="flex justify-center items-center gap-4 mt-6">

//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition"
//             >
//               ←
//             </button>

//             <span className="text-sm font-medium">
//               Trang {currentPage} / {totalPages}
//             </span>

//             <button
//               onClick={() =>
//                 setCurrentPage((prev) =>
//                   Math.min(prev + 1, totalPages)
//                 )
//               }
//               disabled={currentPage === totalPages}
//               className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition"
//             >
//               →
//             </button>

//           </div>

//           {/* ================== BẢNG XẾP HẠNG ================== */}
//           <div className="mt-12 px-3">

//             <h2 className="text-2xl font-bold mb-6 text-center">
//               BẢNG XẾP HẠNG
//             </h2>

//             {/* Container responsive */}
//             <div className="w-full md:w-3/4 lg:w-1/2 mx-auto bg-gray-100 rounded-3xl p-5 sm:p-8">

//               <h3 className="text-center text-gray-600 mb-8">
//                 Top thành viên điểm cao
//               </h3>


//               {/* ================= TOP 3 ================= */}
//               <div className="flex justify-center items-end gap-6 sm:gap-12 mb-10">

//                 {/* HẠNG 2 */}
//                 <div className="text-center translate-y-4 sm:translate-y-6">
//                   <img
//                     src={avatar}
//                     alt=""
//                     className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto"
//                   />
//                   <p className="mt-2 font-medium text-xs sm:text-base">
//                     Huỳnh Thị B...
//                   </p>
//                   <p className="text-red-600 font-semibold text-sm sm:text-base">
//                     10 điểm
//                   </p>
//                   <p className="text-[10px] sm:text-xs text-gray-500">
//                     1 phút 20 giây
//                   </p>
//                 </div>

//                 {/* HẠNG 1 */}
//                 <div className="text-center">
//                   <img
//                     src={avatar}
//                     alt=""
//                     className="
//         w-14 h-14 sm:w-20 sm:h-20
//         rounded-full object-cover
//         border-4 border-yellow-400
//         mx-auto
//       "
//                   />
//                   <p className="mt-2 font-semibold text-xs sm:text-base">
//                     Đặng Thị Vân...
//                   </p>
//                   <p className="text-red-600 font-semibold text-sm sm:text-base">
//                     10 điểm
//                   </p>
//                   <p className="text-[10px] sm:text-xs text-gray-500">
//                     0 phút 42 giây
//                   </p>
//                 </div>

//                 {/* HẠNG 3 */}
//                 <div className="text-center translate-y-4 sm:translate-y-6">
//                   <img
//                     src={avatar}
//                     alt=""
//                     className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto"
//                   />
//                   <p className="mt-2 font-medium text-xs sm:text-base">
//                     Phạm Thị Mi...
//                   </p>
//                   <p className="text-red-600 font-semibold text-sm sm:text-base">
//                     10 điểm
//                   </p>
//                   <p className="text-[10px] sm:text-xs text-gray-500">
//                     1 phút 42 giây
//                   </p>
//                 </div>

//               </div>

//               {/* ================= DANH SÁCH 4-10 ================= */}
//               <div className="space-y-3">

//                 {[4, 5, 6, 7, 8, 9, 10].map((rank) => (
//                   <div
//                     key={rank}
//                     className="
//             flex 
//             items-center 
//             justify-between 
//             bg-white 
//             px-4 sm:px-6 
//             py-3 sm:py-4 
//             rounded-xl
//           "
//                   >

//                     <div className="flex items-center gap-3 sm:gap-4">
//                       <span className="
//               w-8 h-8 
//               sm:w-10 sm:h-8 
//               rounded-full 
//               bg-gray-200 
//               flex items-center justify-center 
//               text-xs sm:text-sm
//             ">
//                         {rank}
//                       </span>

//                       <img
//                         src={avatar}
//                         alt="avatar"
//                         className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
//                       />

//                       <span className="font-medium text-sm sm:text-base">
//                         Thành viên {rank}
//                       </span>
//                     </div>

//                     <div className="text-right">
//                       <p className="text-red-600 font-semibold text-sm sm:text-base">
//                         10 điểm
//                       </p>
//                       <p className="text-xs text-gray-500">
//                         2 phút 02 giây
//                       </p>
//                     </div>

//                   </div>
//                 ))}

//               </div>

//             </div>
//           </div>

//         </div>




//       </div>




//       {/* popup kết quả thi */}

//       {
//         showPopup && (
//           <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl p-6 w-[400px] text-center shadow-lg">
//               <h2 className="text-xl font-bold text-green-600 mb-3">
//                 🎉 Chúc mừng!
//               </h2>

//               <p className="text-gray-700 mb-6">
//                 Bạn đã đạt <span className="font-bold text-blue-600">{score}</span> điểm
//               </p>

//               <div className="flex justify-center gap-4">
//                 <button
//                   onClick={() => setShowPopup(false)}
//                   className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
//                 >
//                   Đóng
//                 </button>

//                 <button
//                   onClick={handleMockTest}
//                   className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//                 >
//                   Làm lại
//                 </button>
//               </div>
//             </div>
//           </div>
//         )
//       }
//     </div >

//   );
// };

// export default ExamDetail;
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Clock } from "lucide-react";
import avatar from "../assets/avatar.png";
import { startAttempt, getAttemptList } from "../api/attempt";
import { API } from "../api/endpoint";
import { fetch, parseResponse } from "../api/client";

const ExamDetail = () => {
  const { examSetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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
  const handleStartExam = async (qb) => {
    try {
      const res = await startAttempt({
        questionBankId: qb.id,
        examSetId,
      });

      if (res.success) {
        navigate(`/exam-doing/${qb.id}`, {
          state: {
            attemptId: res.data.attemptId,
            questions: res.data.questions,
          },
        });
      }
    } catch (error) {
      console.error(error);
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
            total: item.questionBank?.totalScore || 100,
            date: item.submittedAt || item.startedAt,
            time: calculateTime(item.startedAt, item.submittedAt),
          }));

          setHistory(mapped);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false); // ✅ BẮT BUỘC PHẢI CÓ
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
  useEffect(() => {
    const result = localStorage.getItem("exam_result_popup");

    if (result) {
      const data = JSON.parse(result);

      setScore(data.score);
      setLastExam(data); // 👈 Lưu lại full info
      setShowPopup(true);

      localStorage.removeItem("exam_result_popup");
    }
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
                  className="bg-green-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-green-700 transition"
                >
                  Làm bài
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl text-center shadow-lg">

            <h2 className="text-green-600 font-bold text-lg mb-3">
              🎉 Chúc mừng!
            </h2>

            <p>
              Bạn đạt{" "}
              <span className="text-blue-600 font-bold">{score}</span> điểm
            </p>

            <div className="flex justify-center gap-4 mt-6">

              {/* ĐÓNG */}
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Đóng
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
                className="px-4 py-2 bg-green-600 text-white rounded"
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