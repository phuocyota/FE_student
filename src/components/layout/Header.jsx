import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../../assets/kido.jpg";
import menuBar from "../../assets/menu_bar.png";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  User,
  ChevronDown,
} from "lucide-react";

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

  const [pinned, setPinned] = useState(false);      // giữ mở khi click
  const [selectedGrade, setSelectedGrade] = useState("Lớp 1");
  /* ====== Helpers ====== */
  const generalData = examData["Giáo dục phổ thông"];
  const subjects = generalData?.[selectedGrade];
  const megaRef = useRef();
  const generalRef = useRef();
  const languageRef = useRef();


  //ngoại ngữ 
  const [showLanguageMega, setShowLanguageMega] = useState(false);
  const [pinnedLanguage, setPinnedLanguage] = useState(false);
  const languageData = examData["Ngoại ngữ"];
  const firstLanguage = Object.keys(languageData)[0];
  const certificates = languageData[firstLanguage];
  const [selectedEnglishGrade, setSelectedEnglishGrade] = useState("Tiếng Anh - Khối 1");

  const englishData = examData["Ngoại ngữ"]["Tiếng Anh"];
  const englishSubjects = englishData?.[selectedEnglishGrade];

  // đăng nhập 
  const [user, setUser] = useState(localStorage.getItem("user"));

  useEffect(() => {
    setUser(localStorage.getItem("user"));
  }, [location]);

  // popup menu bar
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef();
  const userId = localStorage.getItem("userId");



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
    const handleClickOutsideGeneral = (event) => {
      if (
        generalRef.current &&
        !generalRef.current.contains(event.target)
      ) {
        setPinned(false);
        setShowMega(false);
      }
    };

    // ⚠️ dùng click, không dùng mousedown
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

  return (
    <header className="bg-green-700 text-white relative">
      {/* {/* <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"> */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center ">

        {/* LOGO */}
        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden shrink-0">
          <Link to="/">
            <img
              src={logo}
              alt="logo"
              className="w-full h-full object-cover cursor-pointer"
            />
          </Link>
        </div>

        {/* MENU CENTER */}
        <nav className="flex-1 flex justify-center items-center gap-6 md:gap-8 pl-3">
          {/* THI */}
          {/* THI */}
          <div
            ref={generalRef}
            onClick={() => {
              setActiveMenu("exam");
              setShowExamMenu(!showExamMenu);
              navigate("/"); // thêm dòng này
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

          {/* CÁ NHÂN */}
          <NavLink
            to="/exam-dashboard"
            onClick={() => {
              setActiveMenu("profile");
              setShowExamMenu(false);
            }}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition whitespace-nowrap font-semibold
            ${activeMenu === "profile"
                ? "bg-white text-green-700"
                : "hover:bg-green-600"
              }`}
          >
            <User size={18} />
            <span className="whitespace-nowrap">Cá nhân</span>
          </NavLink>
        </nav>

        {/* LOGIN */}
        <div className="w-80 flex justify-end relative">
          {user ? (
            <div
              ref={userMenuRef}
              className="flex items-center gap-3 text-white font-semibold"
            >
              {/* Text chỉ hiện từ md trở lên */}
              <span className="hidden md:inline whitespace-nowrap">
                Xin chào! {user}
              </span>

              {/* Icon luôn hiển thị */}
              <img
                src={menuBar}
                alt="menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-7 h-7 cursor-pointer flex-shrink-0"
              />

              {/* ===== DROPDOWN ===== */}
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl p-4 z-50 text-gray-700">

                  {/* Tên + ID */}
                  <div className="mb-3">
                    <div className="font-semibold text-gray-800">{user}</div>
                    <div className="text-sm text-gray-500">
                      ID: {userId}
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <Link
                      to="/profile-user"
                      className="block cursor-pointer hover:text-green-600"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Thông tin cá nhân
                    </Link>

                    {/* Thông báo */}
                    <Link
                      to="/notifications"
                      className="block hover:text-green-600 transition"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Thông báo
                    </Link>

                    <div
                      onClick={() => {
                        localStorage.removeItem("user");
                        setShowUserMenu(false);
                        window.location.href = "/";
                      }}
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
              className="
bg-white text-green-700 
px-3 md:px-4 
py-1.5 md:py-2 
text-sm md:text-base 
rounded-lg 
font-medium 
whitespace-nowrap
"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {/* ================= SUB HEADER ================= */}
      {/* {showExamMenu && ( */}
      {showExamMenu && (
        <div className="w-full bg-gray-200 text-gray-700 shadow-sm relative">
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

                  setPinned((prev) => !prev);   // chuẩn React
                  setShowMega(true);

                  setPinnedLanguage(false);
                  setShowLanguageMega(false);

                  setSelectedGrade(null);
                }}
                className={`flex items-center gap-2 cursor-pointer transition
      ${showMega || pinned
                    ? "text-yellow-600"
                    : "hover:text-yellow-600"
                  }`}
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
        top-[120px] md:top-10
        left-1/2 -translate-x-1/2
        w-[95%] md:w-screen
        max-w-[1200px]
        bg-white rounded-2xl shadow-2xl
        p-4 md:p-8
        z-50
        transition-all duration-300
      "
                >

                  {/* DESKTOP */}
                  <div className="hidden md:flex">
                    <div className="md:w-80 border-r pr-8">
                      {Object.keys(generalData).map((grade) => (
                        <div
                          key={grade}
                          onClick={() => setSelectedGrade(grade)}
                          className={`px-4 py-2 rounded-lg cursor-pointer mb-1 transition
                ${selectedGrade === grade
                              ? "bg-yellow-500 text-white"
                              : "hover:bg-gray-100"
                            }`}
                        >
                          {grade}
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-8 pl-8 text-sm">
                      {Object.keys(
                        generalData[selectedGrade || Object.keys(generalData)[0]]
                      ).map((subject) => (
                        <div key={subject}>
                          <div className="bg-gray-100 px-4 py-2 rounded-lg font-semibold mb-4 border">
                            {subject}
                          </div>

                          <ul className="space-y-2 text-gray-600">
                            {generalData[
                              selectedGrade || Object.keys(generalData)[0]
                            ][subject].map((item, i) => (
                              <li
                                key={i}
                                className="hover:text-green-600 cursor-pointer"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MOBILE */}
                  <div className="md:hidden h-full max-h-[calc(100vh-120px)] overflow-y-auto pr-2">

                    {!selectedGrade && (
                      <div className="space-y-3 pb-10">
                        {Object.keys(generalData).map((grade) => (
                          <div
                            key={grade}
                            onClick={() => setSelectedGrade(grade)}
                            className="px-4 py-3 bg-gray-100 rounded-lg cursor-pointer 
                     hover:bg-yellow-500 hover:text-white transition"
                          >
                            {grade}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedGrade && subjects && (
                      <div className="pb-10">

                        <div
                          onClick={() => setSelectedGrade(null)}
                          className="mb-4 text-sm text-blue-500 cursor-pointer"
                        >
                          ← Quay lại
                        </div>

                        <div className="space-y-6 text-sm">
                          {Object.keys(subjects).map((subject) => (
                            <div key={subject}>
                              <div className="bg-gray-100 px-4 py-2 rounded-lg font-semibold mb-2 border">
                                {subject}
                              </div>

                              <ul className="space-y-2 text-gray-600">
                                {subjects[subject].map((item, i) => (
                                  <li
                                    key={i}
                                    className="hover:text-green-600 cursor-pointer"
                                  >
                                    {item}
                                  </li>
                                ))}
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
              top-[120px] md:top-10
              left-1/2 -translate-x-1/2
              w-[95%] md:w-screen
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
                          onClick={() => setSelectedEnglishGrade(grade)}
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