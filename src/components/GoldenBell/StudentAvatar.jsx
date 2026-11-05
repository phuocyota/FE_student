import React from "react";
import { buildAssetUrl } from "../../api/client";

export default function StudentAvatar({ student, className = "h-12 w-12" }) {
  const avatar = student?.avatar || student?.photo;
  const src = typeof avatar === "string" ? (avatar.startsWith("data:image/") ? avatar : buildAssetUrl(avatar)) : "";
  return src ? (
    <img src={src} alt={`Ảnh thí sinh ${student.name || student.fullName || ""}`} className={`${className} shrink-0 rounded-full object-cover ring-2 ring-green-100`} />
  ) : (
    <span aria-hidden="true" className={`${className} inline-flex shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-700`}>{(student?.name || student?.fullName || "HS").slice(0, 1).toUpperCase()}</span>
  );
}
