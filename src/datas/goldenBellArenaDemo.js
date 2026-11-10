// Preview at /golden-bell-arena/DEMO?demo=1 without connecting to a live room.
const names = [
  "Nguyễn Lê Thùy Trang", "Nguyễn Phú Trọng", "Trần Minh Anh",
  "Lê Hoàng Nam", "Phạm Ngọc Hân", "Hoàng Đức Minh",
  "Vũ Khánh Linh", "Đặng Gia Bảo", "Bùi Phương Thảo",
  "Đỗ Tuấn Kiệt", "Hồ Bảo Ngọc", "Ngô Hải Đăng",
  "Dương Quỳnh Chi", "Lý Nhật Minh", "Mai Thanh Trúc",
  "Trương Anh Khoa", "Đinh Thảo Nguyên", "Võ Minh Quân",
  "Phan Hà My", "Cao Quốc Huy", "Nguyễn Hoàng Phúc",
  "Trần Ngọc Mai", "Lê Bảo An", "Phạm Thiên Ân",
  "Hoàng Minh Châu", "Vũ Thành Đạt", "Đặng Tú Anh",
  "Bùi Quang Vinh", "Đỗ Nguyễn Khánh Vy", "Nguyễn Trần Gia Hưng",
];

export const goldenBellArenaDemoRoom = {
  roomId: "DEMO",
  code: "DEMO · 30 thí sinh mẫu",
  status: "WAITING",
  currentQuestion: null,
  questionNo: 0,
  usedQuestionIds: [],
  students: names.map((name, index) => ({
    id: `demo-student-${index + 1}`,
    name,
    status: index % 5 === 4 ? "eliminated" : index % 3 === 0 ? "passed" : "active",
  })),
};
