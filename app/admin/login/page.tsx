"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mockAdminAccounts } from "@/lib/mockData";
import { useThrottledAction } from "@/hooks/useThrottledAction";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Rate Limiting hook
  const { execute: throttledSubmit, isBlocked } = useThrottledAction(2000);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    throttledSubmit(() => {
      const newErrors = validateForm();

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        // Check admin credentials
        const adminAccount = mockAdminAccounts.find(
          (acc) =>
            acc.email === formData.email && acc.password === formData.password
        );

        if (adminAccount) {
          localStorage.setItem(
            "currentUser",
            JSON.stringify(adminAccount.user)
          );
          localStorage.setItem("authToken", "admin_token_" + Date.now());
          localStorage.setItem("userRole", adminAccount.role);
          setLoading(false);
          router.push("/admin");
        } else {
          setLoading(false);
          setErrors({ submit: "Email hoặc mật khẩu không chính xác" });
        }
      }, 1500);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600">Đăng nhập để quản lý hệ thống</p>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-semibold">{errors.submit}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Admin
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: "" });
                if (errors.submit) setErrors({ ...errors, submit: "" });
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 transition ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="admin@dulichviet.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mật Khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password)
                    setErrors({ ...errors, password: "" });
                  if (errors.submit) setErrors({ ...errors, submit: "" });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 transition ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="rememberMe"
              checked={formData.rememberMe}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rememberMe: e.target.checked,
                })
              }
              className="w-5 h-5 text-purple-600 rounded focus:ring-2"
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-700">
              Ghi nhớ tôi
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || isBlocked}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xác thực...
              </>
            ) : (
              "Đăng Nhập Admin"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Không phải admin?</span>
          </div>
        </div>

        {/* User Login Link */}
        <div className="text-center mb-6">
          <Link
            href="/login"
            className="text-[#0EA5E9] hover:text-[#0185B8] font-semibold"
          >
            Đăng Nhập Người Dùng
          </Link>
        </div>

        {/* Test Credentials */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs font-semibold text-purple-900 mb-2">
            🧪 Tài khoản Test Admin:
          </p>
          <div className="space-y-1 text-xs">
            <p className="text-purple-800 font-mono">📧 admin@dulichviet.com</p>
            <p className="text-purple-800 font-mono">🔑 admin123</p>
            <p className="text-purple-700 mt-2">
              Hoặc: editor@dulichviet.com / editor123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
