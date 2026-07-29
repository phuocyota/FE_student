import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  FileQuestion,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { startPublicAttempt, submitPublicAttempt } from "../api/attempt";
import { buildAssetUrl } from "../api/client";
import { getPublicExamSetDetail } from "../api/grade";

const DEFAULT_EXAM_SET_ID = "211692b6-11ae-461c-a48a-a3e62cb6e93b";
const EXAM_SET_ID =
  import.meta.env.VITE_PLACEMENT_EXAM_SET_ID || DEFAULT_EXAM_SET_ID;
const TEST_DURATION = 20 * 60;
const PROGRESS_KEY = "public_placement_attempt";
const RESULT_KEY = "public_placement_result";

const unwrapData = (payload) => payload?.data?.data || payload?.data || payload;

const readStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

const getQuestionBanks = (payload) => {
  const data = unwrapData(payload);
  return Array.isArray(data?.questionBanks) ? data.questionBanks : [];
};

const getQuestionBankName = (questionBank) =>
  questionBank?.name ||
  questionBank?.title ||
  questionBank?.code ||
  "Đề thi chưa có tên";

const getQuestionTotal = (questionBank) =>
  questionBank?.totalQuestions ??
  questionBank?.questionCount ??
  questionBank?.totalQuestion ??
  (Array.isArray(questionBank?.questions)
    ? questionBank.questions.length
    : null);

const isMultipleChoice = (question) =>
  ["MULTIPLE_CHOICE", "MULTI_CHOICE"].includes(question?.type);

const isTextQuestion = (question) =>
  [
    "ESSAY",
    "TEXT",
    "TEXT_INPUT",
    "FILL_IN_THE_BLANK",
    "SHORT_ANSWER",
  ].includes(question?.type);

const sortByOrderNo = (items) =>
  [...items].sort(
    (first, second) =>
      Number(first?.orderNo ?? Number.MAX_SAFE_INTEGER) -
      Number(second?.orderNo ?? Number.MAX_SAFE_INTEGER)
  );

const buildQuestionGroups = (sourceQuestions) => {
  const list = Array.isArray(sourceQuestions) ? sourceQuestions : [];
  const hasSections = list.some((item) => item?.sectionId);

  if (!hasSections) {
    return [
      {
        id: null,
        title: null,
        instruction: null,
        orderNo: null,
        questions: sortByOrderNo(list),
      },
    ];
  }

  const sectionMap = new Map();
  const unsectionedQuestions = [];

  list.forEach((item) => {
    if (!item?.sectionId) {
      unsectionedQuestions.push(item);
      return;
    }

    const current = sectionMap.get(item.sectionId);

    if (current) {
      current.questions.push(item);
      return;
    }

    sectionMap.set(item.sectionId, {
      id: item.sectionId,
      title: item.sectionTitle || "Phần chưa có tên",
      instruction: item.sectionInstruction || null,
      orderNo: item.sectionOrderNo,
      questions: [item],
    });
  });

  const sectionGroups = [...sectionMap.values()]
    .sort(
      (first, second) =>
        Number(first.orderNo ?? Number.MAX_SAFE_INTEGER) -
        Number(second.orderNo ?? Number.MAX_SAFE_INTEGER)
    )
    .map((group) => ({
      ...group,
      questions: sortByOrderNo(group.questions),
    }));

  if (unsectionedQuestions.length) {
    sectionGroups.push({
      id: null,
      title: "Câu hỏi chung",
      instruction: null,
      orderNo: null,
      questions: sortByOrderNo(unsectionedQuestions),
    });
  }

  return sectionGroups;
};

const Content = ({ type, value, className = "" }) => {
  if (!value) return null;

  if (type === "IMAGE") {
    return (
      <img
        src={buildAssetUrl(value)}
        alt="Nội dung câu hỏi"
        className={`max-h-80 max-w-full rounded-xl object-contain ${className}`}
      />
    );
  }

  if (type === "AUDIO") {
    return (
      <audio controls className={`w-full ${className}`}>
        <source src={buildAssetUrl(value)} />
      </audio>
    );
  }

  if (type === "VIDEO") {
    return (
      <video controls className={`max-h-80 w-full rounded-xl ${className}`}>
        <source src={buildAssetUrl(value)} />
      </video>
    );
  }

  return <span className={className}>{value}</span>;
};

