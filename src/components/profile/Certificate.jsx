import React, { forwardRef } from "react";
import CDS_BLUE from "../../assets/certificates/GCN-GD-CDS-01.png";
import CDS_RED from "../../assets/certificates/GCN-GD-CDS-02.png";

import KNS_BLUE from "../../assets/certificates/GCN-GD-KNS-01.png";
import KNS_RED from "../../assets/certificates/GCN-GD-KNS-02.png";

import STEM_BLUE from "../../assets/certificates/GCV-GD-STEM-01.png";
import STEM_RED from "../../assets/certificates/GCV-GD-STEM-02.png";

const Certificate = forwardRef(({ data }, ref) => {
      if (!data) return null;


      const CERT_MAP = {
            CDS: {
                  normal: CDS_BLUE,
                  excellent: CDS_RED,
            },
            KNS: {
                  normal: KNS_BLUE,
                  excellent: KNS_RED,
            },
            STEM: {
                  normal: STEM_BLUE,
                  excellent: STEM_RED,
            },
      };


      const SUBJECT_MAP = {
            "Công dân số": "CDS",
            "Kỹ năng sống": "KNS",
            "STEM": "STEM",
      };

      const subjectKey = SUBJECT_MAP[data.subject?.trim()];

      const isExcellent = data.level === "Xuất sắc";

      const bg =
            CERT_MAP[subjectKey]?.[isExcellent ? "excellent" : "normal"] ||
            CERT_MAP["CDS"].normal; // fallback





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
                        alt="certificate"
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