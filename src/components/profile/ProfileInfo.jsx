 

import React, { useState, useEffect } from "react";
import { updateStudentProfile, getCurrentUser } from "../../api/student";
import toast from "react-hot-toast";

const ProfileInfo = ({ user, setUser, isEditing, setIsEditing }) => {
  const [tempData, setTempData] = useState(user);
 

  // sync khi user thay đổi
  useEffect(() => {
    setTempData(user);
  }, [user]);

  const handleChange = (e) => {
    setTempData({
      ...tempData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      const userId = localStorage.getItem("userId");

      const dataUpdate = {
        email: tempData.email,
        phoneNumber: tempData.parentPhone,
        note: tempData.goal,
      };

      const res = await updateStudentProfile(userId, dataUpdate);

      const updated = res.data?.data || res.data || res;

      const mappedUser = {
        ...user,
        email: updated.email,
        parentPhone: updated.phoneNumber,
        goal: updated.note,
        avatar: updated.avatar,
      };

      setUser(mappedUser);
      setTempData(mappedUser);
      setIsEditing(false);

      toast.success("Cập nhật thông tin thành công!");

    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Cập nhật thông tin thất bại!");
    }
  };

  const handleCancel = () => {
    setTempData(user);
    setIsEditing(false);
  };

  return (
  <div className="bg-white rounded-2xl shadow-sm p-6">
    <h3 className="text-lg font-bold mb-6 text-gray-700">
      Thông tin cá nhân
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <InputField
        label="Mã học sinh"
        name="studentId"
        value={tempData?.studentId}
        isEditing={isEditing}
        disabledEdit
      />

      <InputField
        label="Ngày sinh"
        name="dob"
        value={tempData?.dob}
        isEditing={isEditing}
        type="date"
        disabledEdit
      />

      <InputField
        label="Giới tính"
        name="gender"
        value={tempData?.gender}
        isEditing={isEditing}
        disabledEdit
      />

      <InputField
        label="Email"
        name="email"
        value={tempData?.email}
        onChange={handleChange}
        isEditing={isEditing}
      />

      <InputField
        label="SĐT phụ huynh"
        name="parentPhone"
        value={tempData?.parentPhone}
        onChange={handleChange}
        isEditing={isEditing}
      />

      <InputField
        label="Mục tiêu học tập"
        name="goal"
        value={tempData?.goal}
        onChange={handleChange}
        isEditing={isEditing}
      />

    </div>

    {isEditing && (
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={handleCancel}
          className="px-5 py-2 rounded-full border border-gray-300 hover:bg-gray-100"
        >
          Hủy
        </button>

        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white"
        >
          Lưu thay đổi
        </button>
      </div>
    )}
  </div>
);
};



export default ProfileInfo;

const InputField = ({
  label,
  name,
  value,
  onChange,
  isEditing,
  type = "text",
  disabledEdit = false,
}) => (
  <div>
    <p className="text-sm text-gray-500 mb-1">{label}</p>

    {isEditing ? (
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabledEdit}
        className={`w-full border-b pb-1 focus:outline-none transition
        ${
          disabledEdit
            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-70"
            : "border-gray-300 focus:border-green-500"
        }`}
      />
    ) : (
      <p className="font-medium text-gray-800 border-b pb-2">
        {value || "-"}
      </p>
    )}
  </div>
);