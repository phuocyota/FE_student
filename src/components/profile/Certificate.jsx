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
    name: { top: 347, left: 453, fontSize: 29, color: "#000", fontWeight: "600" },
    className: { top: 404, left: 369, fontSize: 27, color: "#000" },
    school: { top: 404, right: 520, fontSize: 27, color: "#000" },
    day: { top: 564, left: 653, fontSize: 21, color: "#777", fontStyle: "italic" },
    month: { top: 564, left: 743, fontSize: 21, color: "#777", fontStyle: "italic" },
    year: { top: 564, left: 827, fontSize: 21, color: "#777", fontStyle: "italic" },
    yearStart: { top: 520, left: 547, fontSize: 24, color: "#000", fontStyle: "italic" },
    yearEnd: { top: 520, left: 667, fontSize: 24, color: "#000", fontStyle: "italic" },
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
    const month = date.getMonth() + 1;

    return {
      day: String(date.getDate()).padStart(2, "0"),
      month: month <= 2 ? String(month).padStart(2, "0") : String(month),
      year: String(date.getFullYear()),
      yearStart: String(month >= 9 ? date.getFullYear() : date.getFullYear() - 1),
      yearEnd: String(month >= 9 ? date.getFullYear() + 1 : date.getFullYear()),
    };
  };

  const { day, month, year, yearStart, yearEnd } = getDateParts(data.date);

  const renderTextField = (fieldName, value) => {
    const position = fieldPositions[fieldName];

    if (!position) return null;

    return (
      <p style={{
        position: "absolute",
        top: `${position.top}px`,
        ...(position.left !== undefined
          ? { left: `${position.left}px` }
          : { right: `${position.right}px` }),
        fontSize: `${position.fontSize}px`,
        color: position.color,
        fontWeight: position.fontWeight,
        fontStyle: position.fontStyle,
        margin: 0
      }}>
        {value}
      </p>
    );
  };

  return (
    <div
      ref={ref}
      style={{
        width: "1123px",
        height: "794px",
        
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
        {renderTextField("name", data.name)}
        {renderTextField("className", data.className)}
        {renderTextField("school", data.school)}
        {renderTextField("yearStart", yearStart)}
        {renderTextField("yearEnd", yearEnd)}
        {renderTextField("day", day)}
        {renderTextField("month", month)}
        {renderTextField("year", year)}
      </div>
    </div>
  );
});

Certificate.displayName = "Certificate";

export default Certificate;
