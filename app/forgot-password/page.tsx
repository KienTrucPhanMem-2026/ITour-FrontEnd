"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import {
  forgotPasswordAPI,
  verifyOtpAPI,
  resetPasswordAPI,
} from "@/lib/api/auth";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdowns = () => {
    setResendCooldown(60);
    setOtpExpiry(5 * 60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
      setOtpExpiry((e) => Math.max(0, e - 1));
    }, 1000);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Bước 1: Gửi OTP ──────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Vui lòng nhập email."); return; }
    setLoading(true); setError("");
    try {
      await forgotPasswordAPI(email.trim());
      setStep("otp");
      startCountdowns();
      setSuccess("Mã OTP đã được gửi! Vui lòng kiểm tra hộp thư (kể cả thư rác).");
      setTimeout(() => { setSuccess(""); otpRefs.current[0]?.focus(); }, 3000);
    } catch {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally { setLoading(false); }
  };

  // ── OTP input handlers ────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  // ── Bước 2: Xác thực OTP ─────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Vui lòng nhập đủ 6 chữ số."); return; }
    setLoading(true); setError("");
    try {
      await verifyOtpAPI(email, code);
      if (timerRef.current) clearInterval(timerRef.current);
      setStep("password");
      setSuccess("OTP hợp lệ! Vui lòng đặt mật khẩu mới.");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err: any) {
      setError(err?.message || "Mã OTP không đúng hoặc đã hết hạn.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true); setError("");
    try {
      await forgotPasswordAPI(email);
      setOtp(["", "", "", "", "", ""]);
      startCountdowns();
      setSuccess("Đã gửi lại mã OTP mới!");
      setTimeout(() => { setSuccess(""); otpRefs.current[0]?.focus(); }, 2000);
    } catch { setError("Không thể gửi lại OTP. Vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  // ── Bước 3: Đặt mật khẩu mới ─────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true); setError("");
    try {
      await resetPasswordAPI(email, newPassword);
      setSuccess("🎉 Mật khẩu đã được đặt lại thành công! Đang chuyển về trang đăng nhập...");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra. Vui lòng thực hiện lại từ đầu.");
    } finally { setLoading(false); }
  };

  // ── Step info ─────────────────────────────────────────────────
  const steps = [
    { key: "email",    label: "Nhập Email",   icon: "📧" },
    { key: "otp",      label: "Xác thực OTP", icon: "🔑" },
    { key: "password", label: "Mật Khẩu Mới", icon: "🔒" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div
      className="min-h-screen w-full relative flex flex-col overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920')",
      }}
    >
      {/* Autofill transparent style — giống LoginPage */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s !important;
          box-shadow: inset 0 0 20px 20px rgba(255,255,255,0.01) !important;
        }
      `}</style>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-20">
        <Header logoSrc="/assets/3-3.png" />
      </div>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-10">
          <div className="h-1.5 w-32 bg-white/30 rounded-full mx-auto mb-6" />

          {/* Logo */}
          <div className="flex flex-col items-center mb-6 text-center">
            <Link href="/">
              <img
                src="/assets/3-5.png"
                alt="iTour Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-semibold mt-3 italic">
              Khôi phục tài khoản
            </span>
          </div>

          {/* Stepper */}
          <div className="flex items-center mb-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : "none" }}>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 transition-all duration-300 ${
                    i < currentIdx
                      ? "bg-[#38BDF8] shadow-lg shadow-sky-500/30"
                      : i === currentIdx
                      ? "bg-white/20 border-2 border-[#38BDF8] shadow-lg shadow-sky-400/20"
                      : "bg-white/10 border border-white/20"
                  }`}
                >
                  {i < currentIdx ? "✓" : s.icon}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2 transition-all duration-500"
                    style={{
                      background: i < currentIdx
                        ? "linear-gradient(90deg, #38BDF8, #818CF8)"
                        : "rgba(255,255,255,0.2)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mb-7">
            {steps.map((s, i) => (
              <span
                key={s.key}
                className={`text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                  i === currentIdx ? "text-[#38BDF8]" : "text-white/35"
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl px-4 py-3 text-sm backdrop-blur-sm">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-start gap-3 bg-green-500/10 border border-green-500/30 text-green-200 rounded-2xl px-4 py-3 text-sm backdrop-blur-sm">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* ══════════ Bước 1: Email ══════════ */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-5" noValidate>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">Quên mật khẩu?</h2>
                <p className="text-sm text-white/55 mt-1 leading-relaxed">
                  Nhập email để nhận mã OTP xác thực
                </p>
              </div>

              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-white/80 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Ví dụ: email@gmail.com"
                    autoComplete="email"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/40 text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white focus:bg-white/15 transition-all"
                  />
                </div>
              </div>

              <button
                id="send-otp-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-white hover:bg-white/90 text-slate-900 font-bold text-sm rounded-full shadow-lg shadow-black/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-white/60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang gửi...
                  </>
                ) : "Gửi Mã OTP"}
              </button>

              <p className="text-center text-sm text-white/60 pt-1">
                Nhớ mật khẩu rồi?{" "}
                <Link href="/login" className="font-semibold text-[#38BDF8] hover:text-[#7DD3FC] hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </form>
          )}

          {/* ══════════ Bước 2: OTP ══════════ */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">Nhập mã OTP</h2>
                <p className="text-sm text-white/55 mt-1 leading-relaxed">
                  Mã 6 chữ số đã gửi tới{" "}
                  <span className="text-[#38BDF8] font-semibold">{email}</span>
                </p>
              </div>

              {/* Countdown OTP */}
              <div className="flex justify-center">
                {otpExpiry > 0 ? (
                  <div className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border ${
                    otpExpiry < 60
                      ? "text-red-300 border-red-500/30 bg-red-500/10"
                      : "text-white/70 border-white/20 bg-white/5"
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Hết hạn sau {formatTime(otpExpiry)}
                  </div>
                ) : (
                  <div className="text-sm text-red-300 border border-red-500/30 bg-red-500/10 px-4 py-2 rounded-full">
                    ⚠️ Mã OTP đã hết hạn — vui lòng gửi lại
                  </div>
                )}
              </div>

              {/* OTP boxes */}
              <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-2xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white bg-white/10 text-white placeholder-white/30 ${
                      digit ? "border-[#38BDF8] bg-white/15 shadow-lg shadow-sky-500/20" : "border-white/40"
                    }`}
                  />
                ))}
              </div>

              <button
                id="verify-otp-btn"
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full py-3.5 bg-white hover:bg-white/90 text-slate-900 font-bold text-sm rounded-full shadow-lg shadow-black/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-white/60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xác thực...
                  </>
                ) : "Xác Nhận OTP"}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }}
                  className="text-sm text-white/50 hover:text-white/80 transition"
                >
                  ← Đổi email
                </button>
                <button
                  id="resend-otp-btn"
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className={`text-sm font-semibold transition ${
                    resendCooldown > 0
                      ? "text-white/30 cursor-not-allowed"
                      : "text-[#38BDF8] hover:text-[#7DD3FC] hover:underline"
                  }`}
                >
                  {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại OTP"}
                </button>
              </div>
            </form>
          )}

          {/* ══════════ Bước 3: Mật khẩu mới ══════════ */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">Đặt mật khẩu mới</h2>
                <p className="text-sm text-white/55 mt-1 leading-relaxed">
                  Chọn mật khẩu mạnh, ít nhất 6 ký tự
                </p>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-white/80 mb-1.5">
                  Mật khẩu mới <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    placeholder="Nhập mật khẩu mới"
                    required
                    className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/40 text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white focus:bg-white/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-4 flex items-center text-white/60 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password strength */}
                {newPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((lvl) => (
                        <div
                          key={lvl}
                          className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            background: newPassword.length >= lvl * 3
                              ? lvl <= 1 ? "#ef4444"
                                : lvl <= 2 ? "#f97316"
                                  : lvl <= 3 ? "#eab308" : "#22c55e"
                              : "rgba(255,255,255,0.15)",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-white/45">
                      {newPassword.length < 6 ? "Quá ngắn"
                        : newPassword.length < 9 ? "Trung bình"
                          : newPassword.length < 12 ? "Tốt" : "Rất mạnh"}
                    </p>
                  </div>
                )}
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-white/80 mb-1.5">
                  Xác nhận mật khẩu <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className={`w-full pl-12 pr-12 py-3 bg-white/10 border text-white placeholder-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white focus:bg-white/15 transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-500/80"
                        : "border-white/40"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-4 flex items-center text-white/60 hover:text-white transition"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="mt-1.5 text-sm text-red-300">Mật khẩu không khớp</p>
                )}
              </div>

              <button
                id="reset-password-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-white hover:bg-white/90 text-slate-900 font-bold text-sm rounded-full shadow-lg shadow-black/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-white/60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang cập nhật...
                  </>
                ) : "Đặt Lại Mật Khẩu"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
