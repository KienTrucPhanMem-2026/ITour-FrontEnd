"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Header from "./Header";
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
    <div
      className="min-h-screen w-full relative flex flex-col overflow-hidden bg-cover bg-center"
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

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />

      {/* ── Header ── */}
      <div className="relative z-20">
        <Header logoSrc="/assets/3-1.png" />
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        {/* Glassmorphism Card */}
        <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-10">
          <div className="h-1.5 w-32 bg-white/30 rounded-full mx-auto mb-6" />

          {/* Heading */}
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

          {/* Error message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl px-4 py-3 text-sm backdrop-blur-sm">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <label htmlFor="email" className="block text-sm font-semibold text-white/80 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`w-full pl-12 pr-4 py-3 bg-white/10 border border-white/40 text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white focus:bg-white/15 transition-all ${formErrors.email ? "border-red-500/80 focus:ring-red-500" : ""
                    }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-2 text-sm text-red-300">{formErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white/80 mb-1.5">
                Mật khẩu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`w-full pl-12 pr-12 py-3 bg-white/10 border border-white/40 text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white focus:bg-white/15 transition-all ${formErrors.password ? "border-red-500/80 focus:ring-red-500" : ""
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
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
              {formErrors.password && (
                <p className="mt-2 text-sm text-red-300">{formErrors.password}</p>
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
                  className="w-4 h-4 rounded border-white/40 bg-white/10 text-[#0EA5E9] focus:ring-white/30 cursor-pointer"
                />
                <span className="text-sm text-white/80">Ghi nhớ đăng nhập</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-semibold text-[#38BDF8] hover:text-[#7DD3FC] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-white hover:bg-white/90 text-slate-900 font-bold text-sm rounded-full shadow-lg shadow-black/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-white/60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-slate-900" fill="none" viewBox="0 0 24 24">
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-white/50 font-bold">Hoặc</span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/40 rounded-2xl text-white text-xs font-semibold transition"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/40 rounded-2xl text-white text-xs font-semibold transition"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.27-.56 2.98-1.41z" />
              </svg>
              Apple
            </button>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-white/60 mt-8">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-semibold text-[#38BDF8] hover:text-[#7DD3FC] hover:underline">
              Đăng ký ngay
            </Link>
          </p>

          <p className="text-center text-[10px] text-white/40 mt-6 leading-relaxed">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <Link href="/terms" className="underline hover:text-white/60">Điều khoản dịch vụ</Link>{" "}
            và{" "}
            <Link href="/privacy" className="underline hover:text-white/60">Chính sách bảo mật</Link>{" "}
            của itour.
          </p>
        </div>
      </main>
    </div>
  );
}
