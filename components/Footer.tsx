"use client";

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-slate-400 py-20 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand - Chiếm 4 cột để tạo độ thoáng */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6 group cursor-pointer">
              <div className="w-11 h-11 rounded-2xl bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20 transition-transform group-hover:rotate-6">
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
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0110.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Du Lịch Việt
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 pr-10">
              Kiến tạo những hành trình di sản, đưa bạn đến những vùng đất mới
              với trải nghiệm đẳng cấp và sự tận tâm tuyệt đối.
            </p>

            {/* Social Icons - Clean & Minimal */}
            <div className="flex gap-4 mt-8">
              {[
                {
                  name: "FB",
                  path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
                },
                {
                  name: "IG",
                  path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 21h9a4.5 4.5 0 004.5-4.5v-9A4.5 4.5 0 0016.5 3h-9A4.5 4.5 0 003 7.5v9A4.5 4.5 0 007.5 21z",
                },
                {
                  name: "TW",
                  path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-slate-800/50 flex items-center justify-center hover:bg-sky-600 hover:text-white transition-all duration-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links - Sử dụng grid 2 cột cho phần link trên mobile */}
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Công Ty */}
            <div>
              <h3 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.2em]">
                Công ty
              </h3>
              <ul className="space-y-4">
                {[
                  "Về chúng tôi",
                  "Hành trình mới",
                  "Blog du lịch",
                  "Cơ hội nghề nghiệp",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm hover:text-sky-400 transition-colors duration-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hỗ Trợ */}
            <div>
              <h3 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.2em]">
                Hỗ trợ
              </h3>
              <ul className="space-y-4">
                {[
                  "Trung tâm trợ giúp",
                  "Chính sách hủy tour",
                  "Điều khoản sử dụng",
                  "Bảo mật thông tin",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm hover:text-sky-400 transition-colors duration-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Liên Hệ */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-white font-bold mb-6 text-xs uppercase tracking-[0.2em]">
                Liên hệ
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <span className="text-sky-500 font-bold">T.</span> (012) 345
                  6789
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-sky-500 font-bold">E.</span>{" "}
                  hello@dulichviet.com
                </li>
                <li className="text-slate-500 leading-relaxed italic">
                  Quận 1, TP. Hồ Chí Minh, Việt Nam
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Cực kỳ tối giản */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">
            <p>© 2026 DU LICH VIET CO.</p>
            <div className="hidden md:block h-1 w-1 rounded-full bg-slate-700" />
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
          </div>

          <div className="flex gap-4">
            {/* Giả lập các logo thanh toán nhỏ, xám */}
            <div className="w-8 h-5 rounded bg-slate-800/50 border border-slate-700" />
            <div className="w-8 h-5 rounded bg-slate-800/50 border border-slate-700" />
            <div className="w-8 h-5 rounded bg-slate-800/50 border border-slate-700" />
          </div>
        </div>
      </div>
    </footer>
  );
}
