 import React, { useState } from "react";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileInfo from "../components/profile/ProfileInfo";
import ProfileStats from "../components/profile/ProfileStats";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    fullName: "Lê Nguyễn",
    studentId: "111334475",
    className: "5A1",
    school: "Trường Tiểu học ABC",
    dob: "2015-09-12",
    gender: "Nam",
    email: "lenguyen@gmail.com",
    parentPhone: "0901234567",
    goal: "Đạt học sinh giỏi",
     avatar: null, 
  });

  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">

        <ProfileCard
          user={user}
          setUser={setUser} 
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />

        <ProfileInfo
          user={user}
          setUser={setUser}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />

        <ProfileStats />

      </div>
    </div>
  );
};

export default Profile;
