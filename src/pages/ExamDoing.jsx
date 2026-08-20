import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock3, Headphones } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import mockExamData from "../datas/mockExamData";
import { submitAttempt } from "../api/attempt";
import { buildAssetUrl } from "../api/client";
import bellSound from "../assets/bell.mp3";

const ConfirmModal = ({ title, description, cancelLabel, confirmLabel = "Nộp bài", onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 leading-6 text-slate-500">{description}</p>
      <div className={`mt-6 grid gap-3 ${onCancel ? "grid-cols-2" : ""}`}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">
            {cancelLabel}
          </button>
        )}
        <button type="button" onClick={onConfirm} className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800">
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

const ExamDoing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const attemptId = location.state?.attemptId;
  const questionBankName = location.state?.questionBankName;

  const questionGroups = useMemo(() => {
    const groups = location.state?.groups;
    if (Array.isArray(groups) && groups.some((group) => group?.questions?.length)) {
      return groups
        .filter((group) => group?.questions?.length)
        .map((group, index) => ({ ...group, key: group.sectionId || `general-${index}` }));
    }
    return [{
      key: "all",
      sectionId: null,
      title: null,
      instruction: null,
      meta: null,
      questions: location.state?.questions || [],
    }];
  }, [location.state]);

  const questions = useMemo(() => questionGroups.flatMap((group) => group.questions), [questionGroups]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const questionRefs = useRef({});

  const currentGroup = questionGroups[selectedGroupIndex] || questionGroups[0];
  const visibleQuestions = currentGroup?.questions || [];
  const hasSections = questionGroups.some((group) => group.sectionId);
  const answeredCount = questions.filter((question) => answers[question.id]).length;
  const groupAnsweredCount = visibleQuestions.filter((question) => answers[question.id]).length;

  const totalTime = mockExamData.duration * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  useEffect(() => {
    if (timeLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setShowTimeUpModal(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const timeProgress = ((totalTime - timeLeft) / totalTime) * 100;
  const formattedTime = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
  const warningAudioRef = useRef(null);
  const warnedOneThird = useRef(false);
  const warnedTwoThirds = useRef(false);
  useEffect(() => {
    if (!warningAudioRef.current) warningAudioRef.current = new Audio(bellSound);
    if (timeProgress >= 33 && !warnedOneThird.current) {
      warnedOneThird.current = true;
      toast("Bạn đã dùng hết 1/3 thời gian làm bài.");
      warningAudioRef.current.play().catch(() => {});
    }
    if (timeProgress >= 66 && !warnedTwoThirds.current) {
      warnedTwoThirds.current = true;
      toast.error("Thời gian không còn nhiều, hãy kiểm tra lại bài làm.");
      warningAudioRef.current.play().catch(() => {});
    }
  }, [timeProgress]);

  const selectGroup = (index) => {
    setSelectedGroupIndex(index);
    window.requestAnimationFrame(() => document.getElementById("exam-content")?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const handleSelect = (question, answerIndex) => {
    const label = String.fromCharCode(65 + answerIndex);
    setAnswers((current) => ({ ...current, [question.id]: `${question.orderNo}${label}` }));
  };

  const handleSubmit = async () => {
    try {
      const response = await submitAttempt(attemptId, Object.values(answers));
      const data = response?.data || response;
      const total = questions.reduce((sum, question) => sum + Number(question.points || 0), 0);
      const used = totalTime - timeLeft;
      const result = {
        date: data.submittedAt,
        score: data.score,
        total,
        time: `${Math.floor(used / 60)} phút ${used % 60} giây`,
        attemptId: data.attemptId || attemptId,
        questionBankId: id,
        examSetId: data.examSetId,
        isSelected: true,
      };
      const previous = JSON.parse(localStorage.getItem(`exam_${id}`) || "[]");
      localStorage.setItem(`exam_${id}`, JSON.stringify([...previous, result]));
      localStorage.setItem("exam_result_popup", JSON.stringify(result));
      toast.success("Nộp bài thành công");
      navigate(-1);
    } catch (error) {
      console.error(error);
      toast.error("Nộp bài thất bại");
    }
  };

  const renderContent = (items) => (Array.isArray(items) ? items : []).map((item) => {
    if (item.contentType === "TEXT") return <p key={item.id}>{item.content}</p>;
    if (item.contentType === "IMAGE") return <img key={item.id} src={buildAssetUrl(item.content)} alt="" className="my-3 max-w-full rounded-lg border border-slate-200" />;
    if (item.contentType === "AUDIO") return <audio key={item.id} controls preload="metadata" src={buildAssetUrl(item.content)} className="my-3 w-full" />;
    return null;
  });

  const renderAnswer = (answer) => renderContent(answer.chain?.length ? answer.chain : [{ id: answer.id, contentType: answer.contentType, content: answer.content }]);

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3">
          <button type="button" onClick={() => setShowExitModal(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="Thoát bài thi">
            <ArrowLeft size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{questionBankName || mockExamData.title}</p>
            <p className="text-xs text-slate-500">Đã làm {answeredCount}/{questions.length} câu</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 font-bold text-emerald-700">
            <Clock3 size={18} /> {formattedTime}
          </div>
        </div>
      </header>

      {hasSections && (
        <nav className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto pb-1">
            {questionGroups.map((group, index) => {
              const completed = group.questions.filter((question) => answers[question.id]).length;
              return (
                <button key={group.key} type="button" onClick={() => selectGroup(index)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${selectedGroupIndex === index ? "border-emerald-600 bg-emerald-600 text-white shadow-sm" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
                  <span className="block text-xs font-bold uppercase tracking-wide opacity-75">Phần {index + 1}</span>
                  <span className="block max-w-52 truncate text-sm font-semibold">{group.title || "Câu hỏi chung"}</span>
                  <span className="block text-xs opacity-75">{completed}/{group.questions.length} câu</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main id="exam-content" className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-7">
          <div className="mx-auto max-w-3xl space-y-5">
            {hasSections && (
              <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-5 text-white md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Phần {selectedGroupIndex + 1} / {questionGroups.length}</p>
                      <h1 className="mt-1 text-xl font-bold md:text-2xl">{currentGroup.title || "Câu hỏi chung"}</h1>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">{groupAnsweredCount}/{visibleQuestions.length} câu</span>
                  </div>
                  {currentGroup.instruction && <p className="mt-3 max-w-2xl leading-6 text-emerald-50">{currentGroup.instruction}</p>}
                </div>
                {currentGroup.meta?.audio?.path && (
                  <div className="flex flex-col gap-3 bg-emerald-50 p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 font-semibold text-emerald-900"><Headphones size={20} />{currentGroup.meta.audio.label || "Audio của phần"}</div>
                    <audio controls preload="metadata" src={buildAssetUrl(currentGroup.meta.audio.path)} className="h-10 w-full sm:ml-auto sm:max-w-md" />
                  </div>
                )}
              </section>
            )}

            {visibleQuestions.map((question) => (
              <article key={question.id} ref={(element) => { questionRefs.current[question.id] = element; }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">Câu {question.orderNo}</span>
                  {answers[question.id] && <span className="text-xs font-semibold text-emerald-600">Đã trả lời</span>}
                </div>
                <div translate="no" className="notranslate mb-6 text-lg font-medium leading-7 text-slate-900">{renderContent(question.chain)}</div>
                <div className="space-y-3">
                  {(question.answers || []).map((answer, answerIndex) => {
                    const label = String.fromCharCode(65 + answerIndex);
                    const selected = answers[question.id] === `${question.orderNo}${label}`;
                    return (
                      <button key={answer.id} type="button" onClick={() => handleSelect(question, answerIndex)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${selected ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"}`}>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${selected ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</span>
                        <span translate="no" className="notranslate min-w-0 flex-1 pt-1">{renderAnswer(answer)}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}

            {hasSections && (
              <div className="flex items-center justify-between pb-3 pt-1">
                <button type="button" disabled={selectedGroupIndex === 0} onClick={() => selectGroup(selectedGroupIndex - 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft size={18} />Phần trước</button>
                {selectedGroupIndex < questionGroups.length - 1 ? (
                  <button type="button" onClick={() => selectGroup(selectedGroupIndex + 1)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white">Phần tiếp<ChevronRight size={18} /></button>
                ) : (
                  <button type="button" onClick={() => setShowSubmitModal(true)} className="rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white">Nộp bài</button>
                )}
              </div>
            )}
          </div>
        </main>

        <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white md:h-full md:w-80 md:border-l md:border-t-0">
          <div className="hidden min-h-0 flex-1 overflow-y-auto p-5 md:block">
            <div className="mb-5">
              <div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-slate-700">Tiến độ bài làm</span><span className="font-bold text-emerald-700">{answeredCount}/{questions.length}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} /></div>
            </div>
            {hasSections && <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Phần {selectedGroupIndex + 1}</p>}
            <h2 className="mb-4 font-bold text-slate-900">{currentGroup.title || "Danh sách câu hỏi"}</h2>
            <div className="grid grid-cols-5 gap-2">
              {visibleQuestions.map((question) => (
                <button key={question.id} type="button" onClick={() => questionRefs.current[question.id]?.scrollIntoView({ behavior: "smooth", block: "start" })} className={`h-10 rounded-lg text-sm font-bold ${answers[question.id] ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{question.orderNo}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 p-4 md:p-5">
            <button type="button" onClick={() => setShowExitModal(true)} className="font-semibold text-slate-500 hover:text-red-600">Thoát</button>
            <button type="button" onClick={() => setShowSubmitModal(true)} className="rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800">Nộp bài</button>
          </div>
        </aside>
      </div>

      {showExitModal && <ConfirmModal title="Bạn chắc chắn muốn thoát?" description="Bài làm hiện tại có thể chưa được lưu." cancelLabel="Ở lại" confirmLabel="Thoát" onCancel={() => setShowExitModal(false)} onConfirm={() => navigate(-1)} />}
      {showSubmitModal && <ConfirmModal title="Nộp bài thi?" description={`Bạn đã trả lời ${answeredCount}/${questions.length} câu. Sau khi nộp, bạn không thể thay đổi đáp án.`} cancelLabel="Làm tiếp" onCancel={() => setShowSubmitModal(false)} onConfirm={() => { setShowSubmitModal(false); handleSubmit(); }} />}
      {showTimeUpModal && <ConfirmModal title="Đã hết giờ làm bài" description="Hệ thống sẽ nộp những đáp án bạn đã chọn." onConfirm={handleSubmit} />}
    </div>
  );
};

export default ExamDoing;
