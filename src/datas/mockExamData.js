const mockExamData = {
  id: 1,
  title: "Đề kiểm tra 15 phút - Đề số 02",
  duration: 25, // phút
  questions: Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  type: "multiple-choice",
  instruction: "Choose the correct answer",
  questionText: `This is question ${i + 1}`,
  image: null,
  options: [
    { label: "A", text: "Option A" },
    { label: "B", text: "Option B" },
    { label: "C", text: "Option C" },
    { label: "D", text: "Option D" }
  ],
  correctAnswer: "A"
}))
};

export default mockExamData;