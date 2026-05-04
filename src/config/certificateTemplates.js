// 🎓 Certificate Templates Configuration
// Định nghĩa tọa độ (positions) cho từng mẫu certificate

import { CertificateLevel, CertificateSubject } from "./constants";
import CDS_BLUE from "../assets/certificates/GCN-GD-CDS-01.png";
import CDS_RED from "../assets/certificates/GCN-GD-CDS-02.png";

import KNS_BLUE from "../assets/certificates/GCN-GD-KNS-01.png";
import KNS_RED from "../assets/certificates/GCN-GD-KNS-02.png";

import STEM_BLUE from "../assets/certificates/GCV-GD-STEM-01.png";
import STEM_RED from "../assets/certificates/GCV-GD-STEM-02.png";

import DIICHI_BLUE from "../assets/certificates/GCN-DIICHI-01.png";
import DIICHI_RED from "../assets/certificates/GCN-DIICHI-02.png";

const CDS_BLUE_POSITIONS = {
  name: { top: 284, left: 393, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 338, left: 331, fontSize: 20, color: "#000" },
  school: { top: 338, left: 562, fontSize: 20, color: "#000" },
  day: { top: 478, left: 544, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 478, left: 623, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 478, left: 715, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 435, left: 469, fontSize: 24, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 435, left: 598, fontSize: 24, color: "#000", fontStyle: "italic" }
};

const CDS_RED_POSITIONS = {
  name: { top: 292, left: 393, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 346, left: 331, fontSize: 20, color: "#000" },
  school: { top: 346, left: 533, fontSize: 20, color: "#000" },
  day: { top: 478, left: 551, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 478, left: 624, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 478, left: 715, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 443, left: 469, fontSize: 24, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 443, left: 598, fontSize: 24, color: "#000", fontStyle: "italic" }
};

const KNS_BLUE_POSITIONS = {
  name: { top: 330, left: 416, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 378, left: 353, fontSize: 24, color: "#000" },
  school: { top: 378, left: 614, fontSize: 24, color: "#000" },
  day: { top: 506, left: 702, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 506, left: 775, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 506, left: 871, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 472, left: 544, fontSize: 21, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 472, left: 654, fontSize: 21, color: "#000", fontStyle: "italic" }
};

const KNS_RED_POSITIONS = {
  name: { top: 330, left: 416, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 378, left: 353, fontSize: 24, color: "#000" },
  school: { top: 378, left: 614, fontSize: 24, color: "#000" },
  day: { top: 506, left: 702, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 506, left: 775, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 506, left: 871, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 472, left: 544, fontSize: 21, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 472, left: 654, fontSize: 21, color: "#000", fontStyle: "italic" }
};

const STEM_BLUE_POSITIONS = {
  name: { top: 313, left: 371, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 365, left: 295, fontSize: 20, color: "#000" },
  school: { top: 365, left: 543, fontSize: 20, color: "#000" },
  day: { top: 504, left: 508, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 504, left: 598, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 504, left: 672, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 454, left: 533, fontSize: 21, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 454, left: 607, fontSize: 21, color: "#000", fontStyle: "italic" }
};

const STEM_RED_POSITIONS = {
  name: { top: 313, left: 357, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 365, left: 281, fontSize: 20, color: "#000" },
  school: { top: 365, left: 503, fontSize: 20, color: "#000" },
  day: { top: 504, left: 528, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 504, left: 614, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 504, left: 694, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 454, left: 538, fontSize: 21, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 454, left: 612, fontSize: 21, color: "#000", fontStyle: "italic" }
};

const DIICHI_01_POSITIONS = {
  name: { top: 315, left: 353, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 468, left: 331, fontSize: 20, color: "#000" },
  school: { top: 468, left: 551, fontSize: 20, color: "#000" },
  day: { top: 550, left: 679, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 550, left: 750, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 550, left: 826, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 502, left: 553, fontSize: 23, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 502, left: 683, fontSize: 23, color: "#000", fontStyle: "italic" }
};

const DIICHI_02_POSITIONS = {
  name: { top: 314, left: 365, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 480, left: 331, fontSize: 20, color: "#000" },
  school: { top: 480, left: 536, fontSize: 20, color: "#000" },
  day: { top: 550, left: 699, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 550, left: 766, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 550, left: 840, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 502, left: 584, fontSize: 23, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 502, left: 712, fontSize: 23, color: "#000", fontStyle: "italic" }
};

const clonePositions = (positions) => Object.fromEntries(
  Object.entries(positions).map(([key, value]) => [key, { ...value }])
);

export const CERTIFICATE_TEMPLATES = {
  // ==================== CDS ====================
  CDS: {
    normal: CDS_BLUE,
    excellent: CDS_RED,
    positions: {
      normal: CDS_BLUE_POSITIONS,
      excellent: CDS_RED_POSITIONS
    }
  },

  // ==================== KNS ====================
  KNS: {
    normal: KNS_BLUE,
    excellent: KNS_RED,
    positions: {
      normal: KNS_BLUE_POSITIONS,
      excellent: KNS_RED_POSITIONS
    }
  },

  // ==================== STEM ====================
  STEM: {
    normal: STEM_BLUE,
    excellent: STEM_RED,
    positions: {
      normal: STEM_BLUE_POSITIONS,
      excellent: STEM_RED_POSITIONS
    }
  },

  // ==================== DI-ICHI ====================
  "DI-ICHI": {
    normal: DIICHI_BLUE,
    excellent: DIICHI_RED,
    positions: {
      normal: DIICHI_01_POSITIONS,
      excellent: DIICHI_02_POSITIONS
    }
  }
};

// 🔄 Map subject tên sang key template
export const SUBJECT_TO_TEMPLATE = {
  [CertificateSubject.CDS]: "CDS",
  [CertificateSubject.KNS]: "KNS",
  [CertificateSubject.STEM]: "STEM",
  [CertificateSubject.DIICHI]: "DI-ICHI",
};

// 🎯 Get template config by subject
export const getTemplateConfig = (subject, level) => {
  const templateKey = SUBJECT_TO_TEMPLATE[subject?.trim()] || CertificateSubject.CDS;
  const template = CERTIFICATE_TEMPLATES[templateKey];
  
  if (!template) return null;

  // 🔥 Check nếu level là "Hoàn thành tốt" hoặc "Xuất sắc" thì dùng red template
  const isExcellent = level === CertificateLevel.GOOD_COMPLETION || level === CertificateLevel.EXCELLENT;
  const variant = isExcellent ? "excellent" : "normal";
  const bgImage = template[variant];
  const fieldPositions = template.positions?.[variant] || template.positions;

  return {
    bgImage,
    fieldPositions: clonePositions(fieldPositions)
  };
};
