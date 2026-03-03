import React, { useState } from "react";

const ProfileInfo = ({ user, setUser, isEditing, setIsEditing }) => {

  const [tempData, setTempData] = useState(user);

  const handleChange = (e) => {
    setTempData({
      ...tempData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    setUser(tempData);
    setIsEditing(false);
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

        <InputField label="Mã học sinh" name="studentId" value={tempData.studentId} onChange={handleChange} isEditing={isEditing} />
        <InputField label="Ngày sinh" name="dob" value={tempData.dob} onChange={handleChange} isEditing={isEditing} type="date" />
        <InputField label="Giới tính" name="gender" value={tempData.gender} onChange={handleChange} isEditing={isEditing} />
        <InputField label="Email" name="email" value={tempData.email} onChange={handleChange} isEditing={isEditing} />
        <InputField label="SĐT phụ huynh" name="parentPhone" value={tempData.parentPhone} onChange={handleChange} isEditing={isEditing} />
        <InputField label="Mục tiêu học tập" name="goal" value={tempData.goal} onChange={handleChange} isEditing={isEditing} />

      </div>

      {isEditing && (
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleCancel}
            className="px-5 py-2 rounded-full border border-gray-300"
          >
            Hủy
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-full bg-green-600 text-white"
          >
            Lưu thay đổi
          </button>
        </div>
      )}
    </div>
  );
};

const InputField = ({ label, name, value, onChange, isEditing, type = "text" }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>

    {isEditing ? (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border-b focus:outline-none focus:border-green-500 pb-1"
      />
    ) : (
      <p className="font-medium text-gray-800 border-b pb-2">
        {value}
      </p>
    )}
  </div>
);

export default ProfileInfo;