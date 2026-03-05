import { apiRequest } from "./client";


// lấy chi tiết môn học và bộ đề thi theo từng khối 
export const getGrades = () => {
  return apiRequest("/grade?isGetAllDetail=true", {
    method: "GET",
  });
};