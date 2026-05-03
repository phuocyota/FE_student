import React, { useEffect, useState } from "react";
import { getGrades } from "../api/grade";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { buildAssetUrl } from "../api/client";

const SubjectImage = ({ image, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!image) {
    return (
      <div className="w-38 h-20 rounded-lg bg-gray-100" />
    );
  }

  return (
    <div className="relative w-38 h-20 rounded-lg overflow-hidden bg-gray-100">
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-100" />
      )}

      <img
        src={buildAssetUrl(image)}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
        className={`w-38 h-20 object-cover rounded-lg transition-opacity duration-200 ${isLoaded ? "opacity-100" : "opacity-0"
          }`}
      />
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await getGrades();

        // const list = res?.data?.data || [];
        const list = res?.data?.data || [];

       // console.log("Grades:", list);

        setGrades(list);

      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {grades.map((gradeItem) => (
          <div
            key={gradeItem.grade.id}
            className="bg-white rounded-xl p-6 shadow-sm mb-8"
          >

            {/* HEADER */}
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {gradeItem.grade.name}
              </h2>
              <div className="h-1 w-12 bg-gray-200 rounded-full"></div>
            </div>

            {/* SUBJECT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {gradeItem.subjects.map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => {
                    if (!subject.id) {
                      toast.error("Không tìm thấy môn học");
                      return;
                    }

                    navigate(`/exam-set-all/${subject.id}`, {
                      state: {
                        subject: subject,
                        grade: gradeItem.grade
                      }
                    });
                  }}
                  className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer bg-white"
                >

                  {/* IMAGE */}
                  {/* <SubjectImage
                    image={subject.examSets?.[0]?.image}
                    alt={subject.name}
                  /> */}
                  <SubjectImage
                    image={
                      subject.examSets?.[0]?.image || subject.image
                    }
                    alt={subject.name}
                  />

                  {/* CONTENT */}
                  <div className="flex flex-col justify-between flex-1">
                    <h3 className="text-sm font-medium text-gray-800">
                      {subject.name}
                    </h3>

                    <span className="text-xs bg-gray-200 px-3 py-1 rounded-full w-fit">
                      {subject.total} bộ đề
                    </span>
                  </div>

                </div>
              ))}

            </div>

          </div>
        ))}

      </div>
    </div>
  );
};

export default Home;
