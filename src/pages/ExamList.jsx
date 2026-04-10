import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, Heart } from "lucide-react";
import { fetch, parseResponse } from "../api/client";
import { API } from "../api/endpoint";

const ExamList = () => {
  const navigate = useNavigate();
  const { examSetId } = useParams();

  const [examData, setExamData] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(API.EXAM_SET.DETAIL(examSetId));
        const payload = await parseResponse(res);

        {
          const questionBanks =
            payload?.data?.data?.questionBanks ||
            payload?.data?.questionBanks ||
            payload?.questionBanks ||
            [];

          const formatted = questionBanks.map((item) => ({
            id: item.id,
            title: item.title,
            time: `${item.durationSeconds / 60} phút`,
            difficulty: item.totalPoints,
            type: "Đề thi",
          }));

          setExamData(formatted);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchExam();
  }, [examSetId]);

    // ================= SEARCH =================
  const filtered = examData.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filtered.slice(startIndex, startIndex + itemsPerPage);

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
                    Dạng đề thi: {item.type}
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
                    onClick={() =>
                      navigate(`/exam/${examSetId}/${item.id}`, {
                        state: { exam: item },
                      })
                    }
                    className="cursor-pointer border border-gray-300 px-4 py-2 sm:py-1 rounded text-sm hover:bg-gray-50 w-full sm:w-auto"
                  >
                    Xem
                  </button>
                  
                </div>
              </div>
            ))}
          </div>

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
