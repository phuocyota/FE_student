import axios from "axios";

import { apiRequest } from "./client";
const baseUrl = import.meta.env.VITE_API_BASE_URL;

// upload avatar
export const uploadAvatar = async (file) => {

  const token = localStorage.getItem("accessToken");

  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    `${baseUrl}/upload/single`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    }
  );

  return res.data;
};


// update avatar user
export const updateUserAvatar = async (userId, userData) => {

  const token = localStorage.getItem("accessToken");

  const res = await axios.put(
    `${baseUrl}/users/${userId}`,
    userData,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};

// update thông tin profile
export const updateStudentProfile = async (userId, data) => {

  const token = localStorage.getItem("accessToken");

  const res = await axios.put(
    `${baseUrl}/users/${userId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};

// lấy thông tin profile
export const getUserById = async (userId) => {
  const token = localStorage.getItem("accessToken");

  const res = await axios.get(`${baseUrl}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.data;
};