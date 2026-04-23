


import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, Heart } from "lucide-react";
import { fetch, parseResponse } from "../api/client";
import { API } from "../api/endpoint";
import { useLocation } from "react-router-dom";

const ExamList = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const { examSetId } = useParams();

  const { subjectId } = useParams();

  const [examData, setExamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const subject = location.state?.subject;

  const handleGoDetail = (item) => {
    // lưu vào localStorage
    localStorage.setItem("current_exam", JSON.stringify(item));

    // navigate sang detail
    navigate(`/exam/${item.examSetId}/${item.id}`, {
      state: { exam: item },
    });
  };

  //  useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       let dataList = [];

  //       // ✅ CASE 1: từ Header (1 bộ đề)
  //       if (examSetId) {
  //         const res = await fetch(API.EXAM_SET.DETAIL(examSetId));
  //         const data = await parseResponse(res);

  //         const questionBanks = data?.data?.questionBanks || [];

  //         dataList = questionBanks.map((q) => ({
  //           id: q.id,
  //           title: q.title,
  //           time: q.durationSeconds
  //             ? `${q.durationSeconds / 60} phút`
  //             : "Không rõ",
  //           difficulty: q.totalPoints || 0,
  //           type: data?.data?.name,
  //           examSetId: examSetId,
  //         }));
  //       }

  //       // ✅ CASE 2: từ HOME (nhiều bộ đề)
  //       else if (subjectId) {
  //         const res = await fetch(API.EXAM_SET.GET_BY_SUBJECT(subjectId));
  //         const payload = await parseResponse(res);

  //         const examSets = payload?.data?.data || [];

  //         const results = await Promise.all(
  //           examSets.map(async (examSet) => {
  //             const resDetail = await fetch(
  //               API.EXAM_SET.DETAIL(examSet.id)
  //             );
  //             const dataDetail = await parseResponse(resDetail);

  //             return {
  //               examSetId: dataDetail?.data?.id,
  //               examSetName: dataDetail?.data?.name,
  //               questionBanks: dataDetail?.data?.questionBanks || [],
  //             };
  //           })
  //         );

  //         dataList = results.flatMap((item) =>
  //           item.questionBanks.map((q) => ({
  //             id: q.id,
  //             title: q.title,
  //             time: q.durationSeconds
  //               ? `${q.durationSeconds / 60} phút`
  //               : "Không rõ",
  //             difficulty: q.totalPoints || 0,
  //             type: item.examSetName,
  //             examSetId: item.examSetId,
  //           }))
  //         );
  //       }

  //       setExamData(dataList);
  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, [examSetId, subjectId]);
  // ================= SEARCH =================

  useEffect(() => {
    if (!subject) return;

    const dataList = subject.examSets.map((examSet) => ({
      id: examSet.id,
      title: examSet.title,
      time: "Không rõ",
      difficulty: 0,
      type: subject.name,
      examSetId: examSet.id,
    }));

    setExamData(dataList);
    setLoading(false);
  }, [subject]);



  const filtered = examData.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filtered.slice(startIndex, startIndex + itemsPerPage);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Đang tải đề thi...
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">

        <div className="bg-white rounded-xl p-4 sm:p-6">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate("/")}
                className="self-start text-blue-600 text-sm cursor-pointer"
              >
                ← Quay lại
              </button>

              <h2 className="text-lg font-semibold">
                Tất cả đề thi
              </h2>
            </div>

            <input
              type="text"
              placeholder="Tìm kiếm đề..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* LIST */}
          <div className="space-y-4">

            {currentData.length === 0 && (
              <div className="text-center text-gray-500 py-10">
                Không có đề thi
              </div>
            )}

            {currentData.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition bg-white"
              >

                <h3 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
                  {item.title}
                </h3>

                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Điểm: {item.difficulty}
                  </span>

                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Bộ đề: {item.type}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      {item.time}
                    </div>

                    <Heart
                      size={18}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => handleGoDetail(item)}
                    className="cursor-pointer border border-gray-300 px-4 py-2 sm:py-1 rounded text-sm hover:bg-gray-50 w-full sm:w-auto"
                  >
                    Xem
                  </button>


                </div>
              </div>
            ))}

          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
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
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition"
              >
                →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ExamList;







