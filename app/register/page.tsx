"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import { registerAPI } from "@/lib/api/auth";
import { setStoredUser } from "@/lib/auth";
import { ApiError } from "@/lib/api/config";
import { useThrottledAction } from "@/hooks/useThrottledAction";

// ============================================================
// RegisterPage — Gọi thật: POST /api/auth/register
// Backend fields: userName, fullName, phone, email, password, address
// ============================================================

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    userName: "",
    fullName: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  // Rate Limiting hook
  const { execute: throttledSubmit, isBlocked } = useThrottledAction(2000);

  // ---------- Validation ----------
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userName.trim() || formData.userName.length < 2) {
      newErrors.userName = "Tên đăng nhập phải có ít nhất 2 ký tự";
    }

    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      newErrors.fullName = "Họ tên phải có ít nhất 2 ký tự";
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.phone.match(/^[0-9]{10,20}$/)) {
      newErrors.phone = "Số điện thoại phải có 10-20 chữ số";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "Vui lòng chấp nhận điều khoản dịch vụ";
    }

    return newErrors;
  };

  // ---------- Submit ----------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    throttledSubmit(async () => {
      setApiError(null);
      const newErrors = validateForm();
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);
    try {
      const user = await registerAPI({
        userName: formData.userName.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        address: formData.address.trim() || undefined,
      });

      // Lưu user info — JWT đã được set trong HttpOnly cookie bởi backend
      setStoredUser(user);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 409 || err.code === 400) {
          setApiError("Email hoặc tên đăng nhập đã tồn tại. Vui lòng thử với thông tin khác.");
        } else {
          setApiError(err.message);
        }
      } else {
        setApiError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
      console.error("Register error:", err);
      } finally {
        setLoading(false);
      }
    });
  };

  const setField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (apiError) setApiError(null);
  };

  return (
    <div
      className="min-h-screen w-full relative flex flex-col overflow-x-hidden bg-cover bg-center font-sans"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920')",
      }}
    >
      {/* Autofill Transparency Styles */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s !important;
          box-shadow: inset 0 0 20px 20px rgba(255, 255, 255, 0.01) !important;
        }
      `}</style>

      {/* Dark Overlay & Backdrop Blur */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] z-0" />

      {/* Header */}
      <div className="relative z-20 w-full">
        <Header logoSrc="/assets/3-3.png" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10 w-full">
        {/* Glassmorphism Card Container */}
        <div className="relative w-full max-w-3xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-8 md:p-10 transition-all">
          <div className="h-1.5 w-32 bg-white/30 rounded-full mx-auto mb-6" />

          {/* Slogan & Logo */}
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/">
              <img
                src="/assets/3-5.png"
                alt="iTour Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold mt-3 italic">
              Thế giới trong tay bạn
            </span>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl px-4 py-3 text-sm backdrop-blur-sm">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5" noValidate>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Tên đăng nhập <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setField("userName", e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.userName
                    ? "border-[#ff4d4f] focus:ring-[#ff4d4f]/30"
                    : "border-white/40 focus:ring-white/30 focus:border-white focus:bg-white/15"
                  }`}
                placeholder="VD: nguyenvana123"
              />
              {errors.userName && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 font-medium">{errors.userName}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Họ tên đầy đủ <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.fullName
                    ? "border-[#ff4d4f] focus:ring-[#ff4d4f]/30"
                    : "border-white/40 focus:ring-white/30 focus:border-white focus:bg-white/15"
                  }`}
                placeholder="VD: Nguyễn Văn A"
              />
              {errors.fullName && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.email
                    ? "border-[#ff4d4f] focus:ring-[#ff4d4f]/30"
                    : "border-white/40 focus:ring-white/30 focus:border-white focus:bg-white/15"
                  }`}
                placeholder="example@gmail.com"
              />
              {errors.email && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Số điện thoại <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))}
                className={`w-full px-4 py-3 bg-white/10 border text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone
                    ? "border-[#ff4d4f] focus:ring-[#ff4d4f]/30"
                    : "border-white/40 focus:ring-white/30 focus:border-white focus:bg-white/15"
                  }`}
                placeholder="0901234567"
                maxLength={20}
              />
              {errors.phone && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 font-medium">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Mật khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.password
                      ? "border-[#ff4d4f] focus:ring-[#ff4d4f]/30"
                      : "border-white/40 focus:ring-white/30 focus:border-white focus:bg-white/15"
                    }`}
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-white/60 hover:text-white transition"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Xác nhận mật khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword
                      ? "border-[#ff4d4f] focus:ring-[#ff4d4f]/30"
                      : "border-white/40 focus:ring-white/30 focus:border-white focus:bg-white/15"
                    }`}
                  placeholder="Xác nhận mật khẩu"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Address (optional) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Địa chỉ <span className="text-white/45 text-xs font-normal ml-1.5">(Tùy chọn)</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setField("address", e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/40 text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white focus:bg-white/15 transition-all"
                placeholder="VD: Cao Lãnh, Đồng Tháp"
              />
            </div>

            {/* Agree to Terms Checkbox */}
            <div className="flex items-start gap-3 mt-2 md:col-span-2">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={(e) => setField("agreeToTerms", e.target.checked)}
                className="w-5 h-5 rounded border-white/40 bg-white/10 text-[#0EA5E9] focus:ring-white/30 cursor-pointer mt-0.5"
              />
              <label htmlFor="agreeToTerms" className="text-sm text-white/80 cursor-pointer select-none">
                Tôi đồng ý với các{" "}
                <Link href="/terms" className="text-white font-bold underline hover:text-[#38BDF8] hover:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-250">
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="text-white font-bold underline hover:text-[#38BDF8] hover:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-250">
                  Chính sách bảo mật
                </Link>{" "}
                của itour.
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-[#ff4d4f] text-xs mt-1 md:col-span-2 font-medium">{errors.agreeToTerms}</p>
            )}

            {/* Submit Button */}
            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading || isBlocked}
                className="w-full py-3.5 bg-white hover:bg-white/90 text-slate-900 font-bold text-sm rounded-full shadow-lg shadow-black/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-white/60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-slate-900" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang đăng ký tài khoản...
                  </>
                ) : (
                  "Đăng ký tài khoản"
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-white/60 mt-8">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-[#38BDF8] hover:text-[#7DD3FC] hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
