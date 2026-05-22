import type {
  ApiResponse,
  PaginatedResponse,
  Course,
  CourseDetail,
  Enrollment,
  User,
  Review,
  QnaQuestion,
  Instructor,
  Lecture,
} from "@/types";

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

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  signup: (body: {
    name: string;
    nickname: string;
    email: string;
    password: string;
    role?: string;
    adminCode?: string;
  }) =>
    request<{ success: boolean; token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<ApiResponse<User>>("/auth/me"),
};

// ── Courses ───────────────────────────────────────────────────
export interface CourseQuery {
  level?: string;
  is_live?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const courseApi = {
  list: (query?: CourseQuery) => {
    const params = new URLSearchParams();
    if (query?.level) params.set("level", query.level);
    if (query?.is_live != null) params.set("is_live", String(query.is_live));
    if (query?.search) params.set("search", query.search);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return request<PaginatedResponse<Course>>(`/courses${qs ? `?${qs}` : ""}`);
  },
  detail: (id: number) => request<ApiResponse<CourseDetail>>(`/courses/${id}`),
};

// ── Enrollments ───────────────────────────────────────────────
export const enrollmentApi = {
  enroll: (courseId: number) =>
    request<ApiResponse<{ enrollmentId: number }>>(`/enrollments/${courseId}`, {
      method: "POST",
    }),
  myList: () => request<ApiResponse<Enrollment[]>>("/enrollments"),
  toggleWishlist: (courseId: number) =>
    request<ApiResponse<{ wishlisted: boolean }>>(
      `/enrollments/${courseId}/wishlist`,
      { method: "POST" },
    ),
  cancel: (courseId: number) =>
    request<ApiResponse<null>>(`/enrollments/${courseId}`, {
      method: "DELETE",
    }),
};

// ── Progress ──────────────────────────────────────────────────
export interface ProgressItem {
  lecture_id: number;
  watched_sec: number;
  is_completed: 0 | 1;
  last_watched: string;
}

export const progressApi = {
  save: (lectureId: number, watched_sec: number, is_completed = false) =>
    request<{ success: boolean }>(`/progress/${lectureId}`, {
      method: "POST",
      body: JSON.stringify({ watched_sec, is_completed }),
    }),
  myProgress: () =>
    request<{ success: boolean; data: ProgressItem[] }>("/progress"),
};

// ── Reviews ───────────────────────────────────────────────────
export const reviewApi = {
  list: (courseId: number, page = 1) =>
    request<{
      success: boolean;
      data: Review[];
      pagination: { total: number; page: number; limit: number };
    }>(`/courses/${courseId}/reviews?page=${page}`),
  create: (courseId: number, body: { rating: number; content: string }) =>
    request<ApiResponse<Review>>(`/courses/${courseId}/reviews`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (courseId: number, reviewId: number) =>
    request<ApiResponse<null>>(`/courses/${courseId}/reviews/${reviewId}`, {
      method: "DELETE",
    }),
};

// ── Q&A ───────────────────────────────────────────────────────
export const qnaApi = {
  list: (courseId: number) =>
    request<ApiResponse<QnaQuestion[]>>(`/courses/${courseId}/qna`),
  createQuestion: (courseId: number, content: string) =>
    request<ApiResponse<QnaQuestion>>(`/courses/${courseId}/qna`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  createAnswer: (courseId: number, questionId: number, content: string) =>
    request<
      ApiResponse<{
        id: number;
        content: string;
        created_at: string;
        author_nickname: string;
        role: string;
      }>
    >(`/courses/${courseId}/qna/${questionId}/answers`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

// ── Instructors ───────────────────────────────────────────────
export const instructorApi = {
  list: () => request<ApiResponse<Instructor[]>>("/instructors"),
  detail: (id: number) =>
    request<ApiResponse<Instructor & { courses: Course[] }>>(
      `/instructors/${id}`,
    ),
};

// ── Wishlist ──────────────────────────────────────────────────
export const wishlistApi = {
  list: () => request<ApiResponse<Course[]>>("/wishlist"),
};

// ── Instructor Course Management ──────────────────────────────
export interface InstructorCourse {
  id: number;
  title: string;
  level: string;
  price: number;
  is_live: 0 | 1;
  is_published: 0 | 1;
  duration_weeks: number | null;
  thumbnail_url: string | null;
  lecture_count: number;
  total_hours: number;
  enrollment_count: number;
  avg_rating: number | null;
  review_count: number;
  created_at: string;
}

export interface LectureForm {
  week: number;
  title: string;
  duration_sec: number;
  is_preview: boolean;
  video_url: string;
}

export const instructorCourseApi = {
  list: () => request<ApiResponse<InstructorCourse[]>>("/instructor/courses"),

  create: (body: {
    title: string;
    description: string;
    level: string;
    price: number;
    is_live: boolean;
    duration_weeks?: number;
    thumbnail_url?: string;
  }) =>
    request<ApiResponse<{ id: number }>>("/instructor/courses", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (courseId: number, body: object) =>
    request<ApiResponse<null>>(`/instructor/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (courseId: number) =>
    request<ApiResponse<null>>(`/instructor/courses/${courseId}`, {
      method: "DELETE",
    }),

  togglePublish: (courseId: number) =>
    request<ApiResponse<{ is_published: number }>>(
      `/instructor/courses/${courseId}/publish`,
      { method: "PATCH" },
    ),

  getLectures: (courseId: number) =>
    request<ApiResponse<Lecture[]>>(`/instructor/courses/${courseId}/lectures`),

  addLecture: (courseId: number, body: LectureForm) =>
    request<ApiResponse<{ id: number }>>(
      `/instructor/courses/${courseId}/lectures`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  updateLecture: (courseId: number, lectureId: number, body: LectureForm) =>
    request<ApiResponse<null>>(
      `/instructor/courses/${courseId}/lectures/${lectureId}`,
      { method: "PUT", body: JSON.stringify(body) },
    ),

  deleteLecture: (courseId: number, lectureId: number) =>
    request<ApiResponse<null>>(
      `/instructor/courses/${courseId}/lectures/${lectureId}`,
      { method: "DELETE" },
    ),

  getProfile: () =>
    request<
      ApiResponse<{ name: string; bio: string; avatar_url: string | null }>
    >("/instructor/courses/profile"),

  updateProfile: (body: { name: string; bio: string; avatar_url: string }) =>
    request<ApiResponse<null>>("/instructor/courses/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// ── User Profile ──────────────────────────────────────────────
export const userApi = {
  getProfile: () =>
    request<
      ApiResponse<{ name: string; nickname: string; avatar_url: string | null }>
    >("/user/profile"),

  updateProfile: (body: { nickname: string; avatar_url: string }) =>
    request<ApiResponse<null>>("/user/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// ── Upload ────────────────────────────────────────────────────
export const uploadApi = {
  // 썸네일 - 배경 제거 없이 그냥 업로드
  thumbnail: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/upload/thumbnail`, {
      method: "POST",
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "업로드 실패");
    return json.data.url as string;
  },

  // ✅ 프로필 사진 - 배경 제거 후 업로드
  avatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/upload/avatar`, {
      method: "POST",
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "업로드 실패");
    return json.data.url as string;
  },
};

// ── Payment ───────────────────────────────────────────────────
export interface PaymentOrder {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
}

export const paymentApi = {
  prepare: (courseId: number) =>
    request<ApiResponse<PaymentOrder>>(`/payment/prepare/${courseId}`, {
      method: "POST",
    }),

  confirm: (body: { paymentKey: string; orderId: string; amount: number }) =>
    request<
      ApiResponse<{
        paymentKey: string;
        orderId: string;
        amount: number;
        method: string;
      }>
    >("/payment/confirm", { method: "POST", body: JSON.stringify(body) }),

  cancel: (courseId: number, cancelReason?: string) =>
    request<ApiResponse<null>>(`/payment/cancel/${courseId}`, {
      method: "POST",
      body: JSON.stringify({ cancelReason }),
    }),

  myPayments: () =>
    request<
      ApiResponse<
        {
          order_id: string;
          amount: number;
          status: string;
          paid_at: string;
          course_title: string;
          course_id: number;
        }[]
      >
    >("/payment"),
};

// ── Notifications ─────────────────────────────────────────────
export interface Notification {
  id: number;
  type: "course_deleted" | "refund" | "qna_answer" | "announcement";
  title: string;
  message: string;
  link: string | null;
  is_read: 0 | 1;
  created_at: string;
}

export const notificationApi = {
  list: () =>
    request<ApiResponse<Notification[]> & { unreadCount: number }>("/notifications"),

  markAsRead: (id: number) =>
    request<ApiResponse<null>>(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllAsRead: () =>
    request<ApiResponse<null>>("/notifications/read-all", { method: "PATCH" }),
};
