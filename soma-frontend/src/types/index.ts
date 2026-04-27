// ── 사용자 ────────────────────────────────────────────────────
export interface User {
  id:         number;
  name:       string;
  nickname:   string;
  email:      string;
  role?:      "user" | "instructor" | "admin";
  avatar_url?: string | null;
}

// ── 강의 ──────────────────────────────────────────────────────
export type Level = "입문" | "중급" | "심화";

export interface Course {
  id:               number;
  title:            string;
  description:      string;
  level:            Level;
  duration_weeks:   number | null;
  lecture_count:    number;
  total_hours:      number;
  price:            number;
  is_live:          0 | 1;
  thumbnail_url:    string | null;
  instructor_name:  string;
  category:         string;
  avg_rating:       number | null;
  enrollment_count: number;
}

export interface Lecture {
  id:           number;
  week:         number;
  sort_order:   number;
  title:        string;
  duration_sec: number;
  is_preview:   0 | 1;
  video_url?:   string | null;
}

export interface Review {
  id: number;
  reviewer_nickname: string;
  reviewer_avatar?: string | null;
  rating: number;
  content: string;
  created_at: string;
}

export interface QnaAnswer {
  id:               number;
  content:          string;
  created_at:       string;
  author_nickname:  string;
  role:             string;
}

export interface QnaQuestion {
  id:               number;
  content:          string;
  created_at:       string;
  author_nickname:  string;
  user_id:          number;
  answer_count:     number;
  answers:          QnaAnswer[];
}

export interface Instructor {
  id:             number;
  name:           string;
  bio:            string;
  avatar_url:     string | null;
  certifications: string | null;
  course_count:   number;
  student_count:  number;
  avg_rating:     number | null;
}

export interface CourseDetail extends Course {
  instructor_id?:    number;
  instructor_bio:    string;
  instructor_avatar: string | null;
  review_count:      number;
  curriculum:        Record<number, Lecture[]>;
  reviews:           Review[];
  isEnrolled:        boolean;
  isWishlisted:      boolean;
}

// ── 수강 신청 ─────────────────────────────────────────────────
export interface Enrollment {
  enrollment_id:      number;
  course_id:          number;
  title:              string;
  instructor_name:    string;
  enrolled_at:        string;
  lecture_count:      number;
  completed_lectures: number;
  progress_rate:      number;
  thumbnail_url:      string | null;
  level:              Level;
}

// ── API 응답 공통 래퍼 ─────────────────────────────────────────
export interface ApiResponse<T> {
  success:  boolean;
  data?:    T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data:    T[];
  pagination: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
}

// ── 페이지 라우터용 ────────────────────────────────────────────
export type PageKey = "home" | "courses" | "auth" | "detail" | "my" | "player" | "wishlist" | "instructor" | "instructor-profile" | "student-profile" | "admin" | "payment" | "payment-success" | "payment-fail";
