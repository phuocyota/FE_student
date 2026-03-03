import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import mockExamData from "../datas/mockExamData";
import { useNavigate, useParams, useLocation } from "react-router-dom";
const ExamDoing = () => {
  //   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});


  // thoát 
  const navigate = useNavigate();
  const { id } = useParams();
  const [showExitModal, setShowExitModal] = useState(false);

  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    navigate(`/exam/${id}`); // quay lại trang trước
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  // submit bài làm
  const [showSubmitModal, setShowSubmitModal] = useState(false);



  const totalTime = mockExamData.duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  const timeUsedInSeconds = totalTime - timeLeft;
  const usedMinutes = Math.floor(timeUsedInSeconds / 60);
  const usedSeconds = timeUsedInSeconds % 60;

  const handleSubmit = () => {
    const score = Object.keys(answers).length;

    const timeSpent = `${usedMinutes} phút ${usedSeconds
      .toString()
      .padStart(2, "0")} giây`;

    const newResult = {
      date: new Date().toLocaleDateString(),
      score: `${score}/${mockExamData.questions.length}`,
      time: timeSpent,
    };

    const existing =
      JSON.parse(localStorage.getItem(`exam_${id}`)) || [];

    const updated = [...existing, newResult];

    localStorage.setItem(`exam_${id}`, JSON.stringify(updated));

    navigate(`/exam/${id}`);
  };

  // chọn số câu chạy đến đúng cau hỏi
  const questionRefs = useRef([]);

  // tự động nộp khi hết giờ làm bài 
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);


  // xem lại bài làm
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const reviewIndex = queryParams.get("review");
  useEffect(() => {
    if (reviewIndex !== null) {
      const saved =
        JSON.parse(localStorage.getItem(`exam_${id}`)) || [];

      const reviewData = saved[reviewIndex];

      if (reviewData) {
        setAnswers(reviewData.answers || {});
        setTimeLeft(0); // không cho làm tiếp
      }
    }
  }, [reviewIndex, id]);

  // hiển thị đáp án đúng sai 
  const isReviewMode = reviewIndex !== null;

  // hiển thị số câu hỏi đúng sai trên header khi review 
  const totalQuestions = mockExamData.questions.length;

const correctCount = mockExamData.questions.filter(
  (q) => answers[q.id] === q.correctAnswer
).length;

const wrongCount = mockExamData.questions.filter(
  (q) =>
    answers[q.id] &&
    answers[q.id] !== q.correctAnswer
).length;

