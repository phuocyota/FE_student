import React, { forwardRef } from "react";
import { getTemplateConfig } from "../../config/certificateTemplates";

const Certificate = forwardRef(({ data }, ref) => {
  if (!data) {
    return <div className="text-center p-4">Không có dữ liệu chứng chỉ</div>;
  }

  // Lấy template config từ certificateTemplates.js
  const templateConfig = getTemplateConfig(data.subject, data.level);
  const bgImage = templateConfig?.bgImage;
  const fieldPositions = templateConfig?.fieldPositions || {
    name: { top: 260, left: 340, fontSize: 22, color: "#000", fontWeight: "600" },
    className: { top: 303, left: 277, fontSize: 20, color: "#000" },
    school: { top: 303, right: 390, fontSize: 20, color: "#000" },
    day: { top: 423, left: 490, fontSize: 16, color: "#777", fontStyle: "italic" },
    month: { top: 423, left: 557, fontSize: 16, color: "#777", fontStyle: "italic" },
  };

  // Nếu BE trả về fieldPositions, dùng đó thay thế
  if (data.fieldPositions) {
    Object.assign(fieldPositions, data.fieldPositions);
  }

  // Fallback nếu không có bgImage
  if (!bgImage) {
    return <div className="text-center p-4 text-red-600">Không tìm thấy mẫu chứng chỉ cho {data.subject}</div>;
  }

  const getDateParts = (dateStr) => {
    const date = new Date(dateStr);
    return {
      day: String(date.getDate()).padStart(2, "0"),
      month: String(date.getMonth() + 1).padStart(2, "0"),
    };
  };

  const { day, month } = getDateParts(data.date);

  return (
    <div
      ref={ref}
      style={{
        width: "842px",
        height: "595px",
        position: "relative",
        fontFamily: "Times New Roman, serif",
      }}
    >
      {/* Background */}
      <img
        src={bgImage}
        alt="certificate"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      <div className="absolute inset-0 text-black">
        {/* NAME */}
        <p style={{
          position: "absolute",
          top: `${fieldPositions.name.top}px`,
          left: `${fieldPositions.name.left}px`,
          fontSize: `${fieldPositions.name.fontSize}px`,
          color: fieldPositions.name.color,
          fontWeight: fieldPositions.name.fontWeight,
          margin: 0
        }}>
          {data.name}
        </p>

        {/* CLASS */}
        <p style={{
          position: "absolute",
          top: `${fieldPositions.className.top}px`,
          left: `${fieldPositions.className.left}px`,
          fontSize: `${fieldPositions.className.fontSize}px`,
          color: fieldPositions.className.color,
          margin: 0
        }}>
          {data.className}
        </p>

        {/* SCHOOL */}
        <p style={{
          position: "absolute",
          top: `${fieldPositions.school.top}px`,
          ...(fieldPositions.school.left !== undefined
            ? { left: `${fieldPositions.school.left}px` }
            : { right: `${fieldPositions.school.right}px` }),
          fontSize: `${fieldPositions.school.fontSize}px`,
          color: fieldPositions.school.color,
          margin: 0
        }}>
          {data.school}
        </p>

        {/* DATE - DAY */}
        <p style={{
          position: "absolute",
          top: `${fieldPositions.day.top}px`,
          left: `${fieldPositions.day.left}px`,
          fontSize: `${fieldPositions.day.fontSize}px`,
          color: fieldPositions.day.color,
          fontStyle: fieldPositions.day.fontStyle,
          margin: 0
        }}>
          {day}
        </p>

        {/* DATE - MONTH */}
        <p style={{
          position: "absolute",
          top: `${fieldPositions.month.top}px`,
          left: `${fieldPositions.month.left}px`,
          fontSize: `${fieldPositions.month.fontSize}px`,
          color: fieldPositions.month.color,
          fontStyle: fieldPositions.month.fontStyle,
          margin: 0
        }}>
          {month}
        </p>
      </div>
    </div>
  );
});

Certificate.displayName = "Certificate";

export default Certificate;
