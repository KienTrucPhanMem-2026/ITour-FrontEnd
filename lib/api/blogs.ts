// ============================================================
// Blogs API
// ============================================================
import axiosClient from "./axiosClient";

export type BlogStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
export type BlogTag = "ALL" | "TRAVEL_TIPS" | "PROMOTIONS" | "FOOD_CULTURE";

export interface BlogDTO {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  thumbnailUrl?: string;
  content?: string;
  status: BlogStatus;
  tag: BlogTag;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  consultant?: {
    id: string;
    fullName: string;
    userName: string;
    avatarUrl?: string;
  };
  reviews?: Array<{
    id: string;
    tourRating?: number;
    tourComment?: string;
    createdAt: string;
    customer?: { fullName: string; avatarUrl?: string };
  }>;
}

/** GET /api/blogs/published */
export async function getPublishedBlogsAPI(): Promise<BlogDTO[]> {
  const res = await axiosClient.get<BlogDTO[]>("/blogs/published");
  return res.data;
}

/** GET /api/blogs/trending */
export async function getTrendingBlogsAPI(): Promise<BlogDTO[]> {
  const res = await axiosClient.get<BlogDTO[]>("/blogs/trending");
  return res.data;
}

/** GET /api/blogs/tag/:tag */
export async function getBlogsByTagAPI(tag: BlogTag): Promise<BlogDTO[]> {
  if (tag === "ALL") return getPublishedBlogsAPI();
  const res = await axiosClient.get<BlogDTO[]>(`/blogs/tag/${tag}`);
  return res.data;
}

/** GET /api/blogs/slug/:slug (also increments view count on server) */
export async function getBlogBySlugAPI(slug: string): Promise<BlogDTO> {
  const res = await axiosClient.get<BlogDTO>(`/blogs/slug/${slug}`);
  return res.data;
}

/** GET /api/blogs/:id */
export async function getBlogByIdAPI(id: string): Promise<BlogDTO> {
  const res = await axiosClient.get<BlogDTO>(`/blogs/${id}`);
  return res.data;
}

// ── Labels for UI ────────────────────────────────────────────────────────────
export const BLOG_TAG_LABELS: Record<BlogTag, string> = {
  ALL: "Tất cả",
  TRAVEL_TIPS: "Kinh nghiệm du lịch",
  PROMOTIONS: "Khuyến mãi",
  FOOD_CULTURE: "Khám phá ẩm thực",
};

export const BLOG_TAG_COLORS: Record<BlogTag, { bg: string; text: string }> = {
  ALL: { bg: "rgba(14,165,233,0.18)", text: "#0EA5E9" },
  TRAVEL_TIPS: { bg: "rgba(16,185,129,0.18)", text: "#059669" },
  PROMOTIONS: { bg: "rgba(245,101,65,0.18)", text: "#ea580c" },
  FOOD_CULTURE: { bg: "rgba(168,85,247,0.18)", text: "#9333ea" },
};

export const BLOG_TAGS: BlogTag[] = [
  "ALL",
  "TRAVEL_TIPS",
  "PROMOTIONS",
  "FOOD_CULTURE",
];
