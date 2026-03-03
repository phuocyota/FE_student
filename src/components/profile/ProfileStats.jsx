import React from "react";

const ProfileStats = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold mb-6 text-gray-700">
        Thành tích học tập
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        <StatBox title="Số đề đã làm" value="52" />
        <StatBox title="Điểm trung bình" value="8.5" />
        <StatBox title="Điểm cao nhất" value="10.0" />
        <StatBox title="Xếp hạng" value="Top 10%" />

      </div>
    </div>
  );
};

const StatBox = ({ title, value }) => (
  <div className="bg-gray-50 rounded-xl p-4 text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-xl font-bold text-green-600 mt-2">
      {value}
    </p>
  </div>
);

export default ProfileStats;