import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Certificate from "./Certificate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const decodeCertificate = (value) => {
  if (!value) return null;

  try {
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(value)))));
  } catch (error) {
    console.error("Decode certificate error:", error);
    return null;
  }
};

const CertificateView = () => {
  const pdfRef = useRef(null);
  const hasAutoDownloadedRef = useRef(false);
  const { state } = useLocation();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const cert =
    state?.cert ||
    decodeCertificate(params.get("cert")) ||
    JSON.parse(localStorage.getItem("previewCert"));
  const [isExporting, setIsExporting] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const userAgent = navigator.userAgent || "";
  const isWebKitDownloadRisk =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    /FBAN|FBAV|Instagram|Line|Zalo|WebView|wv/i.test(userAgent);

  const createCanvas = async () => {
    const certificateNode = pdfRef.current;

    if (!certificateNode) return null;

    return html2canvas(certificateNode, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  };

  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      const canvas = await createCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/png", 1.0);

      if (isWebKitDownloadRisk) {
        setPreviewImage(imgData);
        return;
      }

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `ChungChi_${cert.subject}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsExporting(true);
    try {
      const canvas = await createCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/png", 1.0);

      if (isWebKitDownloadRisk) {
        setPreviewImage(imgData);
        return;
      }

      const pdf = new jsPDF("landscape", "px", [1123, 794]);

      pdf.addImage(imgData, "PNG", 0, 0, 1123, 794);
      pdf.save(`ChungChi_${cert.subject}_${Date.now()}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!cert || !mode || hasAutoDownloadedRef.current) return;

    hasAutoDownloadedRef.current = true;
    const timer = window.setTimeout(() => {
      if (mode === "png") {
        handleDownloadPng();
      } else if (mode === "pdf") {
        handlePrint();
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [mode]);

  if (!cert) return <div>Không có dữ liệu</div>;

  

//   return (

//     <div className="bg-white min-h-screen flex flex-col items-center justify-center p-6">

//       <div className="mb-4 flex gap-3 print:hidden">
//         <button
//           onClick={handlePrint}
//           className="px-4 py-2 bg-blue-600 text-white rounded"
//         >
//           🖨️ Tải PDF
//         </button>

//         <button
//           onClick={() => window.close()}
//           className="px-4 py-2 bg-gray-300 rounded"
//         >
//           Đóng
//         </button>
//       </div>

//       <div id="print-area">
//   <Certificate data={cert} />
// </div>
//     </div>
//   );

return (
  <div className="bg-white min-h-screen overflow-auto flex flex-col items-center p-4">
    {previewImage && (
      <div className="fixed inset-0 z-50 overflow-auto bg-white p-4">
        <div className="mx-auto mb-3 flex max-w-4xl items-center justify-between gap-3 print:hidden">
          <div className="text-sm text-gray-600">
            Nếu đang ở WebView, hãy mở bằng Safari/Chrome rồi lưu ảnh.
          </div>
          <button
            onClick={() => setPreviewImage("")}
            className="rounded bg-gray-200 px-4 py-2"
          >
            Đóng
          </button>
        </div>

        <img
          src={previewImage}
          alt="Chứng chỉ"
          className="mx-auto h-auto w-full max-w-4xl"
        />
      </div>
    )}

    {/* BUTTON */}
    <div className="mb-4 flex gap-3 print:hidden">
      <button
        onClick={handlePrint}
        disabled={isExporting}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isExporting ? "Đang xử lý..." : "🖨️ Tải PDF"}
      </button>

      <button
        onClick={handleDownloadPng}
        disabled={isExporting}
        className="px-4 py-2 bg-purple-600 text-white rounded"
      >
        Tải PNG
      </button>

      <button
        onClick={() => window.close()}
        className="px-4 py-2 bg-gray-300 rounded"
      >
        Đóng
      </button>
    </div>

    {/* WRAPPER QUAN TRỌNG */}
    <div className="w-full flex justify-center">
      
      {/* KHUNG GIỚI HẠN WIDTH */}
      <div className="w-full max-w-[900px]">
        
        {/* SCALE MOBILE */}
        <div
          id="print-area"
          className="
            origin-top
            scale-100
            max-sm:scale-[1]
            max-[400px]:scale-[0.5]
          "
        >
          <Certificate data={cert} />
        </div>

      </div>
    </div>

    <div className="fixed left-[-9999px] top-0">
      <Certificate ref={pdfRef} data={cert} positionMode="print" />
    </div>

  </div>
);
};

export default CertificateView;
