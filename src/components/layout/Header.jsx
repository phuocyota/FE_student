import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../../assets/kido.jpg";
import menuBar from "../../assets/menu_bar.png";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  User,
  ChevronDown,
} from "lucide-react";
import { getGrades } from "../../api/grade";
import { getUserById } from "../../api/student";
import { fetch, parseResponse } from "../../api/client";
import { API } from "../../api/endpoint";

/* ================== DATA ================== */
const defaultSubjects = {
  "Công dân số": [
    "Kiểm tra giữa kì 1",
    "Kiểm tra học kì 1",
    "Kiểm tra giữa kì 2",
    "Kiểm tra học kì 2",
    "Tất cả các đề",
  ],
  "Stem": [
    "Kiểm tra giữa kì 1",
    "Kiểm tra học kì 1",
    "Kiểm tra giữa kì 2",
    "Kiểm tra học kì 2",
    "Tất cả các đề",
  ],
  "Kỹ năng sống": [
    "Kiểm tra giữa kì 1",
    "Kiểm tra học kì 1",
    "Kiểm tra giữa kì 2",
    "Kiểm tra học kì 2",
    "Tất cả các đề",
  ],
  "ICDL": ["Ôn tập", "Thi thử"],
};

// ====== Tạo lớp 1 → 12 (Giáo dục phổ thông) ======
const grades = {};
for (let i = 1; i <= 12; i++) {
  grades[`Lớp ${i}`] = defaultSubjects;
}

// ====== Tạo Tiếng Anh - Khối 1 → 12 ======
const defaultEnglishExams = [
  "Kiểm tra giữa kì 1",
  "Kiểm tra học kì 1",
  "Kiểm tra giữa kì 2",
  "Kiểm tra học kì 2",
  "Tất cả các đề",
];

const englishGrades = {};
for (let i = 1; i <= 12; i++) {
  englishGrades[`Tiếng Anh - Khối ${i}`] = defaultEnglishExams;
}

