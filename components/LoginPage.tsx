"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAPI } from "@/lib/api/auth";
import { setStoredUser, isAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api/config";

// ============================================================
// LoginPage Component
// Gọi thật: POST /api/auth/login
// JWT được set trong HttpOnly cookie bởi backend.
// User info lưu vào localStorage để hiển thị UI.
// ============================================================

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Nếu đã login rồi → redirect về redirect URL hoặc home
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(redirectUrl);
    }
    // Khôi phục email đã nhớ
    const remembered = localStorage.getItem("rememberEmail");
    if (remembered) {
      setFormData((prev) => ({ ...prev, email: remembered, rememberMe: true }));
    }
  }, []);

  // ---------- Validation ----------
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return "Email không được để trống";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email không hợp lệ";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Mật khẩu không được để trống";
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;
    const passErr = validatePassword(formData.password);
    if (passErr) newErrors.password = passErr;
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Gọi API thật — cookie JWT được set tự động bởi browser
      const user = await loginAPI({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      // Lưu user info (không lưu token — token ở HttpOnly cookie)
      setStoredUser(user);

      // Xử lý ghi nhớ email
      if (formData.rememberMe) {
        localStorage.setItem("rememberEmail", formData.email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      // Redirect to redirect URL or home page after successful login
      router.push(redirectUrl);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 401 || err.code === 400) {
          setError("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F8] flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#0EA5E9] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Du Lịch Việt</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-[#0EA5E9] transition-colors">Trang chủ</Link>
            <Link href="/tours" className="hover:text-[#0EA5E9] transition-colors">Tour du lịch</Link>
          </nav>

          <Link href="/register"
            className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-[#0EA5E9] hover:underline"
          >
            Đăng ký tài khoản
          </Link>
        </div>
      </header>

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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
                <p className="text-sm text-gray-500 mt-1">Chào mừng bạn quay trở lại Du Lịch Việt!</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Ví dụ: email@gmail.com"
                      className={`w-full pl-12 pr-4 py-3 bg-[#F5F8F8] border rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                        formErrors.email
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-200 focus:ring-[#0EA5E9] focus:border-transparent"
                      }`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu của bạn"
                      className={`w-full pl-12 pr-12 py-3 bg-[#F5F8F8] border rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition ${
                        formErrors.password
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-200 focus:ring-[#0EA5E9] focus:border-transparent"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-gray-300 text-[#0EA5E9] focus:ring-[#0EA5E9] cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm font-semibold text-[#0EA5E9] hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full py-3.5 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-[#7DD3FC] text-white font-semibold text-sm rounded-full shadow-md shadow-[#0EA5E9]/30 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang đăng nhập...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </button>
              </form>

              {/* Register link */}
              <p className="text-center text-sm text-gray-500 mt-8">
                Chưa có tài khoản?{" "}
                <Link href="/register" className="font-semibold text-[#0EA5E9] hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <Link href="/terms" className="underline hover:text-gray-600">Điều khoản dịch vụ</Link>{" "}
            và{" "}
            <Link href="/privacy" className="underline hover:text-gray-600">Chính sách bảo mật</Link>{" "}
            của Du Lịch Việt.
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-4">
        <p className="text-center text-xs text-gray-400">
          © 2026 Du Lịch Việt. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
