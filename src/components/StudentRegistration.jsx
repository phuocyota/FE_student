import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { registerStudent } from "../api/auth";
import { saveDemoStudent } from "../utils/demoRegistration";

const fields = [
  { name: "fullName", label: "Họ và tên", placeholder: "Nhập họ và tên học sinh", autoComplete: "name", maxLength: 150 },
  { name: "schoolName", label: "Trường", placeholder: "Nhập tên trường", autoComplete: "organization", maxLength: 200 },
  { name: "className", label: "Lớp", placeholder: "Ví dụ: 5A", autoComplete: "off", maxLength: 50 },
  { name: "phoneNumber", label: "Số điện thoại liên hệ", placeholder: "Nhập số điện thoại phụ huynh", autoComplete: "tel", maxLength: 20, type: "tel" },
];

const isDemo = !import.meta.env.VITE_STUDENT_REGISTER_URL;

const cameraErrorMessage = (error) => {
  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Chưa được cấp quyền camera. Hãy cho phép sử dụng camera trong trình duyệt rồi thử lại.";
  }
  if (error.name === "NotFoundError") return "Không tìm thấy camera trên thiết bị này.";
  if (error.name === "NotReadableError") return "Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.";
  return "Không thể mở camera. Hãy kiểm tra thiết bị và thử lại.";
};

export default function StudentRegistration({ onBack }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", schoolName: "", className: "", phoneNumber: "" });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [cameraState, setCameraState] = useState("off");
  const [cameraError, setCameraError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraRequestRef = useRef(0);

  useEffect(() => () => {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const stopCamera = () => {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState("off");
  };

  const openCamera = async () => {
    stopCamera();
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera chưa khả dụng. Hãy mở trang bằng HTTPS hoặc localhost trên trình duyệt hỗ trợ camera.");
      return;
    }
    const requestId = ++cameraRequestRef.current;
    setCameraState("opening");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } }, audio: false });
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      if (requestId === cameraRequestRef.current) setCameraState("ready");
    } catch (cameraFailure) {
      if (requestId !== cameraRequestRef.current) return;
      stopCamera();
      setCameraError(cameraErrorMessage(cameraFailure));
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      setCameraError("Camera chưa sẵn sàng. Vui lòng thử chụp lại.");
      return;
    }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Trình duyệt không hỗ trợ chụp ảnh. Hãy thử trình duyệt khác.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const requestId = cameraRequestRef.current;
    canvas.toBlob((blob) => {
      if (requestId !== cameraRequestRef.current) return;
      if (!blob) {
        setCameraError("Không thể chụp ảnh. Vui lòng thử lại.");
        return;
      }
      setPhoto(new File([blob], "student-photo.jpg", { type: "image/jpeg" }));
      setCameraError("");
      setError("");
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    const values = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    if ([values.fullName, values.schoolName, values.className].some((value) => !value)) {
      setError("Vui lòng điền đầy đủ thông tin đăng ký.");
      return;
    }
    const phoneNumber = values.phoneNumber.replace(/[\s().-]/g, "");
    if (values.phoneNumber && !/^(?:0|\+84|84)[35789]\d{8}$/.test(phoneNumber)) {
      setError("Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0912345678 hoặc +84912345678).");
      return;
    }
    if (!photo) {
      setError("Vui lòng mở camera và chụp ảnh học sinh trước khi đăng ký.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (!isDemo) await registerStudent({ ...values, phoneNumber, photo });
      if (isDemo) await saveDemoStudent({ ...values, phoneNumber, photo });
      stopCamera();
      navigate("/golden-bell", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Không thể gửi đăng ký. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h2 className="mb-2 text-center text-2xl font-bold text-green-700">Đăng ký học sinh</h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chụp ảnh và điền các thông tin có dấu * bên dưới.</p>
      {isDemo && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Chế độ demo: thông tin và ảnh được lưu trên trình duyệt này. Đăng ký xong bạn sẽ được chuyển đến trang nhập mã Rung chuông vàng.</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
          <legend className="sr-only">Thông tin đăng ký học sinh</legend>
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
            <p className="mb-3 text-sm font-medium">Ảnh học sinh <span className="text-red-500">*</span></p>
            <div className="relative mx-auto flex aspect-square w-40 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-green-100">
              <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full -scale-x-100 object-cover ${cameraState === "off" ? "hidden" : ""}`} aria-label="Xem trước camera" />
              {cameraState === "off" && (preview ? <img src={preview} alt="Ảnh học sinh vừa chụp" className="h-full w-full object-cover" /> : <Camera className="h-12 w-12 text-green-300" aria-hidden="true" />)}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {cameraState === "off" ? (
                <button type="button" onClick={openCamera} className="inline-flex items-center gap-2 rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100">
                  {photo ? <RefreshCw size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}{photo ? "Chụp lại" : "Mở camera"}
                </button>
              ) : <>
                <button type="button" onClick={capturePhoto} disabled={cameraState !== "ready"} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{cameraState === "opening" ? "Đang mở camera..." : "Chụp ảnh"}</button>
                <button type="button" onClick={stopCamera} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Tắt camera</button>
              </>}
            </div>
            {cameraError && <p role="alert" className="mt-3 text-sm text-red-600">{cameraError}</p>}
          </div>
          {fields.map(({ name, label, ...inputProps }) => (
            <div key={name}>
              <label htmlFor={`register-${name}`} className="mb-2 block text-sm font-medium">{label} {name === "phoneNumber" ? <span className="font-normal text-gray-500"></span> : <span className="text-red-500">*</span>}</label>
              <input {...inputProps} id={`register-${name}`} name={name} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required={name !== "phoneNumber"} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
          ))}
        </fieldset>
        {error && <p role="alert" className="text-center text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isSubmitting || cameraState !== "off"} className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Đang gửi đăng ký..." : "Đăng ký"}</button>
        <button type="button" disabled={isSubmitting} onClick={onBack} className="w-full py-2 text-sm font-semibold text-green-700 hover:underline disabled:opacity-60">Đã có tài khoản? Đăng nhập</button>
      </form>
    </>
  );
}
