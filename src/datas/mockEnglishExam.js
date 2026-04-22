const mockEnglishQuestions = [
  {
    id: 1,
    orderNo: 1,
    part: 1,
    chain: [{ id: 1, contentType: "TEXT", content: "I have a ___." }],
    answers: [
      { id: 11, content: "cat" },
      { id: 12, content: "pen" },
      { id: 13, content: "book" },
      { id: 14, content: "bag" }
    ],
    points: 1
  },
  {
    id: 2,
    orderNo: 2,
    part: 1,
    chain: [{ id: 2, contentType: "TEXT", content: "This is my ___." }],
    answers: [
      { id: 21, content: "teacher" },
      { id: 22, content: "mother" },
      { id: 23, content: "desk" },
      { id: 24, content: "ruler" }
    ],
    points: 1
  },

  {
    id: 6,
    orderNo: 6,
    part: 2,
    chain: [{ id: 6, contentType: "TEXT", content: "Hello! How are you?" }],
    answers: [
      { id: 61, content: "I have a pen." },
      { id: 62, content: "I’m a student." },
      { id: 63, content: "I’m fine, thank you." },
      { id: 64, content: "Goodbye." }
    ],
    points: 1
  },

  {
    id: 11,
    orderNo: 11,
    part: 3,
    chain: [{ id: 11, contentType: "TEXT", content: "This is a ___." }],
    answers: [
      { id: 111, content: "dog" },
      { id: 112, content: "cat" },
      { id: 113, content: "bird" },
      { id: 114, content: "fish" }
    ],
    points: 1
  },

  {
    id: 16,
    orderNo: 16,
    part: 4,
    chain: [{ id: 16, contentType: "TEXT", content: "Choose the correct sentence:" }],
    answers: [
      { id: 161, content: "This is a pen." },
      { id: 162, content: "This are a pen." },
      { id: 163, content: "This am a pen." },
      { id: 164, content: "This be a pen." }
    ],
    points: 1
  },

  {
    id: 21,
    orderNo: 21,
    part: 5,
    chain: [{ id: 21, contentType: "TEXT", content: "I like ___." }],
    answers: [
      { id: 211, content: "apples" },
      { id: 212, content: "chairs" },
      { id: 213, content: "doors" },
      { id: 214, content: "bags" }
    ],
    points: 1
  }
];

export default mockEnglishQuestions;