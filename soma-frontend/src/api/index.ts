import type { ApiResponse, PaginatedResponse, Course, CourseDetail, Enrollment, User } from "@/types";

const BASE = "/api";

const getToken = (): string | null => localStorage.getItem("soma_token");

const headers = (): HeadersInit => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "오류가 발생했습니다.");
  return json as T;
}

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  signup: (body: { name: string; nickname: string; email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User; message?: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User; message?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  me: () => request<ApiResponse<User>>("/auth/me"),
};

// ── Courses ───────────────────────────────────────────────────
export interface CourseQuery {
  level?:       string;
  is_live?:     boolean;
  search?:      string;
  page?:        number;
  limit?:       number;
}

export const courseApi = {
  list: (query?: CourseQuery) => {
    const params = new URLSearchParams();
    if (query?.level)            params.set("level",   query.level);
    if (query?.is_live != null)  params.set("is_live", String(query.is_live));
    if (query?.search)           params.set("search",  query.search);
    if (query?.page)             params.set("page",    String(query.page));
    if (query?.limit)            params.set("limit",   String(query.limit));
    const qs = params.toString();
    return request<PaginatedResponse<Course>>(`/courses${qs ? `?${qs}` : ""}`);
  },

  detail: (id: number) => request<ApiResponse<CourseDetail>>(`/courses/${id}`),
};

// ── Enrollments ───────────────────────────────────────────────
export const enrollmentApi = {
  enroll: (courseId: number) =>
    request<ApiResponse<{ enrollmentId: number }>>(`/enrollments/${courseId}`, { method: "POST" }),

  myList: () => request<ApiResponse<Enrollment[]>>("/enrollments"),

  toggleWishlist: (courseId: number) =>
    request<ApiResponse<{ wishlisted: boolean }>>(`/enrollments/${courseId}/wishlist`, { method: "POST" }),
};
