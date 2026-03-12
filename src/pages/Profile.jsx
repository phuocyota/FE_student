import React, { useState, useEffect } from "react";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileInfo from "../components/profile/ProfileInfo";
import ProfileStats from "../components/profile/ProfileStats";
import { getUserById } from "../api/student";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    fullName: "",
    studentId: "",
    className: "",
    school: "",
    dob: "",
    gender: "",
    email: "",
    parentPhone: "",
    goal: "",
    avatar: null,
  });

  // load profile khi vào trang
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("userId");

        if (!userId) return;

        const res = await getUserById(userId);

        const data = res.data;

        const mappedUser = {
          fullName: data.fullName,
          email: data.email,
          parentPhone: data.phoneNumber,
          goal: data.note,
          avatar: data.avatar,
          dob: data.birthday,
          gender: data.gender,
        };

        setUser((prev) => ({
          ...prev,
          ...mappedUser
        }));

      } catch (error) {
        console.error("Fetch user error:", error);
      }
    };

    fetchUser();
  }, []);

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