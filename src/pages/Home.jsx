import React from "react";
import testImg from "../assets/test.jpg";
import { useNavigate } from "react-router-dom";

const data = [
  {
    grade: "Lớp 1",
    exams: [
      { title: "Trọn bộ đề thi Tiếng Anh lớp 1 (có đáp án)", count: 34 },
      { title: "Trọn bộ đề thi Tiếng Việt lớp 1 (có đáp án)", count: 108 },
      { title: "Trọn bộ đề thi Toán lớp 1 (có đáp án)", count: 56 },
    ],
  },
  {
    grade: "Lớp 2",
    exams: [
      { title: "Trọn bộ đề thi Tiếng Anh lớp 2 (có đáp án)", count: 40 },
      { title: "Trọn bộ đề thi Tiếng Việt lớp 2 (có đáp án)", count: 95 },
      { title: "Trọn bộ đề thi Toán lớp 2 (có đáp án)", count: 60 },
    ],
  },
  {
    grade: "Lớp 3",
    exams: [
      { title: "Trọn bộ đề thi Tiếng Anh lớp 3 (có đáp án)", count: 42 },
      { title: "Trọn bộ đề thi Tiếng Việt lớp 3 (có đáp án)", count: 120 },
      { title: "Trọn bộ đề thi Toán lớp 3 (có đáp án)", count: 75 },
    ],
  },
  {
    grade: "Lớp 4",
    exams: [
      { title: "Trọn bộ đề thi Tiếng Anh lớp 4 (có đáp án)", count: 50 },
      { title: "Trọn bộ đề thi Tiếng Việt lớp 4 (có đáp án)", count: 130 },
      { title: "Trọn bộ đề thi Toán lớp 4 (có đáp án)", count: 80 },
    ],
  },
  {
    grade: "Lớp 5",
    exams: [
      { title: "Trọn bộ đề thi Tiếng Anh lớp 5 (có đáp án)", count: 55 },
      { title: "Trọn bộ đề thi Tiếng Việt lớp 5 (có đáp án)", count: 150 },
      { title: "Trọn bộ đề thi Toán lớp 5 (có đáp án)", count: 95 },
    ],
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {data.map((gradeItem, gradeIndex) => (
          <div
            key={gradeIndex}
            className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-8"
          >
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                {gradeItem.grade}
              </h2>
              <div className="h-1 w-12 bg-gray-200 rounded-full"></div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {gradeItem.exams.map((item, index) => (
                <div
                  key={index}
                  onClick={() => navigate("/exam-list")}
                  className="flex flex-col sm:flex-row gap-4 p-4 
                  border border-gray-200 
                  rounded-lg 
                  hover:shadow-md 
                  transition 
                  bg-white cursor-pointer"
                >
                  {/* IMAGE */}
                  <img
                    src={testImg}
                    alt="test"
                    className="w-full sm:w-32 h-40 sm:h-20 object-cover rounded-lg"
                  />

                  {/* CONTENT */}
                  <div className="flex flex-col justify-between flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-gray-800 leading-snug">
                      {item.title}
                    </h3>

                    <span className="inline-block mt-3 text-xs bg-gray-200 px-3 py-1 rounded-full w-fit">
                      {item.count} đề
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default Home;