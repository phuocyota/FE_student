import React, { useEffect, useState } from "react";
import { buildAssetUrl } from "../../api/client";
import { getUserById } from "../../api/student";

export default function StudentAvatar({ student, className = "h-12 w-12", token = localStorage.getItem("accessToken") }) {
  const [profile, setProfile] = useState(null);
  const [failedSrc, setFailedSrc] = useState("");
  const studentId = student?.id;
  const roomAvatar = student?.avatar || student?.photo || student?.image;
  const roomSrc = typeof roomAvatar === "string" ? (roomAvatar.startsWith("data:image/") ? roomAvatar : buildAssetUrl(roomAvatar)) : "";

  useEffect(() => {
    // Older room snapshots may omit the student's photo. Resolve it using the
    // viewer's authenticated session, including the separate teacher session.
    if (!studentId || !token || (roomSrc && failedSrc !== roomSrc)) return;
    let active = true;
    const controller = new AbortController();
    getUserById(studentId, { signal: controller.signal }, token)
      .then((response) => {
        const user = response?.data?.data ?? response?.data ?? response;
        if (active) setProfile({ id: studentId, token, avatar: user?.avatar || user?.photo || user?.image || "" });
      })
      .catch((error) => {
        if (active) console.error("Unable to load contestant photo:", error);
      });
    return () => { active = false; controller.abort(); };
  }, [studentId, token, roomSrc, failedSrc]);

  const fetchedAvatar = profile?.id === studentId && profile?.token === token ? profile.avatar : "";
  const avatar = roomSrc && roomSrc !== failedSrc ? roomAvatar : fetchedAvatar;
  const src = typeof avatar === "string" ? (avatar.startsWith("data:image/") ? avatar : buildAssetUrl(avatar)) : "";
  return src && src !== failedSrc ? (
    <img src={src} onError={() => setFailedSrc(src)} alt={`Ảnh thí sinh ${student.name || student.fullName || ""}`} className={`${className} shrink-0 rounded-full object-cover ring-2 ring-green-100`} />
  ) : (
    <span aria-hidden="true" className={`${className} inline-flex shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-700`}>{(student?.name || student?.fullName || "HS").slice(0, 1).toUpperCase()}</span>
  );
}
