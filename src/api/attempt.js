import { API } from "./endpoint";
import { fetch, parseResponse } from "./client";

export const startAttempt = async (data) => {
  const res = await fetch(API.ATTEMPT.START, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseResponse(res);
};

export const submitAttempt = async (attemptId, answers) => {
  const res = await fetch(API.ATTEMPT.SUBMIT(attemptId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers }),
  });

  return parseResponse(res);
};

export const getAttemptReview = async (attemptId) => {
  const res = await fetch(API.ATTEMPT.REVIEW(attemptId));

  return parseResponse(res);
};

export const getExamHistory = async (fromDate, toDate) => {
  const res = await fetch(
    API.ATTEMPT.EXAM_HISTORY(fromDate, toDate)
  );

  return parseResponse(res);
};


export const getAttemptList = async ({
  questionBankId,
  examSetId,
  page = 1,
  size = 1000,
}) => {
  const res = await fetch(
    API.ATTEMPT.LIST(questionBankId, examSetId, page, size)
  );

  return parseResponse(res);
};
