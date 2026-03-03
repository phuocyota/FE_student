import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Heart } from "lucide-react";

const examData = [
  {
    title: "Đề kiểm tra 15 phút - Đề số 01",
    time: "15 phút",
    difficulty: "Dễ",
    type: "Thi 15 phút",
  },
  {
    title: "Đề kiểm tra 15 phút - Đề số 02",
    time: "15 phút",
    difficulty: "Khó",
    type: "Thi 15 phút",
  },
  {
    title: "Đề kiểm tra 1 tiết - Đề số 01",
    time: "45 phút",
    difficulty: "Trung bình",
    type: "Thi 1 tiết",
  },
  {
    title: "Đề kiểm tra 1 tiết - Đề số 02",
    time: "45 phút",
    difficulty: "Khó",
    type: "Thi 1 tiết",
  },
  {
    title: "Đề kiểm tra học kỳ I",
    time: "60 phút",
    difficulty: "Khó",
    type: "Thi học kỳ",
  },
  {
    title: "Phiếu bài tập - Unit 1: Hello",
    time: "15 phút",
    difficulty: "Dễ",
    type: "Phiếu bài tập",
  },
  {
    title: "Phiếu bài tập - Unit 2: My School",
    time: "15 phút",
    difficulty: "Dễ",
    type: "Phiếu bài tập",
  },
  {
    title: "Phiếu bài tập - Unit 3: My Family",
    time: "15 phút",
    difficulty: "Trung bình",
    type: "Phiếu bài tập",
  },
  {
    title: "Phiếu bài tập - Unit 4: My Body",
    time: "15 phút",
    difficulty: "Dễ",
    type: "Phiếu bài tập",
  },
  {
    title: "Phiếu bài tập - Unit 5: Food",
    time: "15 phút",
    difficulty: "Trung bình",
    type: "Phiếu bài tập",
  },
  {
    title: "Đề luyện tập tổng hợp - Đề số 01",
    time: "30 phút",
    difficulty: "Trung bình",
    type: "Luyện tập",
  },
  {
    title: "Đề luyện tập tổng hợp - Đề số 02",
    time: "30 phút",
    difficulty: "Khó",
    type: "Luyện tập",
  },
  {
    title: "Đề luyện kỹ năng đọc - Đề số 01",
    time: "20 phút",
    difficulty: "Trung bình",
    type: "Luyện kỹ năng",
  },
  {
    title: "Đề luyện kỹ năng nghe - Đề số 01",
    time: "20 phút",
    difficulty: "Khó",
    type: "Luyện kỹ năng",
  },
  {
    title: "Đề ôn tập cuối kỳ",
    time: "60 phút",
    difficulty: "Khó",
    type: "Ôn tập",
  },
];

const ExamList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
const [currentPage, setCurrentPage] = useState(1);

const itemsPerPage = 10; // 👈 khai báo trước khi dùng

const filtered = examData.filter((item) =>
  item.title.toLowerCase().includes(search.toLowerCase())
);

const totalPages = Math.ceil(filtered.length / itemsPerPage);

const startIndex = (currentPage - 1) * itemsPerPage;
const currentData = filtered.slice(
  startIndex,
  startIndex + itemsPerPage
);

   

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">

        <div className="bg-white rounded-xl p-4 sm:p-6">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            {/* Left */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-blue-600 text-sm w-fit cursor-pointer "
              >
                ← Quay lại
              </button>

              <h2 className="text-lg font-semibold">
                Tất cả đề thi
              </h2>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Tìm kiếm đề..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);   // 👈 reset về trang 1 khi search
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* LIST */}
          <div className="space-y-4">

            {currentData.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition bg-white"
              >
                {/* TITLE */}
                <h3 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
                  {item.title}
                </h3>

                {/* TAGS */}
                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Tiếng Anh 1 / Sách Explore Our World
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Độ khó: {item.difficulty}
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    Dạng đề thi: {item.type}
                  </span>
                </div>

                {/* FOOTER MOBILE + DESKTOP */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  {/* Time + icon */}
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

                  {/* Button */}
                  <button
                    onClick={() => navigate(`/exam/${index}`)}
                    className=" cursor-pointer border border-gray-300 px-4 py-2 sm:py-1 rounded text-sm hover:bg-gray-50 w-full sm:w-auto">
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
          )}

        </div>
      </div>
    </div>
  );
};

export default ExamList;