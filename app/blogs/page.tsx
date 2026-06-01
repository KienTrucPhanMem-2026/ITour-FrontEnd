"use client";

import { useState, useEffect, useMemo, CSSProperties } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getPublishedBlogsAPI,
  getTrendingBlogsAPI,
  type BlogDTO,
  type BlogTag,
  BLOG_TAGS,
  BLOG_TAG_LABELS,
  BLOG_TAG_COLORS,
} from "@/lib/api/blogs";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatViews(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ width: "40%", height: 20, borderRadius: 100, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 18, borderRadius: 6, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ width: "70%", height: 18, borderRadius: 6, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ height: 12, borderRadius: 6, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginTop: 4 }} />
        <div style={{ width: "60%", height: 12, borderRadius: 6, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
        <div style={{ width: "50%", height: 24, borderRadius: 100, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginTop: 8 }} />
      </div>
    </div>
  );
}

// ── Hero Post ─────────────────────────────────────────────────────────────────
function HeroPost({ blog }: { blog: BlogDTO }) {
  const [hovered, setHovered] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);
  const color = BLOG_TAG_COLORS[blog.tag] ?? BLOG_TAG_COLORS.TRAVEL_TIPS;

  return (
    <Link
      href={`/blogs/${blog.slug}`}
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 3fr",
        borderRadius: 24,
        overflow: "hidden",
        background: "#fff",
        boxShadow: hovered
          ? "0 20px 60px rgba(0,0,0,0.14)"
          : "0 8px 40px rgba(0,0,0,0.07)",
        marginBottom: 32,
        textDecoration: "none",
        transition: "box-shadow 0.3s, transform 0.3s",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image side */}
      <div style={{ position: "relative", overflow: "hidden", aspectRatio: "4/3", maxHeight: 380 }}>
        <img
          src={blog.thumbnailUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80"}
          alt={blog.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s ease",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.18) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        {/* Glass tag */}
        <span style={{
          position: "absolute",
          top: 20,
          left: 20,
          padding: "6px 16px",
          borderRadius: 100,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.5px",
          background: "rgba(255,255,255,0.2)",
          color: "#ffffff",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.45)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}>
          {BLOG_TAG_LABELS[blog.tag]}
        </span>
      </div>

      {/* Content side */}
      <div style={{
        padding: "48px 44px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 0,
      }}>
        {/* Meta info row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
          flexWrap: "wrap",
        }}>
          {/* Author avatar */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0EA5E9, #6366f1)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {(blog.consultant?.fullName || "i").charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>
            {blog.consultant?.fullName || "iTour Editorial"}
          </span>
          <span style={{ color: "#d1d5db", fontSize: 14 }}>·</span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>{formatDate(blog.createdAt)}</span>
          <span style={{ color: "#d1d5db", fontSize: 14 }}>·</span>
          <span style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
            {formatViews(blog.viewCount)} lượt xem
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(22px, 2.5vw, 32px)",
          fontWeight: 800,
          color: "#111827",
          lineHeight: 1.35,
          margin: "0 0 16px",
          letterSpacing: "-0.4px",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } as CSSProperties}>
          {blog.title}
        </h1>

        {/* Summary */}
        <p style={{
          fontSize: 15,
          color: "#6b7280",
          lineHeight: 1.75,
          margin: "0 0 28px",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } as CSSProperties}>
          {blog.summary}
        </p>

        {/* CTA Button */}
        <span
          onMouseEnter={() => setCtaHovered(true)}
          onMouseLeave={() => setCtaHovered(false)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 28px",
            background: "linear-gradient(135deg, #0EA5E9, #6366f1)",
            color: "#fff",
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 700,
            alignSelf: "flex-start",
            transition: "all 0.25s",
            boxShadow: ctaHovered
              ? "0 8px 24px rgba(14,165,233,0.5)"
              : "0 4px 16px rgba(14,165,233,0.35)",
            transform: ctaHovered ? "translateX(4px)" : "translateX(0)",
            cursor: "pointer",
          }}
        >
          Đọc ngay
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: "transform 0.25s", transform: ctaHovered ? "translateX(3px)" : "translateX(0)" }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

