import React, { useRef, useState } from "react";
import Certificate from "./Certificate";
import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

const ProfileCertificate = () => {
  const certRef = useRef();

  const [selectedCert, setSelectedCert] = useState(null);

  const certList = JSON.parse(localStorage.getItem("certificates") || "[]");
  
const [downloadCert, setDownloadCert] = useState(null);

  // 🔥 group theo môn
  const grouped = certList.reduce((acc, cert) => {
    if (!acc[cert.subject]) acc[cert.subject] = [];
    acc[cert.subject].push(cert);
    return acc;
  }, {});

  
const handleDownload = async (cert) => {
  setDownloadCert(cert);

  setTimeout(async () => {
    if (!certRef.current) return;

    const canvas = await html2canvas(certRef.current, {
      scale: 5, // 🔥 tăng lên 5 cho siêu nét
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      letterRendering: true, // 🔥 fix mờ chữ
    });

    // 👉 convert ra ảnh chất lượng max
    const imgData = canvas.toDataURL("image/png", 1.0);

    // 👉 tạo link tải
    const link = document.createElement("a");
    link.href = imgData;
    link.download = `ChungChi_${cert.subject}_${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadCert(null);
  }, 150);
};

const handleOpenNewTab = (cert) => {
  localStorage.setItem("previewCert", JSON.stringify(cert)); // 🔥 set trước
  window.open("/certificate-view", "_blank"); // 🔥 mở sau
};

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">

      <h3 className="text-lg font-bold mb-6 text-gray-700">
        🎓 Chứng chỉ đã hoàn thành
      </h3>

      {certList.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          Bạn chưa có chứng chỉ nào
        </div>
      ) : (
        <div className="space-y-6">

          {/* 🔥 LOOP SUBJECT */}
          {Object.keys(grouped).map((subject) => (
            <div key={subject}>

              <h4 className="font-semibold text-blue-600 mb-3">
                📘 Môn: {subject}
              </h4>

              <div className="space-y-3">

                {grouped[subject].map((cert) => (
                  <div
                    key={cert.id}
                    className="flex justify-between items-center bg-gray-50 p-4 rounded-lg"
                  >

                    {/* INFO */}
                    <div>
                      <p className="font-semibold">
                        {cert.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {cert.className} - {cert.school}
                      </p>
                      <p className="text-sm">
                        {cert.level}
                      </p>
                    </div>

                    {/* BUTTON */}
                    <div className="flex gap-2">

                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="px-3 py-1 bg-blue-500 text-white rounded"
                      >
                        Xem
                      </button>

                      <button
  onClick={() => handleOpenNewTab(cert)}
  className="px-3 py-1 bg-green-600 text-white rounded"
>
  Tải chứng chỉ
</button>

                    </div>

                  </div>
                ))}

              </div>

            </div>
          ))}

        </div>
      )}

      {/* 🔥 MODAL XEM CERT */}
      {/* 🔥 MODAL XEM CERT */}
{selectedCert && (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto"
    onClick={() => setSelectedCert(null)} // click nền để đóng
  >
    {/* CARD */}
    <div
      className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[1100px]"
      onClick={(e) => e.stopPropagation()} // tránh đóng khi click vào trong
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h3 className="font-semibold text-gray-700">
          Xem chứng chỉ
        </h3>

        {/* NÚT ĐÓNG */}
        <button
          onClick={() => setSelectedCert(null)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
        >
          ✕
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-4 flex justify-center">
        {/* ❗ KHÔNG dùng scale nữa */}
        <div className="w-full max-w-[1000px]">
          <Certificate ref={certRef} data={selectedCert} />
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 px-5 py-3 border-t">
        <button
          onClick={() => setSelectedCert(null)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Đóng
        </button>

        <button
          onClick={() => handleOpenNewTab(selectedCert)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📄 Tải PDF
        </button>
      </div>
    </div>
  </div>
)}

 
{/* CERTIFICATE ẨN ĐỂ EXPORT */}
<div className="fixed left-[-9999px] top-0">
  {downloadCert && (
    <Certificate ref={certRef} data={downloadCert} />
  )}
</div>

    </div>
  );
};

export default ProfileCertificate;