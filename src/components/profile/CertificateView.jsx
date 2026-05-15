import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import Certificate from "./Certificate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CertificateView = () => {
  const pdfRef = useRef(null);
  const { state } = useLocation();
  const cert =
  state?.cert ||
  JSON.parse(localStorage.getItem("previewCert"));

  if (!cert) return <div>Không có dữ liệu</div>;

  const handlePrint = async () => {
    const certificateNode = pdfRef.current;

    if (!certificateNode) return;

    const canvas = await html2canvas(certificateNode, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF("landscape", "px", [1123, 794]);

    pdf.addImage(imgData, "PNG", 0, 0, 1123, 794);
    pdf.save(`ChungChi_${cert.subject}_${Date.now()}.pdf`);
  };

  

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

    {/* BUTTON */}
    <div className="mb-4 flex gap-3 print:hidden">
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        🖨️ Tải PDF
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
