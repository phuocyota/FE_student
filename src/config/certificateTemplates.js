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

const CDS_01_POSITIONS = {
  name: { top: 213, left: 295, fontSize: 20, color: "#000", fontWeight: "600" },
  className: { top: 253, left: 248, fontSize: 15, color: "#000" },
  school: { top: 253, left: 421, fontSize: 15, color: "#000" },
  day: { top: 358, left: 408, fontSize: 14, color: "#000", fontStyle: "italic" },
  month: { top: 358, left: 467, fontSize: 14, color: "#000", fontStyle: "italic" }
};

const CDS_02_POSITIONS = {
  name: { top: 219, left: 295, fontSize: 20, color: "#000", fontWeight: "600" },
  className: { top: 259, left: 248, fontSize: 15, color: "#000" },
  school: { top: 259, left: 400, fontSize: 15, color: "#000" },
  day: { top: 358, left: 413, fontSize: 14, color: "#000", fontStyle: "italic" },
  month: { top: 358, left: 468, fontSize: 14, color: "#000", fontStyle: "italic" }
};

const KNS_01_POSITIONS = {
  name: { top: 247, left: 312, fontSize: 20, color: "#000", fontWeight: "600" },
  className: { top: 283, left: 265, fontSize: 18, color: "#000" },
  school: { top: 283, left: 460, fontSize: 18, color: "#000" },
  day: { top: 379, left: 526, fontSize: 14, color: "#000", fontStyle: "italic" },
  month: { top: 379, left: 581, fontSize: 14, color: "#000", fontStyle: "italic" }
};

const KNS_02_POSITIONS = {
  name: { top: 247, left: 312, fontSize: 20, color: "#000", fontWeight: "600" },
  className: { top: 283, left: 265, fontSize: 18, color: "#000" },
  school: { top: 283, left: 460, fontSize: 18, color: "#000" },
  day: { top: 379, left: 526, fontSize: 14, color: "#000", fontStyle: "italic" },
  month: { top: 379, left: 581, fontSize: 14, color: "#000", fontStyle: "italic" }
};

const STEM_01_POSITIONS = {
  name: { top: 241, left: 278, fontSize: 20, color: "#000", fontWeight: "600" },
  className: { top: 278, left: 227, fontSize: 15, color: "#000" },
  school: { top: 278, left: 394, fontSize: 15, color: "#000" },
  day: { top: 383, left: 381, fontSize: 14, color: "#000", fontStyle: "italic" },
  month: { top: 383, left: 438, fontSize: 14, color: "#000", fontStyle: "italic" }
};

const STEM_02_POSITIONS = {
  name: { top: 240, left: 268, fontSize: 20, color: "#000", fontWeight: "600" },
  className: { top: 277, left: 211, fontSize: 15, color: "#000" },
  school: { top: 277, left: 377, fontSize: 15, color: "#000" },
  day: { top: 383, left: 366, fontSize: 14, color: "#000", fontStyle: "italic" },
  month: { top: 383, left: 424, fontSize: 14, color: "#000", fontStyle: "italic" }
};

const DIICHI_01_POSITIONS = {
  name: { top: 236, left: 265, fontSize: 20, color: "#000", fontWeight: "600" },
  className: { top: 351, left: 248, fontSize: 15, color: "#000" },
  school: { top: 351, left: 413, fontSize: 15, color: "#000" },
  day: { top: 412, left: 509, fontSize: 14, color: "#000", fontStyle: "italic" },
  month: { top: 412, left: 562, fontSize: 14, color: "#000", fontStyle: "italic" }
};

const DIICHI_02_POSITIONS = {
  name: { top: 235, left: 274, fontSize: 20, color: "#000", fontWeight: "600" },
  className: { top: 360, left: 248, fontSize: 15, color: "#000" },
  school: { top: 360, left: 402, fontSize: 15, color: "#000" },
  day: { top: 412, left: 524, fontSize: 14, color: "#000", fontStyle: "italic" },
  month: { top: 412, left: 574, fontSize: 14, color: "#000", fontStyle: "italic" }
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
      normal: CDS_01_POSITIONS,
      excellent: CDS_02_POSITIONS
    }
  },

  // ==================== KNS ====================
  KNS: {
    normal: KNS_BLUE,
    excellent: KNS_RED,
    positions: {
      normal: KNS_01_POSITIONS,
      excellent: KNS_02_POSITIONS
    }
  },

  // ==================== STEM ====================
  STEM: {
    normal: STEM_BLUE,
    excellent: STEM_RED,
    positions: {
      normal: STEM_01_POSITIONS,
      excellent: STEM_02_POSITIONS
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
