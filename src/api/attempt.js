import { API } from "./endpoint";
import { fetch, parseResponse } from "./client";

const unauthenticatedResult = {
  success: false,
  unauthorized: true,
  data: null,
};

const hasAccessToken = () => Boolean(localStorage.getItem("accessToken"));

export const startAttempt = async (data) => {
  if (!hasAccessToken()) return unauthenticatedResult;

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
  if (!hasAccessToken()) return unauthenticatedResult;

  const res = await fetch(API.ATTEMPT.SUBMIT(attemptId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ answers }),
  });

  return parseResponse(res);
};

export const startPublicAttempt = async (data) => {
  const res = await fetch(
    API.PUBLIC_ATTEMPT.START,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    null
  );

  return parseResponse(res);
};

export const submitPublicAttempt = async (attemptId, answers) => {
  const res = await fetch(
    API.PUBLIC_ATTEMPT.SUBMIT(attemptId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    },
    null
  );

  return parseResponse(res);
};
// export const submitAttempt = async (attemptId, answers) => {
//   const res = await fetch(API.ATTEMPT.SUBMIT(attemptId), {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },

//     // ✅ PHẢI LÀ CÁI NÀY
//     body: JSON.stringify(answers),
//   });

//   return parseResponse(res);
// };
export const getAttemptReview = async (attemptId) => {
  if (!hasAccessToken()) return unauthenticatedResult;

  const res = await fetch(API.ATTEMPT.REVIEW(attemptId));

  return parseResponse(res);
};

export const getExamHistory = async (fromDate, toDate) => {
  if (!hasAccessToken()) return unauthenticatedResult;

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
  status = "SUBMITTED"
}) => {
  if (!hasAccessToken()) return unauthenticatedResult;

  const res = await fetch(
    API.ATTEMPT.LIST(questionBankId, examSetId, page, size, status)
  );

  return parseResponse(res);
};


export const getMyStatistics = async () => {
  if (!hasAccessToken()) return unauthenticatedResult;

  const res = await fetch(API.ATTEMPT.MY_STATISTICS);

  return parseResponse(res);
};
