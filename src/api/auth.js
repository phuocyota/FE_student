import { apiRequest } from "./client";
import { API } from "./endpoint";
import { buildApiUrl, fetch, parseResponse } from "./client";

// Public registration API: multipart fields plus a JPEG file in `photo`.
export const registerStudent = async ({ photo, ...student }) => {
  const endpoint = import.meta.env.VITE_STUDENT_REGISTER_URL;
  if (!endpoint) {
    throw new Error("Chức năng đăng ký chưa được kết nối. Vui lòng liên hệ nhà trường để được hỗ trợ đăng ký.");
  }
  const formData = new FormData();
  Object.entries(student).forEach(([key, value]) => formData.append(key, value));
  formData.append("photo", photo);
  const url = /^https?:\/\//.test(endpoint) ? endpoint : buildApiUrl(endpoint);
  const response = await fetch(url, { method: "POST", body: formData }, null);
  return parseResponse(response);
};

export const loginStudent = ({ username, password, deviceId }) =>
  apiRequest(API.AUTH.LOGIN_STUDENT, {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      deviceId,
    }),
  });

export const loginTeacher = ({ username, password, deviceId }) =>
  apiRequest(API.AUTH.LOGIN_TEACHER, {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      deviceId,
    }),
  });
