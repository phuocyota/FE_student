import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";


const examList = [
  { date: "27/02", title: "Đề kiểm tra 15 phút - Đề số 02", score: 1.0 },
  { date: "26/02", title: "Đề kiểm tra 1 tiết - Đề số 03", score: 0.8 },
  { date: "25/02", title: "Phiếu bài tập - Unit 6: Scotland - Đề số 01", score: 0.6 },
  { date: "24/02", title: "Đề ôn tập giữa kỳ - Đề số 02", score: 0.9 },
  { date: "23/02", title: "Phiếu bài tập - Unit 5: Ireland - Đề số 01", score: 0.0 },
  { date: "22/02", title: "Đề kiểm tra 15 phút - Đề số 01", score: 0.7 },
  { date: "21/02", title: "Đề luyện tập tổng hợp - Đề số 04", score: 1.0 },
  { date: "20/02", title: "Phiếu bài tập - Unit 4: Wales - Đề số 02", score: 0.5 },
  { date: "19/02", title: "Đề kiểm tra học kỳ - Đề số 01", score: 0.95 },
  { date: "18/02", title: "Đề luyện kỹ năng đọc - Đề số 03", score: 0.4 },
  { date: "17/02", title: "Phiếu bài tập - Unit 3: England - Đề số 01", score: 0.75 },
  { date: "16/02", title: "Đề kiểm tra 15 phút - Đề số 05", score: 0.85 },
  { date: "15/02", title: "Đề luyện tập từ vựng - Đề số 02", score: 0.65 },
  { date: "14/02", title: "Đề kiểm tra 1 tiết - Đề số 04", score: 0.55 },
  { date: "13/02", title: "Phiếu bài tập - Unit 2: London - Đề số 01", score: 0.3 },
];
const ExamDashboard = () => {
  const data = [
    { date: "22/02", score: 0 },
    { date: "23/02", score: 0 },
    { date: "24/02", score: 0 },
    { date: "25/02", score: 0 },
    { date: "26/02", score: 0 },
    { date: "27/02", score: 1 },
    { date: "28/02", score: 0 },
    { date: "01/03", score: 0 },
    { date: "02/03", score: 0 },
  ];

  // phân trang danh sách lịch sử đề thi 

  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
const totalPages = Math.ceil(examList.length / itemsPerPage);

const startIndex = (currentPage - 1) * itemsPerPage;
const currentData = examList.slice(
  startIndex,
  startIndex + itemsPerPage
);

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl p-6">

        {/* ====== TITLE ====== */}
        <h1 className="text-2xl font-bold mb-6">
          Thành tích luyện đề tổng hợp
        </h1>

        {/* ====== FILTER DATE ====== */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8">
          <div className="flex items-center gap-3">
            <span className="text-gray-600">Từ ngày:</span>
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              defaultValue="2026-02-23"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-600">Đến ngày:</span>
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              defaultValue="2026-03-02"
            />
          </div>
        </div>

        {/* ====== CONTENT ====== */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* ===== LEFT: TABLE ===== */}
<div>

  <div className="grid grid-cols-4 text-gray-500 font-semibold mb-3">
  <span>Ngày</span>
  <span>Tên đề thi</span>
  <span className="text-right">Điểm</span>
  <span className="text-right"> </span>  
</div>

  <div className="space-y-4">
  {currentData.map((item, index) => (
    <div
      key={index}
      className="grid grid-cols-4 items-center border-b pb-3 gap-2"
    >
      {/* Date */}
      <span>{item.date}</span>

      {/* Title */}
      <span>{item.title}</span>

      {/* Score */}
      <span className="text-right text-red-600 font-semibold">
        {item.score.toFixed(2)}
      </span>

      {/* PDF Button */}
      <div className="text-right">
        <button
          onClick={() => handleExportPDF(item)}
          className="bg-green-600 hover:bg-green-700 
          text-white text-xs px-3 py-1 rounded-full 
          transition"
        >
          Xuất PDF
        </button>
      </div>
    </div>
  ))}
</div>

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

</div>
          {/* ===== RIGHT: CHART ===== */}
          <div className="w-full h-72 md:h-96">
            <h2 className="text-center font-semibold mb-4">Biểu đồ</h2>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#166534"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExamDashboard;