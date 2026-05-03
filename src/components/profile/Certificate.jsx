import React, { forwardRef } from "react";
import certBlue from "../../assets/certificates/GCN-GD-CDS-01.png";
import certRed from "../../assets/certificates/GCN-GD-CDS-02.png";

const Certificate = forwardRef(({ data }, ref) => {
      if (!data) return null;

      const bg =
            data.level === "Xuất sắc"
                  ? certRed
                  : certBlue;



      const getDateParts = (dateStr) => {
            const date = new Date(dateStr);

            return {
                  day: String(date.getDate()).padStart(2, "0"),
                  month: String(date.getMonth() + 1).padStart(2, "0"),
                  year: date.getFullYear(),
            };
      };

      const { day, month, year } = getDateParts(data.date);



      return (
            <div
                  ref={ref}
                  style={{
                        width: "1000px",
                        height: "700px",
                        position: "relative",
                        fontFamily: "Times New Roman, serif",
                  }}
            >
                  {/* BG */}
                  <img
                        src={bg}
                        style={{
                              position: "absolute",
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                        }}
                  />

                  <div className="absolute inset-0 text-black">

                        {/* ================= NAME ================= */}
                        <p className="absolute top-[260px] left-[340px] text-[22px] font-semibold">
                              {data.name}
                        </p>

                        {/* ================= CLASS ================= */}
                        <p className="absolute top-[303px] left-[277px] text-[20px]">
                              {data.className}
                        </p>

                        {/* ================= SCHOOL ================= */}
                        <p className="absolute top-[303px] right-[390px] text-[20px]">
                              {data.school}
                        </p>

                        {/* ================= DATE ================= */}
                        {/* DAY */}
                        <p className="absolute top-[423px] left-[557px] text-[16px] italic text-gray-700">
                              {month}
                        </p>

                        {/* MONTH */}
                        <p className="absolute top-[423px] left-[490px] text-[16px] italic text-gray-700">
                              {day}
                        </p>





                  </div>
            </div>
      );
});

export default Certificate;