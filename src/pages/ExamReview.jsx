import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getAttemptReview, startAttempt } from "../api/attempt";
import { buildAssetUrl } from "../api/client";

const ExamReview = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const attemptId = location.state?.attemptId;

  const [questions, setQuestions] = useState([]);
  const questionRefs = useRef([]);

  const examTitle = location.state?.examTitle || "Bài thi";
  const [examInfo, setExamInfo] = useState({});


  useEffect(() => {

    if (!attemptId) return;

    const fetchReview = async () => {

      try {

        const res = await getAttemptReview(attemptId);

        if (res.success) {
          setQuestions(res.data.questions);
          setExamInfo({
            questionBankId: res.data.questionBankId,
            examSetId: res.data.examSetId
          });
        }

      } catch (error) {
        console.error("Review error:", error);
      }

    };

    fetchReview();

  }, [attemptId]);

  const handleRedo = async () => {

    try {

      const res = await startAttempt({
        questionBankId: examInfo.questionBankId,
        examSetId: examInfo.examSetId
      });

      if (res.success) {

        navigate(`/exam-doing/${examInfo.questionBankId}`, {
          state: {
            attemptId: res.data.attemptId,
            questions: res.data.questions
          }
        });

      }

    } catch (error) {

      console.error(error);

    }

  };


  /* ===== THỐNG KÊ ===== */

  const correctCount = questions.filter(q => q.isCorrect).length;

  const wrongCount = questions.filter(
    q => !q.isCorrect && q.selectedAnswerIds?.length
  ).length;

  const notAnsweredCount = questions.filter(
    q => !q.selectedAnswerIds?.length
  ).length;

  // hiển thị hình ảnh trogn câu hỏi 
  const renderChainContent = (chain) => {

    if (!chain) return null;

    return chain.map((item) => {

      if (item.contentType === "IMAGE") {
        return (
          <img
          key={item.id}
          src={buildAssetUrl(item.content)}
          alt=""
          className="my-3 max-w-full rounded-lg border border-gray-200 shadow-sm"
        />
        );
      }

      if (item.contentType === "TEXT") {
        return (
          <p key={item.id} className="my-1">
            {item.content}
          </p>
        );
      }

      return null;

    });

  };

  return (

    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-hidden">

      {/* HEADER */}

      <div className="bg-white border-b border-gray-200 px-4 py-3">

        <div className="flex items-center">

          {/* BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="hidden md:flex w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-4 cursor-pointer "
          >
            <ArrowLeft size={18} />
          </button>

          {/* MOBILE HEADER (SCROLL) */}
          <div className="flex-1 overflow-x-auto md:hidden">

            <div className="flex gap-6 text-sm font-medium whitespace-nowrap w-max">

              <span>Tất cả ({questions.length})</span>

              <span className="flex items-center gap-2 text-green-600">
                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                Đúng ({correctCount})
              </span>

              <span className="flex items-center gap-2 text-red-600">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                Sai ({wrongCount})
              </span>

              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                Tự luận (0)
              </span>

              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-3 h-3 rounded-full border border-gray-400"></span>
                Chưa làm ({notAnsweredCount})
              </span>

            </div>

          </div>

          {/* DESKTOP HEADER (CENTER) */}
          <div className="hidden md:flex flex-1 justify-center">

            <div className="flex gap-8 text-sm font-medium">

              <span>Tất cả ({questions.length})</span>

              <span className="flex items-center gap-2 text-green-600">
                <span className="w-3 h-3 rounded-full bg-green-600"></span>
                Đúng ({correctCount})
              </span>

              <span className="flex items-center gap-2 text-red-600">
                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                Sai ({wrongCount})
              </span>

              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                Tự luận (0)
              </span>

              <span className="flex items-center gap-2 text-gray-500">
                <span className="w-3 h-3 rounded-full border border-gray-400"></span>
                Chưa làm ({notAnsweredCount})
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* BODY */}

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

        {/* LEFT */}

        <div className="flex-1 overflow-y-auto flex justify-center p-4 md:p-6">

          <div className="w-full max-w-3xl space-y-6 md:space-y-8">

            {questions.map((question, index) => (

              <div
                key={question.id}
                ref={(el) => (questionRefs.current[index] = el)}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
              >

                {/* QUESTION HEADER */}

                <div className="flex justify-between mb-4 pb-2 border-b border-gray-200">

                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    Câu {question.orderNo}
                  </span>

                  {question.isCorrect ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold">✕</span>
                  )}

                </div>

                {/* <p className="font-medium mb-4">
                  {question.content}
                </p> */}

                <div className="font-medium mb-4">
                  {renderChainContent(question.chain)}
                </div>


                {/* ANSWERS */}

                {question.answers.map((answer, i) => {

                  const label = String.fromCharCode(65 + i);

                  return (
                    <div
                      key={answer.id}
                      className={`p-4 mb-3 border border-gray-200 rounded-lg flex justify-between
                      ${answer.isCorrect
                          ? "bg-green-50 border-green-500"
                          : answer.isSelected
                            ? "bg-red-50 border-red-500"
                            : ""
                        }`}
                    >

                      {/* <div>
                        <strong>{label}.</strong> {answer.content}
                      </div> */}
                      <div>
                        <strong>{label}. </strong>
                        {renderChainContent(answer.chain)}
                      </div>

                      {answer.isCorrect && (
                        <span className="text-green-600 font-bold">✓</span>
                      )}

                      {answer.isSelected && !answer.isCorrect && (
                        <span className="text-red-600 font-bold">✕</span>
                      )}

                    </div>
                  );

                })}

              </div>

            ))}

          </div>

        </div>


        {/* RIGHT PANEL */}

        <div
          className="
          w-full
          md:w-80
          bg-white
          border-t md:border-t-0
          md:border-l
          border-gray-200
          flex flex-col
          md:h-full
        "
        >

          {/* DESKTOP PANEL */}

          <div className="hidden md:block p-5 flex-1">

            <p className="text-sm text-gray-500 mb-1">
              BÀI THI
            </p>

            <h2 className="font-semibold mb-3">
              {examTitle}
            </h2>

            {/* NAVIGATOR */}

            <div className="grid grid-cols-5 gap-2">

              {questions.map((q, index) => (

                <button
                  key={q.id}
                  onClick={() =>
                    questionRefs.current[index]?.scrollIntoView({
                      behavior: "smooth"
                    })
                  }
                  className={`w-8 h-8 text-xs rounded border border-gray-200
                  ${q.isCorrect
                      ? "bg-green-600 text-white"
                      : q.selectedAnswerIds?.length
                        ? "bg-red-500 text-white"
                        : "bg-gray-100"
                    }`}
                >
                  {q.orderNo}
                </button>

              ))}

            </div>

          </div>


          {/* MOBILE BAR */}

          <div className="md:hidden p-4 border-t border-gray-200">
            {/* TÊN BÀI THI */}
            <p className="text-sm font-semibold mb-3 ">
              {examTitle}
            </p>

            <div className="flex justify-between">

              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 cursor-pointer"
              >
                ✕ Thoát
              </button>

              <button
                onClick={handleRedo}
                className="bg-green-700 text-white px-5 py-2 rounded-full cursor-pointer"
              >
                Làm lại
              </button>

            </div>

          </div>


          {/* DESKTOP BUTTON */}

          <div className="hidden md:flex p-5 justify-between border-t border-gray-200">

            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-red-600 cursor-pointer"
            >
              ✕ Thoát
            </button>

            <button
              onClick={handleRedo}
              className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-full cursor-pointer"
            >
              Làm lại
            </button>

          </div>

        </div>

      </div>

    </div>

  );

};

export default ExamReview;
