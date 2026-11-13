import { apiRequest, buildApiUrl, fetch, parseResponse } from "./client";
import { API } from "./endpoint";

// Public registration API: multipart fields plus a JPEG file in `photo`.
export const registerStudent = async ({ photo, ...student }) => {
  const formData = new FormData();
  Object.entries(student).forEach(([key, value]) => formData.append(key, value));
  formData.append("photo", photo);
  const response = await fetch(buildApiUrl("/auth/register/student"), { method: "POST", body: formData }, null);
  return parseResponse(response);
};

export const getRegistrationSchools = () => apiRequest("/auth/register/student/schools", { skipAuth: true });
export const getHcmRegistrationSchools = () => apiRequest("/auth/register/student/zones/HCM/schools", { skipAuth: true });
export const getRegistrationZones = () => apiRequest("/auth/register/student/zones", { skipAuth: true });
export const getZoneRegistrationSchools = (zoneId) => apiRequest(`/auth/register/student/zones/${encodeURIComponent(zoneId)}/schools`, { skipAuth: true });
export const getRegistrationClasses = (schoolId) => apiRequest(`/auth/register/student/schools/${encodeURIComponent(schoolId)}/classes`, { skipAuth: true });

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
