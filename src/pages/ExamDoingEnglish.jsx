import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import mockExamData from "../datas/mockExamData";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { submitAttempt } from "../api/attempt";
import { buildAssetUrl } from "../api/client";
import mockEnglishQuestions from "../datas/mockEnglishExam";




const ExamDoingEnglish = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const attemptId = location.state?.attemptId;
  const [questions] = useState(
    location.state?.questions || mockEnglishQuestions
  );

  const [answers, setAnswers] = useState({});
  const [selectedPart, setSelectedPart] = useState(1);

  const questionRefs = useRef([]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
   const confirmExit = () => navigate(-1);

  const closeAllModal = () => {
    setShowExitModal(false);
    setShowSubmitModal(false);
    setShowTimeUpModal(false);
  };

  const openSubmitModal = () => {
    closeAllModal();
    setShowSubmitModal(true);
  };

  const openExitModal = () => {
    closeAllModal();
    setShowExitModal(true);
  };

  const openTimeUpModal = () => {
    closeAllModal();
    setShowTimeUpModal(true);
  };

  /* ================= FILTER PART ================= */
  const filteredQuestions = questions.filter(
    (q) => q.part === selectedPart
  );



  /* ================= TIMER ================= */
  const totalTime = mockExamData.duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  useEffect(() => {
  if (timeLeft <= 0) return;

  const timer = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        openTimeUpModal(); // 👈 đúng chỗ
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const timeProgress = (timeLeft / totalTime) * 100;

  /* ================= ANSWER ================= */
  const handleSelect = (question, index) => {
    const label = String.fromCharCode(65 + index);
    const value = `${question.orderNo}${label}`;

    setAnswers((prev) => ({
      ...prev,
      [question.id]: value
    }));
  };

  const notAnsweredCount = questions.filter(
    (q) => !answers[q.id]
  ).length;

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    toast.success("Test submit thành công");
  };
  /* ================= RENDER ================= */

  const renderChainContent = (chain) => {
    if (!chain || chain.length === 0) return null;

    return chain.map((item) => {
      if (item.contentType === "TEXT") {
        return <p key={item.id}>{item.content}</p>;
      }

      if (item.contentType === "IMAGE") {
        return (
          <img
            key={item.id}
            src={buildAssetUrl(item.content)}
            className="my-3 rounded-lg border shadow"
          />
        );
      }

      if (item.contentType === "AUDIO") {
        return <audio key={item.id} controls src={buildAssetUrl(item.content)} />;
      }

      return null;
    });
  };

  const getAnswerContent = (answer) => {
    // nếu có chain thì render chain
    if (answer.chain && answer.chain.length > 0) {
      return renderChainContent(answer.chain);
    }

    // nếu chỉ có content thì render text trực tiếp
    if (answer.content) {
      return <span>{answer.content}</span>;
    }

    return null;
  };
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-hidden">

      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">

        <button
          onClick={() => navigate(-1)}
          className="hidden md:flex w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-4"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 text-center font-semibold">
          English Exam
        </div>


      </div>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* ================= LEFT: PART ================= */}
        {/* PARTS */}
        <div className="bg-white border-b border-gray-200 md:border-r md:w-52 p-3 md:p-4 overflow-x-auto">
          <div className="flex md:flex-col gap-2">

            {[1, 2, 3, 4, 5].map((part) => (
              <div
                key={part}
                onClick={() => setSelectedPart(part)}
                className={`px-3 py-2 rounded-lg cursor-pointer whitespace-nowrap
          ${selectedPart === part
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 md:bg-transparent hover:bg-gray-100"}
        `}
              >
                Part {part}
              </div>
            ))}

          </div>
        </div>

        {/* ================= MIDDLE: QUESTIONS ================= */}
        <div className="flex-1 overflow-y-auto flex justify-center p-6">

          <div className="w-full max-w-3xl space-y-6">

            {filteredQuestions.map((question, index) => (

              <div
                key={question.id}
                ref={(el) => (questionRefs.current[index] = el)}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
              >

                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  Câu {question.orderNo}
                </span>

                <div className="my-4 font-medium">
                  {renderChainContent(question.chain)}
                </div>

                {question.answers.map((answer, i) => {

                  const label = String.fromCharCode(65 + i);
                  const isSelected =
                    answers[question.id] === `${question.orderNo}${label}`;

                  return (
                    <div
                      key={answer.id}
                      onClick={() => handleSelect(question, i)}
                      className={`border border-gray-200 rounded-xl p-4 mb-3 cursor-pointer
                        ${isSelected
                          ? "border-green-600 bg-green-50"
                          : "hover:bg-gray-50"}
                      `}
                    >
                      <strong>{label}. </strong>
                      {getAnswerContent(answer)}
                    </div>
                  );

                })}

              </div>

            ))}

          </div>

        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="
  hidden md:flex w-80 bg-white border-l border-gray-200 flex-col
">

          <div className="p-5 flex-1">

            <p className="text-sm text-gray-500 mb-1">
              BÀI THI
            </p>

            <h2 className="font-semibold mb-3">
              {mockExamData.title}
            </h2>

            <div className="mb-2 text-sm">
              {Object.keys(answers).length}/{questions.length} câu
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${timeProgress}%` }}
              />
            </div>

            <div className="text-center mb-3">
              <span className="bg-green-600 text-white px-3 py-0.5 rounded-full text-xs">
                {formattedTime}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1">

              {questions.map((q, index) => {

                const isAnswered = answers[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() =>
                      setSelectedPart(q.part)
                    }
                    className={`w-8 h-8 text-xs rounded border border-gray-200
                      ${isAnswered
                        ? "bg-green-600 text-white"
                        : "bg-gray-100"}
                    `}
                  >
                    {q.orderNo}
                  </button>
                );

              })}

            </div>

          </div>

          {/* BUTTON */}
          <div className="p-5 border-t border-gray-200 flex justify-between">

            <button
              onClick={() => navigate(-1)}
              className="text-gray-600"
            >
              ✕ Thoát
            </button>

            <button
              onClick={handleSubmit}
              className="bg-green-700 text-white px-5 py-2 rounded-full"
            >
              NỘP BÀI
            </button>

          </div>

        </div>

      </div>

      {/* MOBILE FOOTER */}
      {/* MOBILE BAR */}

      <div className="md:hidden p-4 border-t border-gray-200">

        <p className="text-sm font-semibold mb-3">
          {mockExamData.title}
        </p>

        <div className="flex justify-between">

          {/* THOÁT */}
          <button
            onClick={() => setShowExitModal(true)}
            className="text-gray-600 font-medium"
          >
            ✕ Thoát
          </button>


          {/* NỘP BÀI */}
          {/* NỘP BÀI */}
<button
  onClick={() => setShowSubmitModal(true)}
  className="bg-green-700 hover:bg-green-800 transition text-white px-5 py-2 rounded-full font-semibold"
>
  NỘP BÀI
</button>

        </div>

      </div>


      {/* thoát model */}

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
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>

              <button
                onClick={confirmExit}
                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                Thoát
              </button>

            </div>

          </div>




        </div>
      )}

      {/* submit modal */}

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
                className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>

              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmit();
                }}
                className="px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700"
              >
                Nộp bài
              </button>

            </div>

          </div>
        </div>
      )}

      {/* hết giờ làm bài */}

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
              onClick={handleSubmit}
              className="px-5 py-2 rounded-full bg-green-600 text-white hover:bg-green-700"
            >
              Xem kết quả
            </button>

          </div>
        </div>
      )}


    </div>
  );
};

export default ExamDoingEnglish;