const getContentChain = (node) => {
  if (Array.isArray(node?.chain) && node.chain.length) {
    return node.chain.filter((item) => item?.content);
  }

  return node?.content ? [node] : [];
};

const ContentChain = ({ node, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    {getContentChain(node).map((item, index) => (
      <Content
        key={item.id || `${item.contentType}-${index}`}
        type={item.contentType}
        value={item.content}
      />
    ))}
  </div>
);

const PlacementTest = () => {
  const navigate = useNavigate();
  const savedAttempt = useMemo(() => {
    const value = readStorage(PROGRESS_KEY);
    return value?.attemptId && Array.isArray(value?.questions) ? value : null;
  }, []);
  const savedResult = useMemo(() => readStorage(RESULT_KEY), []);

  const [stage, setStage] = useState(
    savedAttempt ? "test" : savedResult ? "result" : "intro"
  );
  const [studentName, setStudentName] = useState(
    savedAttempt?.guestName ||
      savedResult?.guestName ||
      localStorage.getItem("fullName") ||
      ""
  );
  const [questionBanks, setQuestionBanks] = useState([]);
  const [selectedQuestionBankId, setSelectedQuestionBankId] = useState(
    savedAttempt?.questionBankId || ""
  );
  const [attempt, setAttempt] = useState(savedAttempt);
  const [answers, setAnswers] = useState(savedAttempt?.answers || {});
  const [currentQuestion, setCurrentQuestion] = useState(
    savedAttempt?.currentQuestion || 0
  );
  const [timeLeft, setTimeLeft] = useState(
    savedAttempt?.timeLeft ?? TEST_DURATION
  );
  const [result, setResult] = useState(savedResult);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const questionGroups = useMemo(
    () => buildQuestionGroups(attempt?.questions),
    [attempt]
  );
  const questions = useMemo(
    () => questionGroups.flatMap((group) => group.questions),
    [questionGroups]
  );
  const question = questions[currentQuestion];
  const hasSections = questionGroups.some((group) => group.id);
  const currentQuestionGroup = question
    ? questionGroups.find((group) =>
        group.questions.some((item) => item.id === question.id)
      )
    : null;
  const currentSectionIndex = currentQuestionGroup
    ? questionGroups.indexOf(currentQuestionGroup)
    : -1;
  const questionIndexById = useMemo(
    () => new Map(questions.map((item, index) => [item.id, index])),
    [questions]
  );
  const answeredCount = questions.filter((item) => {
    const value = answers[item.id];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
  const progress = questions.length
    ? (answeredCount / questions.length) * 100
    : 0;
  const selectedQuestionBank = questionBanks.find(
    (item) => item.id === selectedQuestionBankId
  );

  const loadQuestionBanks = useCallback(async () => {
    setIsLoadingExams(true);
    setLoadError("");

    try {
      const payload = await getPublicExamSetDetail(EXAM_SET_ID);
      const list = getQuestionBanks(payload).filter((item) => item?.id);
      setQuestionBanks(list);
      setSelectedQuestionBankId((current) => current || list[0]?.id || "");

      if (!list.length) {
        setLoadError("Bộ đề hiện chưa có đề thi nào.");
      }
    } catch (error) {
      setLoadError(error.message || "Không thể tải danh sách đề thi.");
    } finally {
      setIsLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    loadQuestionBanks();
  }, [loadQuestionBanks]);

  useEffect(() => {
    if (stage !== "test" || !attempt) return;

    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({
        ...attempt,
        answers,
        currentQuestion,
        timeLeft,
      })
    );
  }, [answers, attempt, currentQuestion, stage, timeLeft]);

  const buildSubmissionAnswers = useCallback(
    () =>
      questions.flatMap((item) => {
        const value = answers[item.id];

        if (Array.isArray(value)) {
          return value.length
            ? [{ questionId: item.id, selectedAnswerIds: value }]
            : [];
        }

        if (!value) return [];

        return isTextQuestion(item)
          ? [{ questionId: item.id, textValue: value }]
          : [{ questionId: item.id, answerId: value }];
      }),
    [answers, questions]
  );

  const submitTest = useCallback(async () => {
    if (!attempt?.attemptId || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = await submitPublicAttempt(
        attempt.attemptId,
        buildSubmissionAnswers()
      );
      const nextResult = {
        ...unwrapData(payload),
        guestName: attempt.guestName,
        questionBankName: attempt.questionBankName,
      };

      setResult(nextResult);
      setStage("result");
      setShowSubmitModal(false);
      localStorage.setItem(RESULT_KEY, JSON.stringify(nextResult));
      localStorage.removeItem(PROGRESS_KEY);
    } catch (error) {
      setSubmitError(error.message || "Không thể nộp bài. Vui lòng thử lại.");
      setShowSubmitModal(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt, buildSubmissionAnswers, isSubmitting]);

  useEffect(() => {
    if (stage !== "test") return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          window.setTimeout(submitTest, 0);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [stage, submitTest]);

  const startTest = async () => {
    const normalizedName = studentName.trim();

    if (!normalizedName) {
      setFormError("Vui lòng nhập họ và tên học sinh.");
      return;
    }

    if (!selectedQuestionBankId) {
      setFormError("Vui lòng chọn một đề thi.");
      return;
    }

    setIsStarting(true);
    setFormError("");

    try {
      const payload = await startPublicAttempt({
        guestName: normalizedName,
        questionBankId: selectedQuestionBankId,
        examSetId: EXAM_SET_ID,
      });
      const data = unwrapData(payload);

      if (!data?.attemptId || !Array.isArray(data?.questions)) {
        throw new Error("Dữ liệu đề thi không hợp lệ.");
      }

      const nextAttempt = {
        ...data,
        guestName: data.guestName || normalizedName,
        questionBankId: data.questionBankId || selectedQuestionBankId,
        questionBankName:
          data.questionBankName ||
          data.examName ||
          getQuestionBankName(selectedQuestionBank),
      };

      setStudentName(normalizedName);
      setAttempt(nextAttempt);
      setAnswers({});
      setCurrentQuestion(0);
      setTimeLeft(TEST_DURATION);
      setResult(null);
      setStage("test");
      localStorage.removeItem(RESULT_KEY);
    } catch (error) {
      setFormError(error.message || "Không thể bắt đầu làm bài.");
    } finally {
      setIsStarting(false);
    }
  };

  const restartTest = () => {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(RESULT_KEY);
    setAttempt(null);
    setAnswers({});
    setCurrentQuestion(0);
    setTimeLeft(TEST_DURATION);
    setResult(null);
    setSubmitError("");
    setStage("intro");
  };

  const toggleAnswer = (questionItem, answerId) => {
    setAnswers((current) => {
      if (!isMultipleChoice(questionItem)) {
        return { ...current, [questionItem.id]: answerId };
      }

      const selected = Array.isArray(current[questionItem.id])
        ? current[questionItem.id]
        : [];
      return {
        ...current,
        [questionItem.id]: selected.includes(answerId)
          ? selected.filter((id) => id !== answerId)
          : [...selected, answerId],
      };
    });
  };

  if (stage === "intro") {
    const selectedTotal = getQuestionTotal(selectedQuestionBank);

    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-emerald-50 via-white to-slate-50 px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-700"
          >
            <ArrowLeft size={18} />
            Quay lại trang Thi
          </button>

          <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-900/5">
            <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
              <section className="p-6 sm:p-10 lg:p-12">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800">
                  <Sparkles size={16} />
                  Khám phá năng lực của con
                </span>

                <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
                  Bài test đầu vào
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Chọn đề phù hợp để đánh giá trình độ tiếng Anh hiện tại và
                  bắt đầu lộ trình học hiệu quả.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      icon: BookOpenCheck,
                      value: selectedTotal ? `${selectedTotal} câu` : "— câu",
                      label: "Trắc nghiệm",
                    },
                    { icon: Clock3, value: "20 phút", label: "Thời gian" },
                    {
                      icon: FileQuestion,
                      value: `${questionBanks.length || "—"} đề`,
                      label: "Lựa chọn",
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                      <item.icon className="mb-3 text-emerald-700" size={22} />
                      <div className="font-bold text-slate-900">{item.value}</div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 max-w-xl">
                  <label
                    htmlFor="placement-student-name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Họ và tên học sinh
                  </label>
                  <input
                    id="placement-student-name"
                    type="text"
                    value={studentName}
                    onChange={(event) => {
                      setStudentName(event.target.value);
                      if (formError) setFormError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") startTest();
                    }}
                    placeholder="Ví dụ: Nguyễn Minh Anh"
                    autoComplete="name"
                    maxLength={150}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      formError
                        ? "border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"
                    }`}
                  />
                  {formError && (
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-red-600">
                      <AlertCircle size={16} />
                      {formError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={startTest}
                  disabled={
                    isStarting || isLoadingExams || !selectedQuestionBankId
                  }
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {isStarting ? (
                    <>
                      <LoaderCircle className="animate-spin" size={19} />
                      Đang tạo bài thi...
                    </>
                  ) : (
                    <>
                      Bắt đầu làm bài
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>
              </section>

              <aside className="bg-emerald-800 p-6 text-white sm:p-10 lg:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <BrainCircuit size={30} />
                </div>
                <h2 className="mt-6 text-2xl font-bold">Chọn đề thi</h2>
                <p className="mt-2 text-emerald-100">
                  Các đề trong bộ thi thử tiếng Anh đầu vào
                </p>

                <div className="mt-8 space-y-3">
                  {isLoadingExams &&
                    Array.from({ length: 4 }, (_, index) => (
                      <div
                        key={index}
                        className="h-[70px] animate-pulse rounded-2xl bg-white/10"
                      />
                    ))}

                  {!isLoadingExams &&
                    questionBanks.map((item, index) => {
                      const isSelected = item.id === selectedQuestionBankId;
                      const total = getQuestionTotal(item);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedQuestionBankId(item.id);
                            setFormError("");
                          }}
                          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? "border-amber-300 bg-white/20 ring-2 ring-amber-300"
                              : "border-white/15 bg-white/10 hover:bg-white/15"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                              isSelected
                                ? "bg-amber-300 text-emerald-950"
                                : "bg-white/15 text-white"
                            }`}
                          >
                            {isSelected ? <Check size={19} /> : index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold">
                              {getQuestionBankName(item)}
                            </span>
                            {total !== null && (
                              <span className="mt-1 block text-sm text-emerald-100">
                                {total} câu hỏi
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {loadError && (
                  <div className="mt-5 rounded-2xl bg-red-950/30 p-4 text-sm text-red-50">
                    <p>{loadError}</p>
                    <button
                      type="button"
                      onClick={loadQuestionBanks}
                      className="mt-3 font-semibold underline underline-offset-4"
                    >
                      Thử tải lại
                    </button>
                  </div>
                )}

                <div className="mt-8 flex gap-3 rounded-2xl bg-emerald-950/30 p-4 text-sm text-emerald-50">
                  <Target
                    className="mt-0.5 shrink-0 text-amber-300"
                    size={20}
                  />
                  Hãy chọn đúng trình độ hiện tại để kết quả đánh giá sát nhất.
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "result" && result) {
    const totalQuestions = Number(result.totalQuestions) || questions.length;
    const score = Number(result.score) || 0;
    const accuracy = totalQuestions
      ? Math.round((score / totalQuestions) * 100)
      : 0;

    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={34} />
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
              Hoàn thành bài đánh giá
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Kết quả của {result.guestName || "học sinh"}
            </h1>
            <p className="mt-2 text-slate-500">{result.questionBankName}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 p-5">
                <div className="text-3xl font-bold text-emerald-700">{score}</div>
                <div className="mt-1 text-sm text-slate-600">Điểm số</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="text-3xl font-bold text-slate-800">
                  {result.answeredQuestions ?? answeredCount}/{totalQuestions}
                </div>
                <div className="mt-1 text-sm text-slate-600">Đã trả lời</div>
              </div>
              <div className="rounded-2xl bg-amber-50 p-5">
                <div className="text-3xl font-bold text-amber-700">
                  {accuracy}%
                </div>
                <div className="mt-1 text-sm text-slate-600">Kết quả</div>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={restartTest}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw size={18} />
                Chọn đề khác
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
              >
                Về trang Thi
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const selectedAnswer = answers[question.id];

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Thoát bài test"
          >
            <X size={19} />
          </button>

          <div className="hidden flex-1 sm:block">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
              <span className="min-w-0 truncate">
                {currentQuestionGroup?.title || attempt.questionBankName}
              </span>
              <span>
                {answeredCount}/{questions.length} câu
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-bold ${
              timeLeft <= 180
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            <Clock3 size={18} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_300px] lg:px-6">
        <main className="flex items-start justify-center">
          <section className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            {hasSections && currentQuestionGroup && (
              <div className="mb-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    {currentQuestionGroup.id
                      ? `Part ${currentSectionIndex + 1}`
                      : "Phần chung"}
                  </span>
                  <h2 className="font-bold text-emerald-950 sm:text-lg">
                    {currentQuestionGroup.title}
                  </h2>
                </div>
                {currentQuestionGroup.instruction && (
                  <p className="mt-2 leading-6 text-emerald-900/75">
                    {currentQuestionGroup.instruction}
                  </p>
                )}
              </div>
            )}

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
              Câu {currentQuestion + 1}/{questions.length}
            </span>

            <ContentChain
              node={question}
              className="mt-7 text-xl font-bold leading-8 text-slate-900 sm:text-2xl"
            />

            {isTextQuestion(question) ? (
              <textarea
                value={selectedAnswer || ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.value,
                  }))
                }
                rows={6}
                placeholder="Nhập câu trả lời..."
                className="mt-7 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            ) : (
              <div className="mt-7 space-y-3">
                {(question.answers || []).map((answer, index) => {
                  const selected = Array.isArray(selectedAnswer)
                    ? selectedAnswer.includes(answer.id)
                    : selectedAnswer === answer.id;

                  return (
                    <button
                      key={answer.id}
                      type="button"
                      onClick={() => toggleAnswer(question, answer.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                          : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold ${
                          selected
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <ContentChain
                        node={answer}
                        className="min-w-0 flex-1 font-medium text-slate-800"
                      />
                      {selected && (
                        <Check
                          className="ml-auto shrink-0 text-emerald-700"
                          size={21}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestion((current) => Math.max(0, current - 1))
                }
                disabled={currentQuestion === 0}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowLeft size={18} />
                Câu trước
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestion((current) => current + 1)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-800"
                >
                  Câu tiếp
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  Nộp bài
                </button>
              )}
            </div>
          </section>
        </main>

        <aside className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
          <h2 className="font-bold text-slate-900">Danh sách câu hỏi</h2>
          <p className="mt-1 text-sm text-slate-500">
            {hasSections
              ? `${questionGroups.length} phần · ${questions.length} câu`
              : "Chọn số câu để xem lại"}
          </p>
          <div className="mt-5 max-h-[calc(100vh-310px)] space-y-5 overflow-y-auto pr-1">
            {questionGroups.map((group, groupIndex) => (
              <div key={group.id || "unsectioned"}>
                {hasSections && (
                  <div className="mb-2">
                    <div
                      className={`text-sm font-bold ${
                        currentQuestionGroup === group
                          ? "text-emerald-700"
                          : "text-slate-700"
                      }`}
                    >
                      {group.title || `Part ${groupIndex + 1}`}
                    </div>
                    {group.instruction && (
                      <p
                        className="mt-0.5 truncate text-xs text-slate-400"
                        title={group.instruction}
                      >
                        {group.instruction}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  {group.questions.map((item) => {
                    const index = questionIndexById.get(item.id);
                    const value = answers[item.id];
                    const isAnswered = Array.isArray(value)
                      ? value.length > 0
                      : Boolean(value);
                    const isCurrent = currentQuestion === index;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCurrentQuestion(index)}
                        aria-label={`Câu ${index + 1}${
                          group.title ? `, ${group.title}` : ""
                        }`}
                        className={`h-11 rounded-xl text-sm font-bold transition ${
                          isCurrent
                            ? "bg-emerald-700 text-white ring-4 ring-emerald-100"
                            : isAnswered
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </button>
          {submitError && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {submitError}
            </p>
          )}
        </aside>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <BookOpenCheck size={28} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Nộp bài test?
            </h2>
            <p className="mt-2 leading-6 text-slate-500">
              Bạn đã trả lời {answeredCount}/{questions.length} câu.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={submitTest}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {isSubmitting && (
                  <LoaderCircle className="animate-spin" size={18} />
                )}
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {showExitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900">
              Tạm dừng làm bài?
            </h2>
            <p className="mt-2 leading-6 text-slate-500">
              Đáp án và thời gian còn lại đã được lưu trên thiết bị này.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-900"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementTest;
