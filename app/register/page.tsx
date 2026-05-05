"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#0EA5E9] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng Ký Tài Khoản</h1>
          <p className="text-gray-600">Bắt đầu hành trình du lịch của bạn</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên Đăng Nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setField("userName", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition ${
                errors.userName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nhập tên đăng nhập (VD: nguyenvana)"
            />
            {errors.userName && <p className="text-red-500 text-sm mt-1">{errors.userName}</p>}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Họ Tên Đầy Đủ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition ${
                errors.fullName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nhập họ tên đầy đủ"
            />
            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setField("email", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Số Điện Thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setField("phone", e.target.value.replace(/\D/g, ""))}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0901234567"
              maxLength={20}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          {/* Address (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Địa Chỉ <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setField("address", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition"
              placeholder="Nhập địa chỉ của bạn"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật Khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setField("password", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Xác Nhận Mật Khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setField("confirmPassword", e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] transition ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Xác nhận mật khẩu"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Agree to Terms */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={(e) => setField("agreeToTerms", e.target.checked)}
              className="w-5 h-5 text-[#0EA5E9] rounded focus:ring-2 mt-1"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
              Tôi đồng ý với{" "}
              <Link href="#" className="text-[#0EA5E9] hover:underline font-semibold">Điều khoản dịch vụ</Link>{" "}
              và{" "}
              <Link href="#" className="text-[#0EA5E9] hover:underline font-semibold">Chính sách bảo mật</Link>
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0EA5E9] hover:bg-[#0185B8] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đăng Ký"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-[#0EA5E9] hover:underline font-semibold">
              Đăng Nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
