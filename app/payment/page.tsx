"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { mockTours } from "@/lib/mockData";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | "wallet">(
    "card"
  );
  const [currentUser, setCurrentUser] = useState<any>(null);

  const tourSlug = searchParams.get("tourSlug");
  const date = searchParams.get("date");
  const participants = parseInt(searchParams.get("participants") || "1");

  const tour = mockTours.find((t) => t.slug === tourSlug);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Tour không tìm thấy
          </h1>
          <Link href="/tours" className="text-[#0EA5E9] hover:underline">
            Quay lại danh sách tour
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = tour.price * participants;
  const discount = Math.floor((tour.originalPrice || 0) - tour.price) * participants;

  const [formData, setFormData] = useState({
    fullName: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    bankAccount: "",
    bankName: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePaymentForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên";
    }

    if (!formData.phone.match(/^0\d{9}$/)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (paymentMethod === "card") {
      if (!formData.cardNumber.replace(/\s/g, "").match(/^\d{13,19}$/)) {
        newErrors.cardNumber = "Số thẻ phải có 13-19 chữ số";
      }
      if (!formData.cardName.trim()) {
        newErrors.cardName = "Vui lòng nhập tên trên thẻ";
      }
      if (!formData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
        newErrors.expiryDate = "MM/YY";
      }
      if (!formData.cvv.match(/^\d{3,4}$/)) {
        newErrors.cvv = "CVV không hợp lệ";
      }
    } else if (paymentMethod === "bank") {
      if (!formData.bankAccount.trim()) {
        newErrors.bankAccount = "Vui lòng nhập số tài khoản";
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = "Vui lòng chọn ngân hàng";
      }
    }

    return newErrors;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validatePaymentForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    // Mock payment processing
    setTimeout(() => {
      // Create booking
      const booking = {
        id: `booking-${Date.now()}`,
        userId: currentUser?.id,
        tourId: tour.id,
        tourTitle: tour.title,
        tourSlug: tour.slug,
        status: "confirmed" as const,
        checkIn: date,
        participants,
        totalPrice,
        bookingDate: new Date().toISOString().split("T")[0],
        paymentMethod,
      };

      // Store booking to localStorage
      const bookings = JSON.parse(
        localStorage.getItem("userBookings") || "[]"
      );
      bookings.push(booking);
      localStorage.setItem("userBookings", JSON.stringify(bookings));

      setLoading(false);
      router.push(`/payment/confirmation?bookingId=${booking.id}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#0EA5E9] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Du Lịch Việt</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">Thanh Toán</h1>

          <div className="text-right">
            <p className="text-sm text-gray-600">Người dùng</p>
            <p className="font-semibold text-gray-900">{currentUser?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Thông Tin Thanh Toán
              </h2>

              {/* Personal Info */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Thông Tin Liên Hệ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Họ Tên
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName)
                          setErrors({ ...errors, fullName: "" });
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                        errors.fullName ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số Điện Thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone)
                          setErrors({ ...errors, phone: "" });
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Phương Thức Thanh Toán
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: "card", label: "Thẻ Tín Dụng", icon: "💳" },
                    { id: "bank", label: "Chuyển Khoản", icon: "🏦" },
                    { id: "wallet", label: "Ví Điện Tử", icon: "💰" },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() =>
                        setPaymentMethod(method.id as "card" | "bank" | "wallet")
                      }
                      className={`p-4 border-2 rounded-xl transition-all ${
                        paymentMethod === method.id
                          ? "border-[#0EA5E9] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-3xl mb-2">{method.icon}</div>
                      <p className="font-semibold text-gray-900">
                        {method.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Details Form */}
              <form onSubmit={handlePayment}>
                {paymentMethod === "card" && (
                  <div className="mb-8 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl text-white">
                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Số Thẻ
                      </label>
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\s/g, "");
                          value = value
                            .match(/.{1,4}/g)
                            ?.join(" ")
                            .substr(0, 19) || "";
                          setFormData({ ...formData, cardNumber: value });
                          if (errors.cardNumber)
                            setErrors({ ...errors, cardNumber: "" });
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`w-full bg-rgba-white-10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                          errors.cardNumber ? "border-red-500" : "border-gray-600"
                        }`}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.cardNumber}
                        </p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Tên Chủ Thẻ
                      </label>
                      <input
                        type="text"
                        value={formData.cardName}
                        onChange={(e) => {
                          setFormData({ ...formData, cardName: e.target.value });
                          if (errors.cardName)
                            setErrors({ ...errors, cardName: "" });
                        }}
                        placeholder="NGUYEN VAN A"
                        className={`w-full bg-rgba-white-10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                          errors.cardName ? "border-red-500" : "border-gray-600"
                        }`}
                      />
                      {errors.cardName && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.cardName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Hết Hạn
                        </label>
                        <input
                          type="text"
                          value={formData.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + "/" + value.slice(2, 4);
                            }
                            setFormData({
                              ...formData,
                              expiryDate: value,
                            });
                            if (errors.expiryDate)
                              setErrors({ ...errors, expiryDate: "" });
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                          className={`w-full bg-rgba-white-10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                            errors.expiryDate ? "border-red-500" : "border-gray-600"
                          }`}
                        />
                        {errors.expiryDate && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.expiryDate}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={formData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setFormData({ ...formData, cvv: value });
                            if (errors.cvv)
                              setErrors({ ...errors, cvv: "" });
                          }}
                          placeholder="123"
                          maxLength={4}
                          className={`w-full bg-rgba-white-10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                            errors.cvv ? "border-red-500" : "border-gray-600"
                          }`}
                        />
                        {errors.cvv && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.cvv}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "bank" && (
                  <div className="mb-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ngân Hàng
                      </label>
                      <select
                        value={formData.bankName}
                        onChange={(e) => {
                          setFormData({ ...formData, bankName: e.target.value });
                          if (errors.bankName)
                            setErrors({ ...errors, bankName: "" });
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                          errors.bankName ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="">Chọn ngân hàng</option>
                        <option value="Vietcombank">Vietcombank</option>
                        <option value="BIDV">BIDV</option>
                        <option value="MB Bank">MB Bank</option>
                        <option value="VPBank">VPBank</option>
                      </select>
                      {errors.bankName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.bankName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Số Tài Khoản
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            bankAccount: e.target.value,
                          });
                          if (errors.bankAccount)
                            setErrors({ ...errors, bankAccount: "" });
                        }}
                        placeholder="1234567890"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] ${
                          errors.bankAccount ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.bankAccount && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.bankAccount}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {paymentMethod === "wallet" && (
                  <div className="mb-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
                    <p className="text-green-800">
                      Ví Điện Tử: Số dư hiện tại: <strong>50.000.000đ</strong>
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                      Bạn sẽ được trừ {(totalPrice / 1000000).toFixed(1)}M₫ từ ví
                    </p>
                  </div>
                )}

                {/* Booking Summary */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tóm Tắt Đơn Hàng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tour:</span>
                      <span className="font-semibold">{tour.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày khởi hành:</span>
                      <span className="font-semibold">
                        {date && new Date(date).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số người:</span>
                      <span className="font-semibold">{participants} người</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="text-gray-600">Giá tour:</span>
                      <span className="font-semibold">
                        {(tour.price / 1000000).toFixed(1)}M₫ x {participants}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#00D084] hover:bg-[#00B86F] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý thanh toán...
                    </>
                  ) : (
                    `Thanh Toán ${(totalPrice / 1000000).toFixed(1)}M₫`
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Price Summary (Sticky Right Sidebar) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Chi Tiết Giá
              </h3>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Giá tour</span>
                  <span className="font-semibold text-gray-900">
                    {(tour.price / 1000000).toFixed(1)}M₫
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Số lượng</span>
                  <span className="font-semibold text-gray-900">
                    {participants} người
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Giảm giá</span>
                    <span className="font-semibold">
                      -{(discount / 1000000).toFixed(1)}M₫
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tổng cộng</span>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#00D084]">
                      {(totalPrice / 1000000).toFixed(1)}M₫
                    </div>
                    <div className="text-xs text-gray-500">/{participants} người</div>
                  </div>
                </div>
              </div>

              {/* Tour Info */}
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏷️</span>
                  <div className="text-sm">
                    <p className="text-gray-600">Tour</p>
                    <p className="font-semibold text-gray-900">{tour.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <div className="text-sm">
                    <p className="text-gray-600">Điểm</p>
                    <p className="font-semibold text-gray-900">{tour.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🕐</span>
                  <div className="text-sm">
                    <p className="text-gray-600">Thời gian</p>
                    <p className="font-semibold text-gray-900">
                      {tour.duration}
                    </p>
                  </div>
                </div>
              </div>

              {/* Secure Payment Badge */}
              <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                <p className="text-xs text-green-700 flex items-center justify-center gap-1">
                  🔒 Thanh toán an toàn 100%
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0EA5E9]"></div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
