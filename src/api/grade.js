import { apiRequest } from "./client";


// lấy chi tiết môn học và bộ đề thi theo từng khối 
export const getGrades = () => {
  return apiRequest("/grade?isGetAllDetail=true", {
    method: "GET",
  });
};

// lấy số đề có trogn 1 bộ trang home 
export const getExamSetDetail = (id) => {
  return apiRequest(`/exam-set/${id}`, {
    method: "GET",
  });
};