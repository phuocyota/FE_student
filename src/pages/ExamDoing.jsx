import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import mockExamData from "../datas/mockExamData";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { submitAttempt } from "../api/attempt";
import { buildAssetUrl } from "../api/client";
import bellSound from "../assets/bell.mp3";

const ExamDoing = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const { id } = useParams();

  const attemptId = location.state?.attemptId;
  const [questions] = useState(location.state?.questions || []);

  const [answers, setAnswers] = useState({});
  const questionRefs = useRef([]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  /* ================= TIMER ================= */

  const totalTime = mockExamData.duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);

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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;


const timeProgress = ((totalTime - timeLeft) / totalTime) * 100;

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

    try {

       const answersSubmit = Object.values(answers);

   
    // const answersSubmit = questions.map(q => answers[q.id]);
     
      // console.log("QUESTIONS ORDER:", questions.map(q => q.orderNo));
      // console.log("ANSWERS OBJECT:", answers);
      // console.log("FINAL SUBMIT:", answersSubmit);
      // console.log("SUBMIT:", answersSubmit);

      const res = await submitAttempt(attemptId, answersSubmit);

      const totalPoints = questions.reduce(
        (sum, q) => sum + q.points,
        0
      );

      if (res ) {

        const timeUsed = totalTime - timeLeft;
        const minutes = Math.floor(timeUsed / 60);
        const seconds = timeUsed % 60;
``
        const result = {
          date: res.submittedAt,
          score: res.score,
          total: totalPoints,
          time: `${minutes} phút ${seconds} giây`,
          attemptId: res.attemptId,
          isSelected: true
        };

        const existing =
          JSON.parse(localStorage.getItem(`exam_${id}`)) || [];

        localStorage.setItem(
          `exam_${id}`,
          JSON.stringify([...existing, result])
        );

        localStorage.setItem(
          "exam_result_popup",
          JSON.stringify({
            score: res.data.score,
            total: totalPoints
          })
        );

        toast.success("Nộp bài thành công");
        navigate(-1);

      }

    } catch (error) {

      console.error(error);
      toast.error("Nộp bài thất bại");

    }

  };

 
  const confirmExit = () => navigate(-1);

  // hiển thị hình ảnh , audio , text
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
            alt=""
            className="my-3 max-w-full rounded-lg border border-gray-200 shadow-sm"
          />
        );
      }


      if (item.contentType === "AUDIO") {
        return (
          <audio
            key={item.id}
            controls
            src={buildAssetUrl(item.content)}
          />
        );
      }

      return null;
    });
  };


  const getAnswerContent = (answer) => {
    if (answer.chain && answer.chain.length > 0) {
      return renderChainContent(answer.chain);
    }

    // fallback về content
    return renderChainContent([
      {
        id: answer.id,
        contentType: answer.contentType,
        content: answer.content,
      },
    ]);
  };


  // thêm hiệu ứng khi hết giờ
 

const warned1 = useRef(false);
const warned2 = useRef(false);
const isFirstRender = useRef(true);

const audioRef = useRef(null);

useEffect(() => {
  if (!audioRef.current) {
    audioRef.current = new Audio(bellSound);
  }

  // ⛔ chặn lần đầu
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }

  if (timeProgress >= 33 && !warned1.current) {
    warned1.current = true;
   toast("⚠️ Bạn đã hết 1/3 thời gian làm bài!");
    audioRef.current.play();
  }

  if (timeProgress >= 66 && !warned2.current) {
    warned2.current = true;
    toast.error("⏰ Còn ít thời gian! Hãy kiểm tra lại bài làm của bạn!");
    audioRef.current.play();
  }

}, [timeProgress]);
  return (

    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-hidden">

      {/* HEADER */}

      <div className="bg-white border-b border-gray-200 px-4 py-3">

        <div className="flex items-center">

          {/* BACK BUTTON */}
          <button
            onClick={() => setShowExitModal(true)}
            className="hidden md:flex w-10 h-10 rounded-full bg-gray-200 items-center justify-center hover:bg-gray-300 cursor-pointer mr-4"
          >
            <ArrowLeft size={18} />
          </button>

          {/* HEADER CENTER */}
          <div className="flex-1 flex justify-center md:pr-80">

            <div className="flex gap-8 text-sm font-medium">

              <span className="border-b-2 border-green-600 pb-1">
                Tất cả ({questions.length})
              </span>

              <span className="text-gray-500">
                ○ Chưa làm ({notAnsweredCount})
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
                className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm"
              >

                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  Câu {question.orderNo}
                </span>

                {/* <p className="my-4 font-medium">
                  {question.content}
                </p> */}
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
                      className={`border border-gray-200 rounded-xl p-4 mb-3 flex justify-between cursor-pointer
                      ${isSelected
                          ? "border-green-600 bg-green-50"
                          : "hover:bg-gray-50"
                        }`}
                    >

                      {/* <div>
                        <strong>{label}.</strong> {answer.content}
                      </div> */}
                      <div>
                        <strong>{label}. </strong>
                        {getAnswerContent(answer)}
                      </div>

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

          {/* DESKTOP CONTENT */}

          <div className="hidden md:block p-5 flex-1">

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
                      questionRefs.current[index]?.scrollIntoView({
                        behavior: "smooth"
                      })
                    }
                    className={`w-8 h-8 text-xs rounded border border-gray-200
                    ${isAnswered
                        ? "bg-green-600 text-white"
                        : "bg-gray-100"
                      }`}
                  >
                    {q.orderNo}
                  </button>
                );

              })}

            </div>

          </div>


          {/* MOBILE BAR */}

          <div className="md:hidden p-4 border-t border-gray-200">

            <p className="text-sm font-semibold mb-3">
              {mockExamData.title}
            </p>

            <div className="flex justify-between">

              <button
                onClick={() => setShowExitModal(true)}
                className="text-gray-600 cursor-pointer"
              >
                ✕ Thoát
              </button>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-green-700 text-white px-5 py-2 rounded-full cursor-pointer"
              >
                NỘP BÀI
              </button>

            </div>

          </div>


          {/* DESKTOP BUTTON */}

          <div className="hidden md:flex p-5 justify-between border-t border-gray-200">


            <button
              onClick={() => setShowExitModal(true)}
              className="text-gray-600 hover:text-red-600 cursor-pointer"
            >
              ✕ Thoát
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-full cursor-pointer"
            >
              NỘP BÀI
            </button>

          </div>

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

export default ExamDoing;
