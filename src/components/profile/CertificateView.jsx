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

  

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-6">

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

      <div id="print-area">
  <Certificate data={cert} />
</div>
    </div>
  );
};

export default CertificateView;