const notAnsweredCount = mockExamData.questions.filter(
  (q) => !answers[q.id]
).length;

  /* ================= TIMER ================= */

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTimeUpModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const submitExam = () => {
    const score = mockExamData.questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;

    const timeUsedInSeconds = totalTime - timeLeft;
    const usedMinutes = Math.floor(timeUsedInSeconds / 60);
    const usedSeconds = timeUsedInSeconds % 60;

    const timeSpent = `${usedMinutes} phút ${usedSeconds
      .toString()
      .padStart(2, "0")} giây`;

    const newResult = {
      date: new Date().toLocaleDateString(),
      score: `${score}/${mockExamData.questions.length}`,
      time: timeSpent,
      answers: answers,
    };

    const existing =
      JSON.parse(localStorage.getItem(`exam_${id}`)) || [];

    const updated = [...existing, newResult];

    localStorage.setItem(`exam_${id}`, JSON.stringify(updated));

    navigate(`/exam/${id}`);
  };


  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const timeProgress = (timeLeft / totalTime) * 100;

  /* ================= HANDLE ANSWER ================= */
  const handleSelect = (questionId, label) => {
    setAnswers({
      ...answers,
      [questionId]: label,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {/* ================= HEADER ================= */}
<div className="bg-white border-b border-gray-200 px-4 py-3">

  {isReviewMode ? (

  <>
    {/* MOBILE - scroll ngang */}
    <div className="flex md:hidden overflow-x-auto whitespace-nowrap gap-6 text-sm font-medium">

      <span>
        Tất cả ({totalQuestions})
      </span>

      <span className="flex items-center gap-2 text-green-600">
        <span className="w-3 h-3 rounded-full bg-green-600"></span>
        Đúng ({correctCount})
      </span>

      <span className="flex items-center gap-2 text-red-600">
        <span className="w-3 h-3 rounded-full bg-red-600"></span>
        Sai ({wrongCount})
      </span>

      <span className="flex items-center gap-2 text-gray-500">
        <span className="w-3 h-3 rounded-full bg-gray-400"></span>
        Tự luận (0)
      </span>

      <span className="flex items-center gap-2 text-gray-500">
        <span className="w-3 h-3 rounded-full border border-gray-400"></span>
        Chưa làm ({notAnsweredCount})
      </span>

    </div>

    {/* DESKTOP */}
    <div className="hidden md:flex items-center justify-between">

      {/* Nút quay lại */}
      <button
        onClick={handleExitClick}
        className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Căn giữa */}
      <div className="flex gap-8 text-sm font-medium justify-center">

        <span>
          Tất cả ({totalQuestions})
        </span>

        <span className="flex items-center gap-2 text-green-600">
          <span className="w-3 h-3 rounded-full bg-green-600"></span>
          Đúng ({correctCount})
        </span>

        <span className="flex items-center gap-2 text-red-600">
          <span className="w-3 h-3 rounded-full bg-red-600"></span>
          Sai ({wrongCount})
        </span>

        <span className="flex items-center gap-2 text-gray-500">
          <span className="w-3 h-3 rounded-full bg-gray-400"></span>
          Tự luận (0)
        </span>

        <span className="flex items-center gap-2 text-gray-500">
          <span className="w-3 h-3 rounded-full border border-gray-400"></span>
          Chưa làm ({notAnsweredCount})
        </span>

      </div>

      <div /> {/* giữ cân layout */}
    </div>
  </>

) : (

    /* ================= LÀM BÀI BÌNH THƯỜNG ================= */
    <>
      {/* MOBILE */}
      <div className="flex items-center gap-4 text-sm font-medium md:hidden">
        <span className="border-b-2 border-green-600 pb-1">
          Tất cả ({mockExamData.questions.length})
        </span>

        <span className="flex items-center gap-1 text-gray-500">
          ○ Chưa làm ({notAnsweredCount})
        </span>

        <span className="flex items-center gap-1 text-gray-500">
          ● Kiểm tra lại (0)
        </span>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex items-center justify-between">
        <button
          onClick={handleExitClick}
          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex gap-8 text-sm font-medium">
          <span className="border-b-2 border-green-600 pb-1">
            Tất cả ({mockExamData.questions.length})
          </span>

          <span className="text-gray-500">
            ○ Chưa làm ({notAnsweredCount})
          </span>

          <span className="text-gray-500">
            ● Kiểm tra lại (0)
          </span>
        </div>

        <div />
      </div>
    </>

  )}

</div>

      {/* ================= BODY ================= */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* ================= LEFT ================= */}
        <div className="flex-1 overflow-y-auto flex justify-center p-6">

          <div className="w-full max-w-3xl space-y-8">

            {mockExamData.questions.map((question, index) => (

              <div
                key={question.id}
                ref={(el) => (questionRefs.current[index] = el)}
                className="bg-white p-8 rounded-xl border-gray-200  border shadow-sm"
              >

                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1 bg-gray-100 rounded-full text-sm">
                    Câu {question.id}
                  </span>
                  <span className="text-gray-600">
                    {question.instruction}
                  </span>
                </div>

                <p className="mb-4 font-medium">
                  {question.questionText}
                </p>

                {question.image && (
                  <img
                    src={question.image}
                    alt=""
                    className="rounded-lg mb-4 max-w-md border-gray-200 border"
                  />
                )}

                {question.options.map((opt) => {
                  const isSelected = answers[question.id] === opt.label;
                  const isCorrect = opt.label === question.correctAnswer;
                  const isWrongSelected = isReviewMode && isSelected && !isCorrect;

                  return (
                    <div
                      key={opt.label}
                      onClick={() => {
                        if (!isReviewMode) {
                          handleSelect(question.id, opt.label);
                        }
                      }}
                      className={`
        border rounded-xl p-4 mb-3 transition flex justify-between items-center
        ${isReviewMode
                          ? isCorrect
                            ? "border-green-600 bg-green-50"
                            : isWrongSelected
                              ? "border-red-600 bg-red-50"
                              : "bg-gray-50"
                          : isSelected
                            ? "border-green-600 bg-green-50 cursor-pointer"
                            : "hover:bg-gray-50 cursor-pointer"
                        }
      `}
                    >
                      <div>
                        <strong>{opt.label}.</strong> {opt.text}
                      </div>

                      {/* ICONS KHI REVIEW */}
                      {isReviewMode && (
                        <div>
                          {isCorrect && (
                            <span className="text-green-600 font-bold">✓</span>
                          )}
                          {isWrongSelected && (
                            <span className="text-red-600 font-bold">✗</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>

            ))}

          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div
          className="
    w-full 
    md:w-80 
    bg-white 
    border-t 
    md:border-t-0 
    md:border-l 
    border-gray-200 
    flex flex-col 
    md:h-full
  "
        >
          {/* ===== TOP CONTENT ===== */}
          <div className="p-3 md:p-5 md:flex-1">
            <p className="text-xs md:text-sm text-gray-500 mb-1">
              BÀI THI
            </p>

            <h2 className="font-semibold mb-3 text-base md:text-lg">
              {mockExamData.title}
            </h2>

            <div className="mb-2 text-xs md:text-sm">
              {Object.keys(answers).length}/
              {mockExamData.questions.length} câu
            </div>

            {/* Progress */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${timeProgress}%` }}
              />
            </div>

            {/* Timer */}
            <div className="text-center mb-3">
              <span className="bg-green-600 text-white px-3 py-0.5 rounded-full text-xs">
                {formattedTime}
              </span>
            </div>

            {/* QUESTION NAVIGATOR - Desktop Only */}
            <div className="hidden md:grid grid-cols-5 gap-1">
              {mockExamData.questions.map((q, index) => {
                const isAnswered = answers[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      questionRefs.current[index]?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className={`
          w-8 h-8 text-xs rounded border border-gray-300 transition
          ${isAnswered
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-gray-100"
                      }
        `}
                  >
                    {q.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== BOTTOM BUTTONS ===== */}
          <div className="p-3 md:p-5 flex justify-between items-center mb-20 md:mb-15">
            <button
              onClick={handleExitClick}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition text-sm cursor-pointer">
              ✕ Thoát
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-full text-sm font-semibold transition">
              NỘP BÀI
            </button>
          </div>
        </div>
      </div>


      {/* thoát modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg text-center">

            <h3 className="text-lg font-semibold mb-4">
              Bạn chắc chắn muốn thoát?
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Bài làm của bạn có thể chưa được lưu.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={cancelExit}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              >
                Hủy
              </button>

              <button
                onClick={confirmExit}
                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
              >
                Thoát
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg text-center">

            <h3 className="text-lg font-semibold mb-4">
              Bạn chắc chắn muốn nộp bài?
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Sau khi nộp bài bạn sẽ không thể thay đổi đáp án.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              >
                Hủy
              </button>

              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmit();
                }}
                className="px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition"
              >
                Nộp bài
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Time's up Modal */}
      {showTimeUpModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg text-center">

            <h3 className="text-lg font-semibold mb-4 text-red-600">
              Hết giờ làm bài!
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Hệ thống sẽ tự động nộp bài của bạn.
            </p>

            <button
              onClick={submitExam}
              className="px-5 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition"
            >
              Xem kết quả
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default ExamDoing;