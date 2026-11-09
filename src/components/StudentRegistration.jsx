import React, { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getHcmRegistrationSchools, registerStudent } from "../api/auth";
import RegistrationOptionField, { NEW_REGISTRATION_OPTION } from "./RegistrationOptionField";

const fields = [
  { name: "fullName", label: "Họ và tên", placeholder: "Nhập họ và tên học sinh", autoComplete: "name", maxLength: 150 },
  { name: "phoneNumber", label: "Số điện thoại liên hệ", placeholder: "Nhập số điện thoại phụ huynh", autoComplete: "tel", maxLength: 20, type: "tel" },
];

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
  const [registeredUsername, setRegisteredUsername] = useState("");
  const [form, setForm] = useState({ fullName: "", schoolId: "", classId: "", schoolName: "", className: "", phoneNumber: "" });
  const [schools, setSchools] = useState([]);
  const classes = schools.find((school) => school.id === form.schoolId)?.classes || [];
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [optionsRevision, setOptionsRevision] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [cameraState, setCameraState] = useState("off");
  const [cameraError, setCameraError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef(null);
  const photoInputRef = useRef(null);
  const streamRef = useRef(null);
  const cameraRequestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setOptionsLoading(true);
    setOptionsError("");
    getHcmRegistrationSchools().then((response) => {
      const data = response?.data ?? response;
      if (!Array.isArray(data?.schools) || data.schools.some((school) => !school?.id || !school?.name || !Array.isArray(school.classes))) throw new Error("Dữ liệu trường/lớp HCM không hợp lệ.");
      if (cancelled) return;
      setSchools(data.schools);
    }).catch((failure) => {
      if (!cancelled) setOptionsError(failure.message || "Không thể tải trường/lớp.");
    }).finally(() => { if (!cancelled) setOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [optionsRevision]);

  useEffect(() => () => {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
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

  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCameraError("Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setCameraError("Ảnh phải có dung lượng lớn hơn 0 và không vượt quá 5 MB.");
      return;
    }
    stopCamera();
    setPhoto(file);
    setCameraError("");
    setError("");
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
    if ([values.fullName, values.schoolId, values.classId].some((value) => !value)) {
      setError("Vui lòng điền đầy đủ thông tin đăng ký.");
      return;
    }
    if ((values.schoolId === NEW_REGISTRATION_OPTION && !values.schoolName) || (values.classId === NEW_REGISTRATION_OPTION && !values.className)) {
      setError("Vui lòng nhập tên trường và lớp.");
      return;
    }
    const phoneNumber = values.phoneNumber.replace(/[\s().-]/g, "");
    if (values.phoneNumber && !/^(?:0|\+84|84)[35789]\d{8}$/.test(phoneNumber)) {
      setError("Vui lòng nhập số điện thoại Việt Nam hợp lệ (ví dụ: 0912345678 hoặc +84912345678).");
      return;
    }
    if (!photo) {
      setError("Vui lòng chụp ảnh hoặc chọn ảnh học sinh có sẵn trước khi đăng ký.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { schoolId, classId, schoolName, className, ...student } = values;
      const response = await registerStudent({
        ...student, password: "123456", phoneNumber, photo,
        ...(schoolId === NEW_REGISTRATION_OPTION ? { schoolName } : { schoolId }),
        ...(classId === NEW_REGISTRATION_OPTION ? { className } : { classId }),
      });
      const session = response?.data ?? response;
      if (!session?.accessToken || !session?.userId) throw new Error("Máy chủ chưa trả về phiên đăng nhập hợp lệ. Vui lòng liên hệ nhà trường trước khi đăng ký lại.");
      localStorage.setItem("accessToken", session.accessToken);
      localStorage.setItem("userId", session.userId);
      localStorage.setItem("userType", session.userType);
      localStorage.setItem("user", session.userName);
      localStorage.setItem("fullName", session.fullName);
      localStorage.setItem("studentAvatar", session.avatar || "");
      localStorage.setItem("studentSchoolName", session.schoolName || "");
      localStorage.setItem("studentClassName", session.className || "");
      stopCamera();
      setRegisteredUsername(session.userName);
    } catch (submitError) {
      setError(submitError.message || "Không thể gửi đăng ký. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredUsername) return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold text-green-700">Đăng ký thành công</h2>
      <p>Hãy lưu lại ID đăng nhập để sử dụng cho những lần sau.</p>
      <p className="break-all text-2xl font-bold">{registeredUsername}</p>
      <p>Mật khẩu mặc định: <strong>123456</strong></p>
      <button type="button" onClick={() => navigate("/golden-bell", { replace: true })} className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">Tiếp tục</button>
    </div>
  );

  return (
    <>
      <h2 className="mb-2 text-center text-2xl font-bold text-green-700">Đăng ký học sinh</h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chụp ảnh hoặc chọn ảnh có sẵn và điền các thông tin có dấu * bên dưới.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4 disabled:opacity-60">
          <legend className="sr-only">Thông tin đăng ký học sinh</legend>
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
            <p className="mb-3 text-sm font-medium">Ảnh học sinh <span className="text-red-500">*</span></p>
            <div className="relative mx-auto flex aspect-square w-40 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-green-100">
              <video ref={videoRef} autoPlay muted playsInline className={`h-full w-full -scale-x-100 object-cover ${cameraState === "off" ? "hidden" : ""}`} aria-label="Xem trước camera" />
              {cameraState === "off" && (preview ? <img src={preview} alt="Ảnh học sinh đã chọn" onError={() => { setPhoto(null); setCameraError("Không thể đọc ảnh. Vui lòng chọn ảnh khác hoặc chụp lại."); }} className="h-full w-full object-cover" /> : <Camera className="h-12 w-12 text-green-300" aria-hidden="true" />)}
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
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="hidden" aria-label="Chọn ảnh học sinh có sẵn" />
              <button type="button" onClick={() => photoInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100">
                <ImagePlus size={16} aria-hidden="true" />Chọn ảnh có sẵn
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Ảnh JPG, PNG hoặc WebP, tối đa 5 MB.</p>
            {cameraError && <p role="alert" className="mt-3 text-sm text-red-600">{cameraError}</p>}
          </div>
          {fields.map(({ name, label, ...inputProps }) => (
            <div key={name}>
              <label htmlFor={`register-${name}`} className="mb-2 block text-sm font-medium">{label} {name === "phoneNumber" ? <span className="font-normal text-gray-500"></span> : <span className="text-red-500">*</span>}</label>
              <input {...inputProps} id={`register-${name}`} name={name} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required={name !== "phoneNumber"} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
          ))}
          <RegistrationOptionField id="register-school" label="Trường" options={schools} value={form.schoolId} name={form.schoolName} loading={optionsLoading} showCreateOption={false} onChange={(schoolId, schoolName) => setForm((current) => ({ ...current, schoolId, schoolName, classId: "", className: "" }))} />
          <RegistrationOptionField id="register-class" label="Lớp" options={classes} value={form.classId} name={form.className} loading={optionsLoading} disabled={!form.schoolId} onChange={(classId, className) => setForm((current) => ({ ...current, classId, className }))} />
          {optionsError && <p role="alert" className="text-sm text-red-600">{optionsError} <button type="button" onClick={() => setOptionsRevision((value) => value + 1)} className="font-semibold underline">Tải lại</button></p>}
        </fieldset>
        {error && <p role="alert" className="text-center text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isSubmitting || cameraState !== "off" || !form.schoolId || !form.classId} className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Đang gửi đăng ký..." : "Đăng ký"}</button>
        <button type="button" disabled={isSubmitting} onClick={onBack} className="w-full py-2 text-sm font-semibold text-green-700 hover:underline disabled:opacity-60">Đã có tài khoản? Đăng nhập</button>
      </form>
    </>
  );
}
