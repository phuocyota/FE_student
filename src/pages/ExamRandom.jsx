import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getRandomQuestion } from "../api/questionBank";
import { buildAssetUrl } from "../api/client";

const RANDOM_QUESTION_BANK_ID = "37b64ed4-0e46-4a00-9ae2-92b707d9a4ce";

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const buildContentChain = (node) => {
  if (!node) return [];

  const current =
    node.contentType && node.content
      ? [
          {
            id: node.id,
            contentType: node.contentType,
            content: node.content,
          },
        ]
      : [];

  return [
    ...current,
    ...toArray(node.nextContentDetails).flatMap((item) =>
      buildContentChain(item)
    ),
  ];
};

const ExamRandom = () => {
  const { id } = useParams();
  const questionBankId = id || RANDOM_QUESTION_BANK_ID;

  const [question, setQuestion] = useState(null);
  const [selectedAnswerIds, setSelectedAnswerIds] = useState([]);
  const usedQuestionIdsRef = useRef([]);
  const isLoadingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOutOfQuestions, setIsOutOfQuestions] = useState(false);

  const contentChain = useMemo(() => buildContentChain(question), [question]);
  const sortedAnswers = useMemo(() => {
    return toArray(question?.answers).sort((a, b) => {
      const orderA = a.orderNo ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderNo ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) return orderA - orderB;

      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
  }, [question]);

  const hasSelectedAnswer = selectedAnswerIds.length > 0;

  const fetchRandomQuestion = useCallback(
    async ({ reset = false } = {}) => {
      if (!questionBankId || isLoadingRef.current) return;

      const excludedIds = reset ? [] : usedQuestionIdsRef.current;

      isLoadingRef.current = true;
      setIsLoading(true);
      setIsOutOfQuestions(false);

      try {
        const res = await getRandomQuestion(questionBankId, excludedIds);
        const nextQuestion = res?.data || res;

        if (!nextQuestion?.id) {
          throw new Error("Khong nhan duoc du lieu cau hoi");
        }

        setQuestion(nextQuestion);
        setSelectedAnswerIds([]);

        const nextUsedIds = reset
          ? [nextQuestion.id]
          : [...usedQuestionIdsRef.current, nextQuestion.id];

        usedQuestionIdsRef.current = nextUsedIds;
      } catch (error) {
        console.error(error);

        if (error.status === 404) {
          setIsOutOfQuestions(true);
          toast("Da het cau hoi trong ngan hang");
          return;
        }

        if (error.message?.toLowerCase().includes("not found")) {
          setIsOutOfQuestions(true);
          toast("Da het cau hoi trong ngan hang");
          return;
        }

        toast.error(error.message || "Khong the lay cau hoi ngau nhien");
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [questionBankId]
  );

  useEffect(() => {
    usedQuestionIdsRef.current = [];
    setSelectedAnswerIds([]);
    setQuestion(null);
    setIsOutOfQuestions(false);
    fetchRandomQuestion({ reset: true });
  }, [fetchRandomQuestion, questionBankId]);

  const handleSelectAnswer = (answerId) => {
    if (!answerId || hasSelectedAnswer) return;
    setSelectedAnswerIds([answerId]);
  };

  const renderContent = (chain, emptyMessage = "Cau hoi khong co noi dung.") => {
    if (!chain.length) {
      return <p className="text-gray-500">{emptyMessage}</p>;
    }

    return chain.map((item) => {
      if (item.contentType === "TEXT") {
        return (
          <p key={item.id} className="text-base font-medium text-gray-900">
            {item.content}
          </p>
        );
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
            className="w-full"
          />
        );
      }

      return null;
    });
  };

  const renderAnswers = () => {
    if (!question || !sortedAnswers.length) {
      return <p className="text-sm text-gray-500">Cau hoi chua co dap an.</p>;
    }

    return (
      <div className="space-y-3">
        {sortedAnswers.map((answer, index) => {
          const label = String.fromCharCode(65 + index);
          const isSelected = selectedAnswerIds.includes(answer.id);
          const showCorrect = hasSelectedAnswer && answer.isCorrect;
          const showWrong = hasSelectedAnswer && isSelected && !answer.isCorrect;

          const answerClass = showCorrect
            ? "border-green-600 bg-green-50"
            : showWrong
              ? "border-red-500 bg-red-50"
              : isSelected
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:bg-gray-50";

          return (
            <div
              key={answer.id}
              role="button"
              tabIndex={hasSelectedAnswer ? -1 : 0}
              onClick={() => handleSelectAnswer(answer.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSelectAnswer(answer.id);
                }
              }}
              className={`w-full text-left border rounded-xl p-4 flex gap-3 cursor-pointer ${answerClass}`}
            >
              <span className="font-semibold text-gray-900">{label}.</span>
              <div className="flex-1 space-y-2">
                {renderContent(buildContentChain(answer), "Dap an khong co noi dung.")}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex-1 overflow-y-auto flex justify-center p-4 md:p-6">
          <div className="w-full max-w-3xl">
            <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm min-h-72">
              {isLoading && !question ? (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Dang tai cau hoi...
                </div>
              ) : isOutOfQuestions && !question ? (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <p className="font-semibold text-gray-900">Da het cau hoi</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Khong con cau hoi nao chua hien thi trong ngan hang nay.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">{renderContent(contentChain)}</div>
                  {renderAnswers()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamRandom;
