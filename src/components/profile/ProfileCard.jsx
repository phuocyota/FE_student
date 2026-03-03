import React, { useRef } from "react";
import defaultAvatar from "../../assets/avatar.png";

const ProfileCard = ({ user, setUser, isEditing, setIsEditing }) => {
  const fileInputRef = useRef();

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUser({
        ...user,
        avatar: imageUrl,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center gap-6">

      {/* AVATAR */}
      <div
        onClick={handleAvatarClick}
        className="relative cursor-pointer"
      >
        <img
          src={user.avatar || defaultAvatar}
          alt="avatar"
          className="w-32 h-32 rounded-full object-cover border-4 border-green-500"
        />

        {isEditing && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            Đổi ảnh
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* INFO */}
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-800">
          {user.fullName}
        </h2>

        <p className="text-gray-500 mt-1">
          Lớp {user.className} • {user.school}
        </p>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm"
        >
          {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa hồ sơ"}
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;