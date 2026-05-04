import React from "react";
import { useLocation } from "react-router-dom";
import Certificate from "./Certificate";

const CertificateView = () => {
  const { state } = useLocation();
  const cert =
  state?.cert ||
  JSON.parse(localStorage.getItem("previewCert"));

  if (!cert) return <div>Không có dữ liệu</div>;

  const handlePrint = () => {
    window.print();
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

  </div>
);
};

export default CertificateView;