import { API_BASE_URL } from "./client";

export const API = {
  AUTH: {
    LOGIN_STUDENT: `${API_BASE_URL}/auth/login/student`,
  },
  GRADE: {
    GET_ALL: `${API_BASE_URL}/grade?isGetAllDetail=true`,

  },
  EXAM_SET: {
    DETAIL: (id) => `${API_BASE_URL}/exam-set/${id}`,
    GET_BY_SUBJECT: (subjectId) =>
    `${API_BASE_URL}/exam-set?subjectId=${subjectId}`,

  

  },
  STUDENT: {
    UPLOAD_AVATAR: `${API_BASE_URL}/upload/single`,
    DETAIL: (id) => `${API_BASE_URL}/users/${id}`,
    UPDATE_AVATAR: (id) => `${API_BASE_URL}/users/${id}`,
    UPDATE_PROFILE: (id) => `${API_BASE_URL}/users/${id}`,
  },
  ATTEMPT: {
    START: `${API_BASE_URL}/attempt/start`,
    SUBMIT: (attemptId) => `${API_BASE_URL}/attempt/${attemptId}/end`,
    REVIEW: (attemptId) => `${API_BASE_URL}/attempt/${attemptId}/review`,
    EXAM_HISTORY: (fromDate, toDate) =>
      `${API_BASE_URL}/attempt/exam-history?fromDate=${fromDate}&toDate=${toDate}`,

     LIST: (questionBankId, examSetId, page = 1, size = 1000, status = "SUBMITTED") =>
  `${API_BASE_URL}/attempt?questionBankId=${questionBankId}&examSetId=${examSetId}&status=${status}&page=${page}&size=${size}`,
  },
};
