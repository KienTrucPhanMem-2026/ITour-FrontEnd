"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import { registerAPI } from "@/lib/api/auth";
import { setStoredUser } from "@/lib/auth";
import { ApiError } from "@/lib/api/config";

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const setField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (apiError) setApiError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F8F8] flex flex-col">
      {/* ── Header ── */}
      <Header logoSrc="/assets/3-1.png" />

      {/* ── Main Content ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#0EA5E9] to-[#38BDF8]" />
            <div className="px-8 py-10">
              {/* Heading */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E0F2FE] mb-4">
                  <svg className="w-8 h-8 text-[#0EA5E9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Đăng ký</h1>
                <p className="text-sm text-gray-500 mt-1">Bắt đầu hành trình du lịch của bạn cùng itour!</p>
              </div>

              {/* API error banner */}
              {apiError && (
                <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{apiError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) => setField("userName", e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F8F8] border rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.userName
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-[#0EA5E9] focus:border-transparent"
                      }`}
                    placeholder="Nhập tên đăng nhập (VD: nguyenvana)"
                  />
                  {errors.userName && <p className="text-red-500 text-sm mt-1.5">{errors.userName}</p>}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Họ tên đầy đủ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F8F8] border rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.fullName
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-[#0EA5E9] focus:border-transparent"
                      }`}
                    placeholder="Nhập họ tên đầy đủ"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1.5">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F8F8] border rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-[#0EA5E9] focus:border-transparent"
                      }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1.5">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))}
                    className={`w-full px-4 py-3 bg-[#F5F8F8] border rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.phone
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-[#0EA5E9] focus:border-transparent"
                      }`}
                    placeholder="0901234567"
                    maxLength={20}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1.5">{errors.phone}</p>}
                </div>

                {/* Address (optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Địa chỉ <span className="text-gray-400 font-normal">(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setField("address", e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F8F8] border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition"
                    placeholder="Nhập địa chỉ của bạn"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setField("password", e.target.value)}
                      className={`w-full px-4 py-3 bg-[#F5F8F8] border rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.password
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-200 focus:ring-[#0EA5E9] focus:border-transparent"
                        }`}
                      placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-[#0EA5E9] transition"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1.5">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setField("confirmPassword", e.target.value)}
                    className={`w-full px-4 py-3 bg-[#F5F8F8] border rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-[#0EA5E9] focus:border-transparent"
                      }`}
                    placeholder="Xác nhận mật khẩu"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1.5">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Agree to Terms */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setField("agreeToTerms", e.target.checked)}
                    className="w-5 h-5 text-[#0EA5E9] rounded border-gray-300 focus:ring-[#0EA5E9] cursor-pointer mt-0.5"
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-gray-700 cursor-pointer select-none">
                    Tôi đồng ý với{" "}
                    <Link href="/terms" className="text-[#0EA5E9] hover:underline font-semibold">Điều khoản dịch vụ</Link>{" "}
                    và{" "}
                    <Link href="/privacy" className="text-[#0EA5E9] hover:underline font-semibold">Chính sách bảo mật</Link>{" "}
                    của itour.
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-red-500 text-sm mt-1.5">{errors.agreeToTerms}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-3.5 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-[#7DD3FC] text-white font-semibold text-sm rounded-full shadow-md shadow-[#0EA5E9]/30 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    "Đăng ký"
                  )}
                </button>
              </form>

              {/* Login Link */}
              <p className="text-center text-sm text-gray-500 mt-8">
                Đã có tài khoản?{" "}
                <Link href="/login" className="font-semibold text-[#0EA5E9] hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Bằng cách đăng ký, bạn đồng ý với{" "}
            <Link href="/terms" className="underline hover:text-gray-600">Điều khoản dịch vụ</Link>{" "}
            và{" "}
            <Link href="/privacy" className="underline hover:text-gray-600">Chính sách bảo mật</Link>{" "}
            của itour.
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-4">
        <p className="text-center text-xs text-gray-400">
          © 2026 itour. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
