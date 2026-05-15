// Certificate print positions
// Chinh toa do trong file nay khi can canh rieng cho ban in.

const CDS_BLUE_PRINT_POSITIONS = {
  name: { top: 273, left: 393, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 326, left: 331, fontSize: 20, color: "#000" },
  school: { top: 326, left: 562, fontSize: 20, color: "#000" },
  day: { top: 465, left: 554, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 465, left: 643, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 465, left: 715, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 410, left: 579, fontSize: 24, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 410, left: 648, fontSize: 24, color: "#000", fontStyle: "italic" }
};

const CDS_RED_PRINT_POSITIONS = {
  name: { top: 282, left: 393, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 336, left: 331, fontSize: 20, color: "#000" },
  school: { top: 336, left: 533, fontSize: 20, color: "#000" },
  day: { top: 465, left: 558, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 465, left: 645, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 465, left: 725, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 420, left: 565, fontSize: 24, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 420, left: 648, fontSize: 24, color: "#000", fontStyle: "italic" }
};

const KNS_DEFAULT_PRINT_POSITIONS = {
  name: { top: 318, left: 416, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 368, left: 353, fontSize: 24, color: "#000" },
  school: { top: 368, left: 584, fontSize: 24, color: "#000" },
  day: { top: 494, left: 707, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 494, left: 792, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 494, left: 871, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 462, left: 604, fontSize: 21, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 462, left: 684, fontSize: 21, color: "#000", fontStyle: "italic" }
}

const KNS_BLUE_PRINT_POSITIONS = KNS_DEFAULT_PRINT_POSITIONS;

const KNS_RED_PRINT_POSITIONS = {
  ...KNS_DEFAULT_PRINT_POSITIONS,
  school: {...KNS_DEFAULT_PRINT_POSITIONS.school, left: 603, top: 367},
  yearStart: { top: 452, left: 604, fontSize: 21, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 452, left: 684, fontSize: 21, color: "#000", fontStyle: "italic" }
};

const STEM_BLUE_PRINT_POSITIONS = {
  name: { top: 293, left: 371, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 355, left: 295, fontSize: 20, color: "#000" },
  school: { top: 355, left: 543, fontSize: 20, color: "#000" },
  day: { top: 494, left: 508, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 494, left: 598, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 494, left: 672, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 444, left: 533, fontSize: 21, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 444, left: 607, fontSize: 21, color: "#000", fontStyle: "italic" }
};

const STEM_RED_PRINT_POSITIONS = {
  name: { top: 293, left: 357, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 355, left: 281, fontSize: 20, color: "#000" },
  school: { top: 355, left: 503, fontSize: 20, color: "#000" },
  day: { top: 494, left: 528, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 494, left: 614, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 494, left: 694, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 444, left: 538, fontSize: 21, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 444, left: 612, fontSize: 21, color: "#000", fontStyle: "italic" }
};

const DIICHI_01_PRINT_POSITIONS = {
  name: { top: 315, left: 353, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 468, left: 331, fontSize: 20, color: "#000" },
  school: { top: 468, left: 551, fontSize: 20, color: "#000" },
  day: { top: 550, left: 679, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 550, left: 750, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 550, left: 826, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 502, left: 553, fontSize: 23, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 502, left: 683, fontSize: 23, color: "#000", fontStyle: "italic" }
};

const DIICHI_02_PRINT_POSITIONS = {
  name: { top: 314, left: 365, fontSize: 27, color: "#000", fontWeight: "600" },
  className: { top: 480, left: 331, fontSize: 20, color: "#000" },
  school: { top: 480, left: 536, fontSize: 20, color: "#000" },
  day: { top: 550, left: 699, fontSize: 19, color: "#000", fontStyle: "italic" },
  month: { top: 550, left: 766, fontSize: 19, color: "#000", fontStyle: "italic" },
  year: { top: 550, left: 840, fontSize: 19, color: "#000", fontStyle: "italic" },
  yearStart: { top: 502, left: 584, fontSize: 23, color: "#000", fontStyle: "italic" },
  yearEnd: { top: 502, left: 712, fontSize: 23, color: "#000", fontStyle: "italic" }
};

export const PRINT_CERTIFICATE_POSITIONS = {
  CDS: {
    normal: CDS_BLUE_PRINT_POSITIONS,
    excellent: CDS_RED_PRINT_POSITIONS
  },
  KNS: {
    normal: KNS_BLUE_PRINT_POSITIONS,
    excellent: KNS_RED_PRINT_POSITIONS
  },
  STEM: {
    normal: STEM_BLUE_PRINT_POSITIONS,
    excellent: STEM_RED_PRINT_POSITIONS
  },
  "DI-ICHI": {
    normal: DIICHI_01_PRINT_POSITIONS,
    excellent: DIICHI_02_PRINT_POSITIONS
  }
};

const clonePositions = (positions) => Object.fromEntries(
  Object.entries(positions).map(([key, value]) => [key, { ...value }])
);

export const getPrintPositions = (templateKey, variant) => {
  const positions = PRINT_CERTIFICATE_POSITIONS[templateKey]?.[variant];
  return positions ? clonePositions(positions) : null;
};
