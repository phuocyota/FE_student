import React, { useEffect, useState } from "react";
import { getMyStatistics } from "../../api/attempt"; // chỉnh path cho đúng

const ProfileStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
const res = await getMyStatistics();
// console.log("🔥 API raw:", res);
setStats(res.data || res);
      } catch (err) {
        console.error("Fetch statistics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-gray-500">Đang tải thống kê...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold mb-6 text-gray-700">
        Thành tích học tập
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatBox
          title="Số đề đã làm"
          value={stats?.totalAttempts || 0}
        />

        <StatBox
          title="Điểm trung bình"
          value={stats?.averageScore?.toFixed(2) || 0}
        />

        <StatBox
          title="Điểm cao nhất"
          value={stats?.highestScore || 0}
        />

        <StatBox
          title="Xếp hạng"
          value={`Top ${stats?.percentileRank || 0}%`}
        />
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