const examData = {
  "Giáo dục phổ thông": grades,

  "Ngoại ngữ": {
    "Tiếng Anh": englishGrades,

    IELTS: ["Listening", "Reading", "Writing", "Speaking"],
    TOEIC: ["Part 1", "Part 2", "Part 3", "Part 4"],
  },
};
const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showExamMenu, setShowExamMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");
  const [showMega, setShowMega] = useState(false);
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [floatingPosition, setFloatingPosition] = useState(() => {
    try {
      const saved = localStorage.getItem("floating_header_position");
      return saved ? JSON.parse(saved) : { x: 16, y: 88 };
    } catch {
      return { x: 16, y: 88 };
    }
  });
  const floatingHeaderRef = useRef(null);
  const dragStateRef = useRef({
    dragging: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const [pinned, setPinned] = useState(false);      // giữ mở khi click
  const [selectedGrade, setSelectedGrade] = useState("Lớp 1");

  // api lấy dữ liệu lớp học
  const [grades, setGrades] = useState([]);
  const [subjectsData, setSubjectsData] = useState({});

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await getGrades();

        const data = res.data.data;

        // danh sách khối
        const gradeList = data.map((item) => item.grade);
        setGrades(gradeList);

        // subjects theo gradeId
        const subjectsObj = {};

        data.forEach((item) => {
          const gradeId = item.grade.id;

          subjectsObj[gradeId] = item.subjects;
        });

        setSubjectsData(subjectsObj);

      } catch (err) {
        console.error(err);
      }
    };

    fetchGrades();
  }, []);

  /* ====== Helpers ====== */
  const generalRef = useRef();
  const languageRef = useRef();


  //ngoại ngữ 
  const [showLanguageMega, setShowLanguageMega] = useState(false);
  const [pinnedLanguage, setPinnedLanguage] = useState(false);
  const [selectedEnglishGrade, setSelectedEnglishGrade] = useState("Tiếng Anh - Khối 1");

  const englishData = examData["Ngoại ngữ"]["Tiếng Anh"];
  const englishSubjects = englishData?.[selectedEnglishGrade];

  // đăng nhập 
  const [user, setUser] = useState(() => localStorage.getItem("user") || "");
  const [fullName, setFullName] = useState(
    () => localStorage.getItem("fullName") || ""
  );

  // popup menu bar
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef();
  const userId = localStorage.getItem("userId");
  const displayName =
    localStorage.getItem("fullName") || fullName || user;

  const clampFloatingPosition = (x, y) => {
    const buttonSize = 64;
    const padding = 12;
    const maxX =
      typeof window === "undefined"
        ? x
        : Math.max(padding, window.innerWidth - buttonSize - padding);
    const maxY =
      typeof window === "undefined"
        ? y
        : Math.max(padding, window.innerHeight - buttonSize - padding);

    return {
      x: Math.min(Math.max(padding, x), maxX),
      y: Math.min(Math.max(padding, y), maxY),
    };
  };

  const handleFloatingPointerDown = (event) => {
    event.preventDefault();

    dragStateRef.current = {
      dragging: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: floatingPosition.x,
      originY: floatingPosition.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleFloatingPointerMove = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState.dragging || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragState.moved = true;
    }

    setFloatingPosition(
      clampFloatingPosition(dragState.originX + deltaX, dragState.originY + deltaY)
    );
  };

  const handleFloatingPointerUp = (event) => {
    const dragState = dragStateRef.current;
    if (!dragState.dragging || dragState.pointerId !== event.pointerId) return;

    dragState.dragging = false;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }

    setFloatingPosition((currentPosition) => {
      const nextPosition = clampFloatingPosition(
        currentPosition.x,
        currentPosition.y
      );
      localStorage.setItem(
        "floating_header_position",
        JSON.stringify(nextPosition)
      );
      return nextPosition;
    });

    if (!dragState.moved) {
      setShowFloatingMenu((prev) => !prev);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userId");
    setShowUserMenu(false);

    window.location.href = "/login";
  };

  useEffect(() => {
    setUser(localStorage.getItem("user") || "");
    setFullName(localStorage.getItem("fullName") || "");
  }, [location.pathname]);

  useEffect(() => {
    if (fullName || !userId) return;

    let isMounted = true;

    const fetchFullName = async () => {
      try {
        const res = await getUserById(userId);
        const userData = res?.data || res;
        const name = userData?.fullName || userData?.userName || "";

        if (!name) return;

        localStorage.setItem("fullName", name);

        if (isMounted) {
          setFullName(name);
        }
      } catch (err) {
        console.error("Load fullName lá»—i:", err);
      }
    };

    fetchFullName();

    return () => {
      isMounted = false;
    };
  }, [fullName, userId]);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutsideFloatingMenu = (event) => {
      if (
        floatingHeaderRef.current &&
        !floatingHeaderRef.current.contains(event.target)
      ) {
        setShowFloatingMenu(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideFloatingMenu);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideFloatingMenu);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setFloatingPosition((currentPosition) =>
        clampFloatingPosition(currentPosition.x, currentPosition.y)
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutsideGeneral = (event) => {
      if (
        generalRef.current &&
        !generalRef.current.contains(event.target)
      ) {
        setPinned(false);
        setShowMega(false);
      }
    };

    // dùng click, không dùng mousedown
    document.addEventListener("click", handleClickOutsideGeneral);

    return () => {
      document.removeEventListener("click", handleClickOutsideGeneral);
    };
  }, []);

  useEffect(() => {
    const handleClickOutsideLanguage = (event) => {
      if (
        showLanguageMega &&                 // chỉ khi đang mở
        languageRef.current &&
        !languageRef.current.contains(event.target)
      ) {
        setPinnedLanguage(false);
        setShowLanguageMega(false);
      }
    };

    document.addEventListener("click", handleClickOutsideLanguage);

    return () => {
      document.removeEventListener("click", handleClickOutsideLanguage);
    };
  }, [showLanguageMega]);



  const floatingPanelLeft =
    typeof window === "undefined"
      ? floatingPosition.x
      : Math.min(floatingPosition.x, window.innerWidth - 292);
  const floatingPanelTop =
    typeof window === "undefined"
      ? floatingPosition.y + 76
      : Math.min(floatingPosition.y + 76, window.innerHeight - 340);

  return (
    <header ref={floatingHeaderRef} className="contents">
      <div className="hidden bg-green-700 text-white md:block md:relative md:pt-safe">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-full overflow-hidden shrink-0">
              <Link to="/">
                <img
                  src={logo}
                  alt="logo"
                  className="w-full h-full object-cover cursor-pointer"
                />
              </Link>
            </div>
          </div>

          <nav className="flex justify-center items-center gap-8">
            <div
              ref={generalRef}
              onClick={() => {
                setActiveMenu("exam");
                setShowExamMenu(!showExamMenu);
                navigate("/");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition font-semibold
                ${activeMenu === "exam"
                  ? "bg-white text-green-700"
                  : "hover:bg-green-600"
                }`}
            >
              <GraduationCap size={18} />
              Thi
            </div>

            <NavLink
              to="/exam-dashboard"
              onClick={() => {
                setActiveMenu("profile");
                setShowExamMenu(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap font-semibold
                ${activeMenu === "profile"
                  ? "bg-white text-green-700"
                  : "hover:bg-green-600"
                }`}
            >
              <User size={18} />
              <span className="whitespace-nowrap">Cá nhân</span>
            </NavLink>
          </nav>

          <div className="flex justify-end relative">
            {displayName ? (
              <div
                ref={userMenuRef}
                className="flex items-center gap-3 text-white font-semibold"
              >
                <span className="hidden md:inline whitespace-nowrap">
                  Xin chào! {displayName}
                </span>

                <img
                  src={menuBar}
                  alt="menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-7 h-7 cursor-pointer flex-shrink-0"
                />

                {showUserMenu && (
                  <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl p-4 z-50 text-gray-700">
                    <div className="mb-3">
                      <div className="font-semibold text-gray-800">{displayName}</div>
                      <div className="text-sm text-gray-500">ID: {userId}</div>
                    </div>

                    <div className="border-t pt-3 space-y-3">
                      <Link
                        to="/profile-user"
                        className="block cursor-pointer hover:text-green-600"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Thông tin cá nhân
                      </Link>

                      <Link
                        to="/notifications"
                        className="block hover:text-green-600 transition"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Thông báo
                      </Link>

                      <div
                        onClick={handleLogout}
                        className="cursor-pointer text-red-500 hover:text-red-600"
                      >
                        Đăng xuất
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white text-green-700 px-4 py-2 text-base rounded-lg font-medium whitespace-nowrap"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Mở menu"
        onPointerDown={handleFloatingPointerDown}
        onPointerMove={handleFloatingPointerMove}
        onPointerUp={handleFloatingPointerUp}
        onPointerCancel={handleFloatingPointerUp}
        className="fixed z-50 h-16 w-16 touch-none select-none overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl ring-1 ring-black/10 active:scale-95 md:hidden"
        style={{
          left: floatingPosition.x,
          top: floatingPosition.y,
        }}
      >
        <img
          src={logo}
          alt="KIDO"
          draggable="false"
          className="h-full w-full object-cover"
        />
      </button>

      {showFloatingMenu && (
        <div
          className="fixed z-50 w-72 rounded-2xl bg-white p-3 text-gray-800 shadow-2xl ring-1 ring-black/10 md:hidden"
          style={{
            left: floatingPanelLeft,
            top: Math.max(12, floatingPanelTop),
          }}
        >
          <div className="mb-3 flex items-center gap-3 border-b pb-3">
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <img src={logo} alt="KIDO" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">KIDOEDU</div>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setActiveMenu("exam");
                setShowExamMenu((prev) => !prev);
                setShowFloatingMenu(false);
                navigate("/");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold transition
                ${activeMenu === "exam"
                  ? "bg-green-700 text-white"
                  : "text-gray-800 hover:bg-green-50 hover:text-green-700"
                }`}
            >
              <GraduationCap size={20} />
              Thi
            </button>

            <NavLink
              to="/exam-dashboard"
              onClick={() => {
                setActiveMenu("profile");
                setShowExamMenu(false);
                setShowFloatingMenu(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 font-semibold transition
                ${activeMenu === "profile"
                  ? "bg-green-700 text-white"
                  : "text-gray-800 hover:bg-green-50 hover:text-green-700"
                }`}
            >
              <User size={20} />
              Cá nhân
            </NavLink>
          </nav>

          <div className="mt-3 border-t pt-3">
            {displayName ? (
              <div ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left font-semibold text-gray-800 hover:bg-gray-100"
                >
                  <span className="truncate">{displayName}</span>
                  <img src={menuBar} alt="menu" className="h-6 w-6 flex-shrink-0" />
                </button>

                {showUserMenu && (
                  <div className="mt-2 rounded-xl bg-gray-50 p-3 text-gray-700">
                    <div className="mb-3">
                      <div className="font-semibold text-gray-800">{displayName}</div>
                      <div className="text-sm text-gray-500">ID: {userId}</div>
                    </div>

                    <div className="border-t pt-3 space-y-3">
                      <Link
                        to="/profile-user"
                        className="block cursor-pointer hover:text-green-600"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowFloatingMenu(false);
                        }}
                      >
                        Thông tin cá nhân
                      </Link>

                      <Link
                        to="/notifications"
                        className="block hover:text-green-600 transition"
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowFloatingMenu(false);
                        }}
                      >
                        Thông báo
                      </Link>

                      <div
                        onClick={handleLogout}
                        className="cursor-pointer text-red-500 hover:text-red-600"
                      >
                        Đăng xuất
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setShowFloatingMenu(false)}
                className="block rounded-xl bg-green-700 px-4 py-3 text-center font-semibold text-white hover:bg-green-800"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB HEADER ================= */}
      {/* {showExamMenu && ( */}
      {showExamMenu && (
        <div className="fixed left-0 right-0 top-0 z-40 bg-gray-200 text-gray-700 shadow-sm md:relative md:z-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-center gap-8 md:gap-16 text-xs md:text-sm font-semibold whitespace-nowrap">

            {/* ================= GIÁO DỤC PHỔ THÔNG ================= */}
            <div
              className="relative"
              onMouseEnter={() => !pinned && setShowMega(true)}
              onMouseLeave={() => !pinned && setShowMega(false)}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();

                  setPinned((prev) => !prev);
                  setShowMega(true);

                  setPinnedLanguage(false);
                  setShowLanguageMega(false);

                  setSelectedGrade(null);
                }}
                className={`flex items-center gap-2 cursor-pointer transition
    ${showMega || pinned ? "text-yellow-600" : "hover:text-yellow-600"}
    `}
              >
                GIÁO DỤC PHỔ THÔNG
                <ChevronDown size={16} />
              </div>

              {(showMega || pinned) && (
                <div
                  ref={generalRef}
                  onClick={(e) => e.stopPropagation()}
                  className="
      fixed md:absolute
      top-16 md:top-10
      left-1/2 -translate-x-1/2
      w-[95%] md:w-[900px]
      max-w-[1200px]
      bg-white rounded-2xl shadow-2xl
      p-4 md:p-8
      z-50
      transition-all duration-300
      "
                >

                  {/* ================= DESKTOP ================= */}
                  <div className="hidden md:flex">

                    {/* LEFT - GRADES */}
                    <div className="md:w-80 border-r pr-8">
                      {grades.map((grade) => (
                        <div
                          key={grade.id}
                          onClick={() => setSelectedGrade(grade)}
                          className={`px-4 py-2 rounded-lg cursor-pointer mb-1 transition
              ${selectedGrade?.id === grade.id
                              ? "bg-yellow-500 text-white"
                              : "hover:bg-gray-100"
                            }
              `}
                        >
                          {grade.name}
                        </div>
                      ))}
                    </div>

                    {/* RIGHT - SUBJECTS */}
                    <div className="flex-1 grid grid-cols-2 gap-8 pl-8 text-sm">

                      {selectedGrade &&
                        subjectsData[selectedGrade.id]?.map((subject) => (
                          <div key={subject.id}>

                            {/* SUBJECT NAME */}
                            <div className="bg-gray-100 px-4 py-2 rounded-lg font-semibold mb-4 border">
                              {subject.name}
                            </div>

                            {/* EXAM SET LIST */}
                            <ul className="space-y-2 text-gray-600">

                              {subject.examSets?.length > 0 ? (
                                subject.examSets.map((exam) => (
                                  <li
                                    key={exam.id}
                                    // onClick={() => {
                                    //   setShowMega(false);
                                    //   setPinned(false);

                                    //   navigate(`/exam-set-all/${subject.id}`, {
                                    //     state: {
                                    //       subject: subject
                                    //     }
                                    //   });

                                    // }}
                                    onClick={async () => {
                                      try {
                                        setShowMega(false);
                                        setPinned(false);

                                        // 👉 gọi API lấy detail
                                        const res = await fetch(API.EXAM_SET.DETAIL(exam.id));
                                        const data = await parseResponse(res);

                                        const questionBanks = data?.data?.questionBanks || [];

                                        if (!questionBanks.length) {
                                          alert("Bộ đề chưa có câu hỏi");
                                          return;
                                        }

                                        const firstQuestionBank = questionBanks[0];

                                        // 👉 build exam giống ExamList
                                        const examItem = {
                                          id: firstQuestionBank.id,
                                          title: firstQuestionBank.title,
                                          time: firstQuestionBank.durationSeconds
                                            ? `${firstQuestionBank.durationSeconds / 60} phút`
                                            : "Không rõ",
                                          difficulty: firstQuestionBank.totalPoints || 0,
                                          type: data?.data?.name,
                                          examSetId: exam.id,
                                        };

                                        // 👉 lưu localStorage (giống flow bạn đang dùng)
                                        localStorage.setItem("current_exam", JSON.stringify(examItem));

                                        // 👉 navigate đúng route DETAIL
                                        navigate(`/exam/${exam.id}/${firstQuestionBank.id}`, {
                                          state: { exam: examItem },
                                        });

                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="hover:text-green-600 cursor-pointer"
                                  >
                                    {exam.title}
                                  </li>
                                ))
                              ) : (
                                <li className="text-gray-400 italic">
                                  Chưa có bộ đề
                                </li>
                              )}

                            </ul>

                          </div>
                        ))
                      }

                    </div>
                  </div>

                  {/* ================= MOBILE ================= */}
                  <div className="md:hidden h-full max-h-[calc(100vh-120px)] overflow-y-auto pr-2">

                    {/* DANH SÁCH KHỐI */}
                    {!selectedGrade && (
                      <div className="space-y-3 pb-10">
                        {grades.map((grade) => (
                          <div
                            key={grade.id}
                            onClick={() => setSelectedGrade(grade)}
                            className="px-4 py-3 bg-gray-100 rounded-lg cursor-pointer
                hover:bg-yellow-500 hover:text-white transition"
                          >
                            {grade.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* DANH SÁCH MÔN */}
                    {selectedGrade && (
                      <div className="pb-10">

                        <div
                          onClick={() => setSelectedGrade(null)}
                          className="mb-4 text-sm text-blue-500 cursor-pointer"
                        >
                          ← Quay lại
                        </div>

                        <div className="space-y-6 text-sm">

                          {subjectsData[selectedGrade.id]?.map((subject) => (
                            <div key={subject.id}>

                              <div className="bg-gray-100 px-4 py-2 rounded-lg font-semibold mb-2 border">
                                {subject.name}
                              </div>

                              <ul className="space-y-2 text-gray-600">

                                {subject.examSets?.length > 0 ? (
                                  subject.examSets.map((exam) => (
                                    <li
                                      key={exam.id}
                                      // onClick={() => navigate(`/exam-set/${examSet.id}`)}
                                      // onClick={() => {
                                      //   setShowMega(false);
                                      //   setPinned(false);

                                      //   // setShowLanguageMega(false);
                                      //   // setPinnedLanguage(false);

                                      //   navigate(`/exam-set/${exam.id}`);
                                      // }}
                                      onClick={async () => {
                                        try {
                                          setShowMega(false);
                                          setPinned(false);

                                          // 👉 gọi API lấy detail
                                          const res = await fetch(API.EXAM_SET.DETAIL(exam.id));
                                          const data = await parseResponse(res);

                                          const questionBanks = data?.data?.questionBanks || [];

                                          if (!questionBanks.length) {
                                            alert("Bộ đề chưa có câu hỏi");
                                            return;
                                          }

                                          const firstQuestionBank = questionBanks[0];

                                          // 👉 build exam giống ExamList
                                          const examItem = {
                                            id: firstQuestionBank.id,
                                            title: firstQuestionBank.title,
                                            time: firstQuestionBank.durationSeconds
                                              ? `${firstQuestionBank.durationSeconds / 60} phút`
                                              : "Không rõ",
                                            difficulty: firstQuestionBank.totalPoints || 0,
                                            type: data?.data?.name,
                                            examSetId: exam.id,
                                          };

                                          // 👉 lưu localStorage (giống flow bạn đang dùng)
                                          localStorage.setItem("current_exam", JSON.stringify(examItem));

                                          // 👉 navigate đúng route DETAIL
                                          navigate(`/exam/${exam.id}/${firstQuestionBank.id}`, {
                                            state: { exam: examItem },
                                          });

                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                      className="hover:text-green-600 cursor-pointer"
                                    >
                                      {exam.title}
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-gray-400 italic">
                                    Chưa có bộ đề
                                  </li>
                                )}

                              </ul>

                            </div>
                          ))}

                        </div>

                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>

            {/* ================= NGOẠI NGỮ ================= */}
            <div
              className="relative"
              onMouseEnter={() => !pinnedLanguage && setShowLanguageMega(true)}
              onMouseLeave={() => !pinnedLanguage && setShowLanguageMega(false)}
            >
              <div

                onClick={(e) => {
                  e.stopPropagation();

                  setPinnedLanguage((prev) => !prev);   // toggle chuẩn
                  setShowLanguageMega(true);

                  // đóng phổ thông
                  setPinned(false);
                  setShowMega(false);

                  setSelectedEnglishGrade(null);
                }}
                className={`flex items-center gap-2 cursor-pointer transition
            ${showLanguageMega || pinnedLanguage
                    ? "text-yellow-600"
                    : "hover:text-yellow-600"
                  }`}
              >
                NGOẠI NGỮ
                <ChevronDown size={16} />
              </div>

              {(showLanguageMega || pinnedLanguage) && (
                <div
                  ref={languageRef}
                  onClick={(e) => e.stopPropagation()}
                  className="
              fixed md:absolute
              top-16 md:top-10
              left-1/2 -translate-x-1/2
              w-[95%] md:w-[800px] 
              max-w-[1000px]
              bg-white rounded-2xl shadow-2xl
              p-4 md:p-8
              z-50
              transition-all duration-300
            "
                >

                  {/* DESKTOP */}
                  <div className="hidden md:flex">
                    <div className="md:w-80 border-r pr-8">
                      {Object.keys(englishData).map((grade) => (
                        <div
                          key={grade}
                          onClick={() =>
                            setSelectedEnglishGrade(grade)}
                          className={`px-4 py-2 rounded-lg cursor-pointer mb-1 transition
          ${selectedEnglishGrade === grade
                              ? "bg-yellow-500 text-white"
                              : "hover:bg-gray-100"
                            }`}
                        >
                          {grade}
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 pl-8 text-sm">
                      <ul className="grid grid-cols-2 gap-4 text-gray-600">
                        {(englishData[selectedEnglishGrade || Object.keys(englishData)[0]] || []).map((item, i) => (
                          <li key={i} className="hover:text-green-600 cursor-pointer">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* MOBILE */}
                  <div className="md:hidden">

                    {!selectedEnglishGrade && (
                      <div className="space-y-3">
                        {Object.keys(englishData).map((grade) => (
                          <div
                            key={grade}
                            onClick={() => setSelectedEnglishGrade(grade)}
                            className="px-4 py-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-yellow-500 hover:text-white transition"
                          >
                            {grade}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedEnglishGrade && (
                      <div>
                        <div
                          onClick={() => setSelectedEnglishGrade(null)}
                          className="mb-4 text-sm text-blue-500 cursor-pointer"
                        >
                          ← Quay lại
                        </div>

                        <ul className="space-y-3 text-sm text-gray-600">
                          {englishSubjects.map((item, i) => (
                            <li key={i} className="hover:text-green-600 cursor-pointer">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
