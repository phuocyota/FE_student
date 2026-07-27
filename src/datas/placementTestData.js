export const placementQuestions = [
  {
    id: 1,
    category: "Toán tư duy",
    question: "Số nào còn thiếu trong dãy: 2, 4, 6, __, 10?",
    options: ["7", "8", "9", "12"],
    correctAnswer: 1,
  },
  {
    id: 2,
    category: "Toán tư duy",
    question: "Lan có 12 viên bi, cho bạn 5 viên. Lan còn lại bao nhiêu viên bi?",
    options: ["5 viên", "6 viên", "7 viên", "8 viên"],
    correctAnswer: 2,
  },
  {
    id: 3,
    category: "Toán tư duy",
    question: "Hình nào có 4 cạnh bằng nhau?",
    options: ["Hình tròn", "Hình tam giác", "Hình vuông", "Hình chữ nhật"],
    correctAnswer: 2,
  },
  {
    id: 4,
    category: "Toán tư duy",
    question: "Nếu hôm nay là thứ Hai thì 3 ngày nữa là thứ mấy?",
    options: ["Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu"],
    correctAnswer: 2,
  },
  {
    id: 5,
    category: "Tiếng Việt",
    question: "Từ nào dưới đây chỉ hoạt động?",
    options: ["Cây bút", "Chạy", "Màu xanh", "Học sinh"],
    correctAnswer: 1,
  },
  {
    id: 6,
    category: "Tiếng Việt",
    question: "Điền từ thích hợp: “Bầu trời hôm nay rất ___.”",
    options: ["trong xanh", "chạy", "quyển vở", "học bài"],
    correctAnswer: 0,
  },
  {
    id: 7,
    category: "Tiếng Việt",
    question: "Câu nào được viết đúng?",
    options: [
      "hôm nay em đi học.",
      "Hôm nay em đi học",
      "Hôm nay em đi học.",
      "Hôm nay Em đi học.",
    ],
    correctAnswer: 2,
  },
  {
    id: 8,
    category: "Tiếng Việt",
    question: "Từ nào có nghĩa trái ngược với “chăm chỉ”?",
    options: ["Siêng năng", "Nhanh nhẹn", "Lười biếng", "Ngoan ngoãn"],
    correctAnswer: 2,
  },
  {
    id: 9,
    category: "Tiếng Anh",
    question: "Choose the correct word: “This is ___ apple.”",
    options: ["a", "an", "the two", "some"],
    correctAnswer: 1,
  },
  {
    id: 10,
    category: "Tiếng Anh",
    question: "Which word means “con mèo”?",
    options: ["Dog", "Bird", "Fish", "Cat"],
    correctAnswer: 3,
  },
  {
    id: 11,
    category: "Tiếng Anh",
    question: "Choose the correct answer: “How are you?”",
    options: ["I'm fine, thank you.", "I'm nine years old.", "My name is Nam.", "Good night."],
    correctAnswer: 0,
  },
  {
    id: 12,
    category: "Tiếng Anh",
    question: "What color is the sun usually drawn?",
    options: ["Yellow", "Purple", "Black", "Pink"],
    correctAnswer: 0,
  },
];

export const placementCategories = [
  {
    name: "Cơ bản",
    description: "Số học, hình học và suy luận logic",
  },
  {
    name: "Tiểu học",
    description: "Từ vựng, chính tả và đọc hiểu",
  },
  {
    name: "Trung học cơ sở",
    description: "Từ vựng và mẫu câu cơ bản",
  },
    {
    name: "Trung học phổ thông",
    description: "Từ vựng và mẫu câu cơ bản",
  },
];

export const getPlacementLevel = (score) => {
  if (score >= 10) {
    return {
      name: "Nâng cao",
      description: "Con có nền tảng rất tốt và sẵn sàng với những bài học thử thách hơn.",
      color: "emerald",
    };
  }

  if (score >= 7) {
    return {
      name: "Khá",
      description: "Con đã nắm chắc kiến thức cơ bản và nên tiếp tục củng cố theo từng chủ đề.",
      color: "blue",
    };
  }

  if (score >= 4) {
    return {
      name: "Cơ bản",
      description: "Con đã có kiến thức nền và cần luyện tập thêm để tự tin hơn.",
      color: "amber",
    };
  }

  return {
    name: "Khởi đầu",
    description: "Con nên bắt đầu từ các bài học nền tảng với nhịp độ nhẹ nhàng.",
    color: "orange",
  };
};
