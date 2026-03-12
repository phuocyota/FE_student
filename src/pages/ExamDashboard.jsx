import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { getExamHistory } from "../api/attempt";

const ExamDashboard = () => {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const [examList, setExamList] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [fromDate, setFromDate] = useState("2026-03-08");
  const [toDate, setToDate] = useState("2026-03-11");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // ===== CALL API =====


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getExamHistory(fromDate, toDate);

        if (res.success) {
          const formatted = res.data.map((item) => ({
            date: new Date(item.date).toLocaleDateString("vi-VN"),
            title: item.examName,
            attemptCount: item.attemptCount,
            examSetId: item.examSetId,
            questionBankId: item.questionBankId
          }));
          setExamList(formatted);

          const chart = res.data.map((item) => ({
            date: new Date(item.date).toLocaleDateString("vi-VN"),
            score: item.attemptCount,
          }));

          setChartData(chart);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchHistory();
  }, [fromDate, toDate]);

  // ===== PAGINATION =====
  const totalPages = Math.ceil(examList.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentData = examList.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl p-6">

        <h1 className="text-2xl font-bold mb-6">
          Thành tích luyện đề tổng hợp
        </h1>

        {/* ===== FILTER DATE ===== */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center mb-8">

          <div className="flex items-center gap-3">
            <span className="text-gray-600">Từ ngày:</span>

            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />

          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-600">Đến ngày:</span>

            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />

          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* ===== LEFT TABLE ===== */}
          <div>

            <div className="grid grid-cols-4 text-gray-500 font-semibold mb-3">
              <span>Ngày</span>
              <span>Tên đề thi</span>
              <span className="text-center">Số lần thi</span>
              <span></span>
            </div>

            <div className="space-y-4">
              {currentData.map((item, index) => (

                <div
                  key={index}
                  className="grid grid-cols-4 items-center border-b pb-3 gap-2"
                >

                  <span>{item.date}</span>

                  <span>{item.title}</span>

                  <span className="text-center text-red-600 font-semibold ">
                    {item.attemptCount}
                  </span>

                  <div className="text-right">
                    <div className="text-right">
                      <button
                        onClick={() => {
                          // console.log(item.examSetId, item.questionBankId);
                          localStorage.setItem("current_exam", JSON.stringify(item));
                          navigate(`/exam/${item.examSetId}/${item.questionBankId}`);
                        }}
                        className="cursor-pointer bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-full transition"
                      >
                        Xem
                      </button>
                    </div>
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

          {/* ===== RIGHT CHART ===== */}

          <div className="w-full h-72 md:h-96">

            <h2 className="text-center font-semibold mb-4">
              Biểu đồ số lần thi
            </h2>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

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