

import React, { useState, useEffect } from "react";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileInfo from "../components/profile/ProfileInfo";
import ProfileStats from "../components/profile/ProfileStats";
import { getCurrentUser } from "../api/student";
// import Certificate from "../components/profile/Certificate";
import { useRef } from "react";

import ProfileCertificate from "../components/profile/ProfileCertificate";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState(null); // 🔥 để null ban đầu

  const certRef = useRef();

  const certData = JSON.parse(localStorage.getItem("certificate"));

  const handleDownload = async () => {
    const canvas = await html2canvas(certRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("landscape", "px", [
      canvas.width,
      canvas.height
    ]);

    pdf.addImage(imgData, "PNG", 0, 0);
    pdf.save("certificate.pdf");
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentUser();
        const data = res.data;

        const mappedUser = {
          fullName: data.fullName,
          studentId: data.studentCode,
          className: data.className,
          school: data.schoolName,
          avatar: data.avatar,

          dob: data.birthday ? data.birthday.split("T")[0] : "",
          gender: data.gender,
          email: data.email,
          parentPhone: data.phoneNumber,
          goal: data.note,
        };

        setUser(mappedUser);

        // lưu userId cho update
        localStorage.setItem("userId", data.id);
        setUser(mappedUser);

        // 🔥 THÊM DÒNG NÀY
        localStorage.setItem("user", JSON.stringify(mappedUser));

      } catch (error) {
        console.error("Fetch user error:", error);
      }
    };

    fetchUser();
  }, []);


  if (!user) {
    return <div className="text-center mt-20">Loading...</div>;
  }

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


        <ProfileCertificate />

      </div>
    </div>
  );
};

export default Profile;