// ── Blog Card ─────────────────────────────────────────────────────────────────
function BlogCard({ blog }: { blog: BlogDTO }) {
  const [hovered, setHovered] = useState(false);
  const color = BLOG_TAG_COLORS[blog.tag] ?? BLOG_TAG_COLORS.TRAVEL_TIPS;

  return (
    <Link
      href={`/blogs/${blog.slug}`}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,0,0,0.13)"
          : "0 2px 12px rgba(0,0,0,0.06)",
        textDecoration: "none",
        transition: "box-shadow 0.25s, transform 0.25s",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", flexShrink: 0 }}>
        <img
          src={blog.thumbnailUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80"}
          alt={blog.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
            transform: hovered ? "scale(1.07)" : "scale(1)",
          }}
        />
        {/* Tag floating on image */}
        <span style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "5px 12px",
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.4px",
          background: color.bg,
          color: color.text,
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}>
          {BLOG_TAG_LABELS[blog.tag]}
        </span>
      </div>

      {/* Body */}
      <div style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        gap: 0,
      }}>
        {/* Title */}
        <h3 style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1.45,
          margin: "0 0 10px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } as CSSProperties}>
          {blog.title}
        </h3>

        {/* Summary */}
        <p style={{
          fontSize: 13.5,
          color: "#6b7280",
          lineHeight: 1.65,
          margin: "0 0 16px",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          flex: 1,
        } as CSSProperties}>
          {blog.summary}
        </p>

        {/* Footer: author left, stats right */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 14,
          borderTop: "1px solid #f1f5f9",
          marginTop: "auto",
          gap: 8,
        }}>
          {/* Author */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0EA5E9, #6366f1)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {(blog.consultant?.fullName || "i").charAt(0).toUpperCase()}
            </div>
            <span style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "#374151",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 100,
            }}>
              {blog.consultant?.fullName || "iTour Editorial"}
            </span>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11.5,
            color: "#9ca3af",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            <span>{formatDate(blog.createdAt)}</span>
            <span style={{ color: "#e5e7eb" }}>·</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#9ca3af">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
              </svg>
              {formatViews(blog.viewCount)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BlogsPage() {
  const [allBlogs, setAllBlogs] = useState<BlogDTO[]>([]);
  const [trending, setTrending] = useState<BlogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<BlogTag>("ALL");

  useEffect(() => {
    Promise.all([getPublishedBlogsAPI(), getTrendingBlogsAPI()])
      .then(([published, trend]) => {
        setAllBlogs(published);
        setTrending(trend.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  const heroBlog = useMemo(() => {
    if (allBlogs.length === 0) return null;
    return [...allBlogs].sort((a, b) => b.viewCount - a.viewCount)[0];
  }, [allBlogs]);

  const filteredBlogs = useMemo(() => {
    let blogs = activeTag === "ALL"
      ? allBlogs
      : allBlogs.filter((b) => b.tag === activeTag);
    if (heroBlog) blogs = blogs.filter((b) => b.id !== heroBlog.id);
    return blogs;
  }, [allBlogs, activeTag, heroBlog]);

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

        {/* ── BREADCRUMB ── */}
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 24px 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "#94a3b8",
        }}>
          <Link href="/" style={{ color: "#0EA5E9", textDecoration: "none" }}>Trang chủ</Link>
          <span style={{ color: "#cbd5e1" }}>›</span>
          <span style={{ color: "#475569", fontWeight: 600 }}>Cẩm nang du lịch</span>
        </div>

        {/* ── PAGE HEADER ── */}
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 24px 40px",
          textAlign: "center",
        }}>
          <h1 style={{
            fontSize: "clamp(28px,5vw,48px)",
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.15,
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
          }}>
            Khám phá thế giới<br />
            <span style={{
              background: "linear-gradient(135deg,#0EA5E9,#6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            } as CSSProperties}>
              cùng iTour
            </span>
          </h1>
          <p style={{
            fontSize: 16,
            color: "#64748b",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.6,
          }}>
            Kinh nghiệm du lịch thực tế, ưu đãi hấp dẫn và hành trình ẩm thực bất tận
          </p>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>

          {/* ── HERO POST ── */}
          {loading ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderRadius: 24,
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
              marginBottom: 32,
              minHeight: 420,
            }}>
              <div style={{
                width: "100%",
                background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
              }} />
              <div style={{ padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
                <div style={{ width: "30%", height: 14, borderRadius: 6, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                <div style={{ height: 32, borderRadius: 8, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                <div style={{ width: "80%", height: 32, borderRadius: 8, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                <div style={{ height: 14, borderRadius: 6, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
                <div style={{ width: "85%", height: 14, borderRadius: 6, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
              </div>
            </div>
          ) : heroBlog ? (
            <HeroPost blog={heroBlog} />
          ) : null}

          {/* ── TRENDING STRIP ── */}
          {!loading && trending.length > 0 && (
            <div style={{
              background: "#fff",
              borderRadius: 16,
              padding: "18px 24px",
              marginBottom: 32,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}>
              <div style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#ea580c",
                whiteSpace: "nowrap",
                background: "rgba(245,101,65,0.08)",
                padding: "6px 14px",
                borderRadius: 100,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ea580c">
                  <path d="M13.5 2c0 0-7.5 9-7.5 13.5a7.5 7.5 0 0 0 15 0C21 11 13.5 2 13.5 2zm0 17a5 5 0 0 1-5-5c0-2.5 3-7.5 5-10.5C15.5 6.5 18.5 9.5 18.5 14a5 5 0 0 1-5 5z"/>
                </svg>
                Đang hot
              </div>
              <div style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                flex: 1,
                scrollbarWidth: "none",
              }}>
                {trending.map((b) => (
                  <TrendingItem key={b.id} b={b} />
                ))}
              </div>
            </div>
          )}

          {/* ── CATEGORY FILTER TABS ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {BLOG_TAGS.map((tag) => (
              <CategoryTab
                key={tag}
                tag={tag}
                active={activeTag === tag}
                count={filteredBlogs.length + (heroBlog && activeTag === "ALL" && tag === "ALL" ? 1 : 0)}
                onClick={() => setActiveTag(tag)}
              />
            ))}
          </div>

          {/* ── BLOG GRID ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : filteredBlogs.length === 0
                ? (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
                    <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>📭</span>
                    <p style={{ fontSize: 15 }}>Chưa có bài viết nào trong chủ đề này.</p>
                  </div>
                )
                : filteredBlogs.map((blog) => <BlogCard key={blog.id} blog={blog} />)
            }
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        * { box-sizing: border-box; }
      `}</style>
    </>
  );
}

// ── Trending Item (extracted for hover state) ─────────────────────────────────
function TrendingItem({ b }: { b: BlogDTO }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      key={b.id}
      href={`/blogs/${b.slug}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 240,
        background: hovered ? "#f1f5f9" : "#f8fafc",
        borderRadius: 12,
        padding: "10px 14px",
        textDecoration: "none",
        transition: "background 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={b.thumbnailUrl || ""}
        alt={b.title}
        style={{
          width: 52,
          height: 52,
          borderRadius: 8,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
        <span style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "#1e293b",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          lineHeight: 1.4,
        } as CSSProperties}>
          {b.title}
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#94a3b8">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
          </svg>
          {formatViews(b.viewCount)}
        </span>
      </div>
    </Link>
  );
}

// ── Category Tab (extracted for hover state) ──────────────────────────────────
function CategoryTab({ tag, active, count, onClick }: {
  tag: BlogTag;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = BLOG_TAG_COLORS[tag];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "9px 20px",
        borderRadius: 100,
        fontSize: 13.5,
        fontWeight: active ? 700 : 600,
        border: active ? `1.5px solid ${color.text}` : "1.5px solid #e2e8f0",
        background: active ? color.bg : hovered ? "rgba(14,165,233,0.05)" : "#fff",
        color: active ? color.text : hovered ? "#0EA5E9" : "#64748b",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: 6,
        boxShadow: active ? "0 2px 10px rgba(0,0,0,0.08)" : "none",
        borderColor: active ? color.text : hovered ? "#0EA5E9" : "#e2e8f0",
      }}
    >
      {BLOG_TAG_LABELS[tag]}
      {active && (
        <span style={{
          background: "rgba(255,255,255,0.8)",
          borderRadius: 100,
          padding: "1px 7px",
          fontSize: 11,
          fontWeight: 700,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
