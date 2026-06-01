"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getBlogBySlugAPI,
  getPublishedBlogsAPI,
  type BlogDTO,
  type BlogTag,
  BLOG_TAG_LABELS,
  BLOG_TAG_COLORS,
} from "@/lib/api/blogs";
import { getToursAPI } from "@/lib/api/tours";
import type { TourDTO } from "@/types/api";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

// Parse H2/H3 headings from HTML content for Table of Contents
function parseHeadings(html: string): { id: string; text: string; level: number }[] {
  const matches = Array.from(html.matchAll(/<h([23])[^>]*>(.*?)<\/h[23]>/gi));
  return matches.map((m, i) => ({
    level: parseInt(m[1]),
    text: m[2].replace(/<[^>]+>/g, ""),
    id: `heading-${i}`,
  }));
}

// Inject id attributes into headings in HTML string
function injectHeadingIds(html: string): string {
  let idx = 0;
  return html.replace(/<h([23])([^>]*)>/gi, (_match, level, attrs) => {
    return `<h${level}${attrs} id="heading-${idx++}">`;
  });
}

// ── Related Tour Card ─────────────────────────────────────────────────────────
function RelatedTourCard({ tour }: { tour: TourDTO }) {
  const price = Number(tour.price ?? 0);
  return (
    <Link href={`/tours/${tour.id}`} className="related-tour-card">
      <div className="related-tour-card__img-wrap">
        <img
          src={tour.images?.[0] || "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80"}
          alt={tour.name}
          className="related-tour-card__img"
        />
      </div>
      <div className="related-tour-card__body">
        <h4 className="related-tour-card__name">{tour.name}</h4>
        <div className="related-tour-card__meta">
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#94a3b8"><path d="M17 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3 3.9 3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h12v11zm-7-8h5v5h-5z"/></svg>
            {tour.durationDays}N{tour.durationNights}Đ
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            {tour.endDestinationName || "Việt Nam"}
          </span>
        </div>
        <div className="related-tour-card__footer">
          <span className="related-tour-card__price">
            {formatPrice(price)}
          </span>
          <span className="related-tour-card__cta">Đặt ngay →</span>
        </div>
      </div>
    </Link>
  );
}

