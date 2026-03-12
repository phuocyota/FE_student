 
import { apiRequest } from "./client";
import axios from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const startAttempt = async (data) => {

  const token = localStorage.getItem("accessToken");

//   console.log("DATA SEND TO API:", data);
//   console.log("TOKEN:", token);

  const res = await axios.post(
    `${baseUrl}/attempt/start`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};

// nộp bài
export const submitAttempt = async (attemptId, answers) => {

  const token = localStorage.getItem("accessToken");

  const res = await axios.post(
    `${baseUrl}/attempt/${attemptId}/end`,
    { answers },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};

//xem review bài làm
export const getAttemptReview = async (attemptId) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/attempt/${attemptId}/review`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
      }
    }
  );

  return res.json();
};

// lấy lịch sử thi
export const getExamHistory = async (fromDate, toDate) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/attempt/exam-history?fromDate=${fromDate}&toDate=${toDate}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    }
  );

  return res.json();
};