// ── Main Detail Page ──────────────────────────────────────────────────────────
export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<BlogDTO | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogDTO[]>([]);
  const [relatedTours, setRelatedTours] = useState<TourDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHeading, setActiveHeading] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      getBlogBySlugAPI(slug),
      getPublishedBlogsAPI(),
      getToursAPI(),
    ])
      .then(([b, allBlogs, allTours]) => {
        setBlog(b);
        // Related blogs: same tag, excluding current
        const related = allBlogs.filter((rb) => rb.id !== b.id && rb.tag === b.tag).slice(0, 3);
        setRelatedBlogs(related);
        
        // Related tours: use linked tours from blog if present, else fallback to random 3
        if (b.tourIds) {
          const linkedIds = b.tourIds.split(",").filter(Boolean);
          const filteredTours = allTours.filter((t) => linkedIds.includes(t.id));
          setRelatedTours(filteredTours.slice(0, 4)); // limit to max 4
        } else {
          const shuffled = [...allTours].sort(() => Math.random() - 0.5);
          setRelatedTours(shuffled.slice(0, 3));
        }
      })
      .catch(() => router.push("/blogs"))
      .finally(() => setLoading(false));
  }, [slug]);

  // Sticky TOC highlight via IntersectionObserver
  useEffect(() => {
    if (!contentRef.current) return;
    const headingEls = contentRef.current.querySelectorAll("h2[id], h3[id]");
    if (!headingEls.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveHeading(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [blog]);

  const headings = blog ? parseHeadings(blog.content || "") : [];
  const processedContent = blog ? injectHeadingIds(blog.content || "") : "";

  if (loading) {
    return (
      <>
        <Header />
        <div className="blog-detail-skeleton">
          <div className="skeleton-hero" />
          <div className="skeleton-body">
            <div className="skeleton-main">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-para" />
              ))}
            </div>
            <div className="skeleton-sidebar">
              <div className="skeleton-widget" />
              <div className="skeleton-widget" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!blog) return null;

  return (
    <>
      <Header />
      <main className="blog-detail">
        {/* ── HERO BANNER ──────────────────────────────────────── */}
        <div className="bd-hero">
          <img
            src={blog.thumbnailUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80"}
            alt={blog.title}
            className="bd-hero__img"
          />
          <div className="bd-hero__overlay" />
          <div className="bd-hero__content">
            {/* Breadcrumb */}
            <nav className="bd-breadcrumb">
              <Link href="/" className="bd-bc-link">Trang chủ</Link>
              <span className="bd-bc-sep">›</span>
              <Link href="/blogs" className="bd-bc-link">Cẩm nang</Link>
              <span className="bd-bc-sep">›</span>
              <span className="bd-bc-current">{blog.title.slice(0, 40)}...</span>
            </nav>

            {/* Tag badge */}
            <span className="bd-tag-badge">{BLOG_TAG_LABELS[blog.tag]}</span>

            {/* Title */}
            <h1 className="bd-title">{blog.title}</h1>

            {/* Meta */}
            <div className="bd-meta">
              <div className="bd-meta__author">
                <div className="bd-meta__avatar">
                  {(blog.consultant?.fullName || "i").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="bd-meta__author-name">
                    {blog.consultant?.fullName || "iTour Editorial"}
                  </div>
                  <div className="bd-meta__date">{formatDate(blog.createdAt)}</div>
                </div>
              </div>
              <div className="bd-meta__stats">
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                  {blog.viewCount.toLocaleString()} lượt xem
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY: 7/3 LAYOUT ─────────────────────────────────── */}
        <div className="bd-body">

          {/* LEFT: Main content (70%) */}
          <article className="bd-main">
            {/* Summary callout */}
            {blog.summary && (
              <blockquote className="bd-summary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#0EA5E9" style={{ flexShrink: 0, marginTop: 2 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                <p>{blog.summary}</p>
              </blockquote>
            )}

            {/* Rich content */}
            <div
              ref={contentRef}
              className="bd-content"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {/* ── Social Share / CTA ────────────────────────────── */}
            <div className="bd-cta">
              <div className="bd-cta__text">
                <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#facc15"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                  Bạn đã sẵn sàng cho chuyến đi?
                </h2>
                <p>Khám phá ngay hàng trăm tour du lịch đang có ưu đãi cực khủng tại iTour!</p>
              </div>
              <Link href="/tours" className="bd-cta__btn">
                Xem tour ngay
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
              </Link>
            </div>

            {/* ── Social Share ──────────────────────────────────── */}
            <div className="bd-share">
              <span className="bd-share__label">Chia sẻ bài viết:</span>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noopener"
                className="bd-share__btn bd-share__btn--fb"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                Facebook
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="bd-share__btn bd-share__btn--copy"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Sao chép link
              </button>
            </div>

            {/* ── Related Blogs ─────────────────────────────────── */}
            {relatedBlogs.length > 0 && (
              <div className="related-blogs">
                <h3 className="related-blogs__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0EA5E9"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
                  Bài viết liên quan
                </h3>
                <div className="related-blogs__grid">
                  {relatedBlogs.map((rb) => (
                    <Link key={rb.id} href={`/blogs/${rb.slug}`} className="related-blog-card">
                      <img
                        src={rb.thumbnailUrl || ""}
                        alt={rb.title}
                        className="related-blog-card__img"
                      />
                      <div className="related-blog-card__body">
                        <h4 className="related-blog-card__title">{rb.title}</h4>
                        <span className="related-blog-card__date">{formatDate(rb.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* RIGHT: Sidebar (30%) */}
          <aside className="bd-sidebar">
            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="toc-widget">
                <h4 className="toc-widget__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#0EA5E9"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
                  Mục lục
                </h4>
                <nav className="toc-nav">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`toc-link toc-link--h${h.level} ${activeHeading === h.id ? "toc-link--active" : ""}`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Related Tours */}
            {relatedTours.length > 0 && (
              <div className="sidebar-widget">
                <h4 className="sidebar-widget__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#0EA5E9"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
                  Tour liên quan
                </h4>
                <div className="sidebar-widget__list">
                  {relatedTours.map((t) => (
                    <RelatedTourCard key={t.id} tour={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Sticky CTA */}
            <div className="sticky-cta">
              <div className="sticky-cta__icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
              </div>
              <h4>Cần tư vấn tour?</h4>
              <p>Đội ngũ chuyên gia iTour luôn sẵn sàng hỗ trợ bạn 24/7</p>
              <Link href="/tours" className="sticky-cta__btn">
                Xem tất cả tour
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />

      <style jsx>{`
        /* ── Shell ──────────────────────────────────────────── */
        .blog-detail {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        /* ── Hero ────────────────────────────────────────────── */
        .bd-hero {
          position: relative;
          height: 520px;
          overflow: hidden;
        }
        .bd-hero__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bd-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%);
        }
        .bd-hero__content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 40px 60px;
          max-width: 900px;
        }
        .bd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: rgba(255,255,255,0.7);
          margin-bottom: 12px;
        }
        :global(.bd-bc-link) {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: color 0.15s;
        }
        :global(.bd-bc-link:hover) { color: #fff; }
        .bd-bc-sep { color: rgba(255,255,255,0.4); }
        .bd-bc-current { color: rgba(255,255,255,0.5); }
        .bd-tag-badge {
          display: inline-block;
          padding: 4px 14px;
          background: rgba(14,165,233,0.25);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(14,165,233,0.4);
          color: #7dd3fc;
          border-radius: 100px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
        .bd-title {
          font-size: clamp(22px, 3.5vw, 38px);
          font-weight: 900;
          color: #fff;
          line-height: 1.2;
          margin: 0 0 16px;
          letter-spacing: -0.3px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .bd-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bd-meta__author {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bd-meta__avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0EA5E9, #6366f1);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255,255,255,0.5);
          flex-shrink: 0;
        }
        .bd-meta__author-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #fff;
        }
        .bd-meta__date {
          font-size: 11.5px;
          color: rgba(255,255,255,0.6);
          margin-top: 2px;
        }
        .bd-meta__stats {
          font-size: 12.5px;
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(6px);
          padding: 6px 14px;
          border-radius: 100px;
        }

        /* ── Body Layout ─────────────────────────────────────── */
        .bd-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px 80px;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 40px;
          align-items: start;
        }

        /* ── Main Article ────────────────────────────────────── */
        .bd-main {
          min-width: 0;
        }

        /* Summary callout */
        .bd-summary {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-left: 4px solid #0EA5E9;
          border-radius: 12px;
          padding: 20px 22px;
          margin: 0 0 32px;
        }
        .bd-summary span { font-size: 20px; flex-shrink: 0; }
        .bd-summary p {
          margin: 0;
          font-size: 15px;
          font-style: italic;
          color: #0369a1;
          line-height: 1.7;
          font-weight: 500;
        }

        /* Rich content */
        :global(.bd-content) {
          font-size: 16.5px;
          line-height: 1.85;
          color: #334155;
        }
        :global(.bd-content h2) {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 36px 0 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          scroll-margin-top: 80px;
        }
        :global(.bd-content h3) {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 28px 0 12px;
          scroll-margin-top: 80px;
        }
        :global(.bd-content p) {
          margin: 0 0 20px;
        }
        :global(.bd-content img) {
          width: 100%;
          border-radius: 12px;
          margin: 24px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        :global(.bd-content ul), :global(.bd-content ol) {
          padding-left: 24px;
          margin: 0 0 20px;
        }
        :global(.bd-content li) {
          margin-bottom: 8px;
          line-height: 1.7;
        }
        :global(.bd-content blockquote) {
          border-left: 4px solid #0EA5E9;
          background: #f0f9ff;
          padding: 16px 20px;
          border-radius: 8px;
          margin: 24px 0;
          color: #0369a1;
          font-style: italic;
        }

        /* CTA block */
        .bd-cta {
          background: linear-gradient(135deg, #0f172a, #1e3a5f);
          border-radius: 20px;
          padding: 36px 40px;
          margin: 48px 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .bd-cta__text h2 {
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 8px;
        }
        .bd-cta__text p {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          margin: 0;
          line-height: 1.5;
        }
        :global(.bd-cta__btn) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #0EA5E9, #6366f1);
          color: #fff;
          border-radius: 100px;
          font-size: 14.5px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(14,165,233,0.4);
          flex-shrink: 0;
        }
        :global(.bd-cta__btn:hover) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(14,165,233,0.5);
        }

        /* Share */
        .bd-share {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 0;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 40px;
        }
        .bd-share__label {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          margin-right: 4px;
        }
        .bd-share__btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 18px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          text-decoration: none;
        }
        .bd-share__btn--fb {
          background: #1877f2;
          color: #fff;
        }
        .bd-share__btn--fb:hover { background: #1565c0; }
        .bd-share__btn--copy {
          background: #f1f5f9;
          color: #475569;
        }
        .bd-share__btn--copy:hover { background: #e2e8f0; }

        /* Related Blogs */
        .related-blogs__title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 16px;
        }
        .related-blogs__grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        :global(.related-blog-card) {
          display: flex;
          gap: 14px;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          padding: 12px;
          transition: box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        :global(.related-blog-card:hover) { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
        .related-blog-card__img {
          width: 80px;
          height: 64px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .related-blog-card__body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          justify-content: center;
        }
        .related-blog-card__title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        .related-blog-card__date {
          font-size: 11px;
          color: #94a3b8;
        }

        /* ── Sidebar ─────────────────────────────────────────── */
        .bd-sidebar {
          position: sticky;
          top: 80px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* TOC */
        .toc-widget {
          background: #fff;
          border-radius: 16px;
          padding: 22px 22px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .toc-widget__title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 14px;
        }
        .toc-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .toc-link {
          display: block;
          padding: 6px 10px;
          font-size: 13px;
          color: #64748b;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.15s;
          font-weight: 500;
          border-left: 2px solid transparent;
        }
        .toc-link--h3 { padding-left: 22px; font-size: 12.5px; }
        .toc-link:hover { background: #f1f5f9; color: #0EA5E9; }
        .toc-link--active {
          color: #0EA5E9;
          background: #f0f9ff;
          border-left-color: #0EA5E9;
          font-weight: 700;
        }

        /* Sidebar widget */
        .sidebar-widget {
          background: #fff;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .sidebar-widget__title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 14px;
        }
        .sidebar-widget__list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Related Tour Card */
        :global(.related-tour-card) {
          display: flex;
          gap: 12px;
          background: #f8fafc;
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          padding: 10px;
          transition: background 0.15s;
        }
        :global(.related-tour-card:hover) { background: #f1f5f9; }
        .related-tour-card__img-wrap {
          width: 72px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .related-tour-card__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .related-tour-card__body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }
        .related-tour-card__name {
          font-size: 12.5px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.35;
        }
        .related-tour-card__meta {
          display: flex;
          flex-direction: column;
          gap: 1px;
          font-size: 11px;
          color: #94a3b8;
        }
        .related-tour-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }
        .related-tour-card__price {
          font-size: 12.5px;
          font-weight: 800;
          color: #0EA5E9;
        }
        .related-tour-card__cta {
          font-size: 11px;
          font-weight: 700;
          color: #6366f1;
          background: rgba(99,102,241,0.1);
          padding: 3px 8px;
          border-radius: 6px;
        }

        /* Sticky CTA */
        .sticky-cta {
          background: linear-gradient(135deg, #0EA5E9, #6366f1);
          border-radius: 16px;
          padding: 24px 22px;
          text-align: center;
          color: #fff;
        }
        .sticky-cta__icon { font-size: 32px; margin-bottom: 10px; }
        .sticky-cta h4 {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 6px;
          color: #fff;
        }
        .sticky-cta p {
          font-size: 12.5px;
          color: rgba(255,255,255,0.8);
          line-height: 1.5;
          margin: 0 0 16px;
        }
        :global(.sticky-cta__btn) {
          display: block;
          padding: 10px 20px;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          color: #fff;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.35);
          transition: all 0.15s;
        }
        :global(.sticky-cta__btn:hover) {
          background: rgba(255,255,255,0.3);
        }

        /* ── Skeleton ────────────────────────────────────────── */
        .blog-detail-skeleton { padding: 24px; max-width: 1200px; margin: 0 auto; }
        .skeleton-hero {
          height: 480px;
          border-radius: 20px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          margin-bottom: 32px;
        }
        .skeleton-body { display: grid; grid-template-columns: 1fr 340px; gap: 40px; }
        .skeleton-para {
          height: 14px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          margin-bottom: 12px;
        }
        .skeleton-widget {
          height: 180px;
          border-radius: 16px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          margin-bottom: 20px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Responsive ──────────────────────────────────────── */
        @media (max-width: 1024px) {
          .bd-body {
            grid-template-columns: 1fr;
          }
          .bd-sidebar {
            position: static;
          }
          .skeleton-body { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .bd-hero { height: 360px; }
          .bd-hero__content { padding: 24px 20px; }
          .bd-title { font-size: 20px; }
          .bd-cta { flex-direction: column; text-align: center; padding: 24px; }
          .bd-body { padding: 24px 16px 60px; }
        }
      `}</style>
    </>
  );
}
