import { useState, useEffect } from "react";
import type { CourseDetail as ICourseDetail, PageKey } from "@/types";
import { courseApi, enrollmentApi } from "@/api";
import Footer from "@/components/Footer";

interface DetailProps {
  goTo:      (page: PageKey) => void;
  courseId:  number;
  loggedIn:  boolean;
}

const MOCK_LIST: ICourseDetail[] = [
  {
    id: 1, title: "아침을 여는 하타 요가", description: "하루를 상쾌하게 시작하는 30분 루틴.",
    level: "입문", duration_weeks: 4, lecture_count: 32, total_hours: 16,
    price: 89000, is_live: 1, thumbnail_url: null,
    instructor_name: "김소라", instructor_bio: "인도 리시케시에서 요가를 수련한 뒤, 10년간 5,000명 이상의 수강생을 가르쳐온 강사입니다.",
    instructor_avatar: null, category: "입문", avg_rating: 4.9,
    review_count: 847, enrollment_count: 3247,
    curriculum: {
      1: [{ id:1, week:1, sort_order:1, title:"오리엔테이션 · 요가 매트와 준비물", duration_sec:480, is_preview:1 },
          { id:2, week:1, sort_order:2, title:"산 자세 (타다사나)와 호흡",          duration_sec:1320, is_preview:1 }],
    },
    reviews: [{ id:1, reviewer_nickname:"박지은", rating:5, content:"강사님이 너무 친절해요!", created_at:"2025-03-10" }],
    isEnrolled: false, isWishlisted: false,
  },
  {
    id: 2, title: "파워 빈야사 플로우", description: "전신 근력을 키우는 역동적인 과정.",
    level: "중급", duration_weeks: 8, lecture_count: 56, total_hours: 28,
    price: 119000, is_live: 0, thumbnail_url: null,
    instructor_name: "김소라", instructor_bio: "인도 리시케시에서 요가를 수련한 뒤, 10년간 5,000명 이상의 수강생을 가르쳐온 강사입니다.",
    instructor_avatar: null, category: "중급", avg_rating: 4.8,
    review_count: 312, enrollment_count: 1800,
    curriculum: { 1: [{ id:10, week:1, sort_order:1, title:"빈야사 기초 흐름", duration_sec:1800, is_preview:1 }] },
    reviews: [{ id:10, reviewer_nickname:"이민준", rating:5, content:"체력이 확실히 늘었어요.", created_at:"2025-02-28" }],
    isEnrolled: false, isWishlisted: false,
  },
  {
    id: 3, title: "숙면을 위한 인 요가", description: "하루의 긴장을 풀어주는 저녁 루틴.",
    level: "입문", duration_weeks: null, lecture_count: 24, total_hours: 12,
    price: 69000, is_live: 0, thumbnail_url: null,
    instructor_name: "이지현", instructor_bio: "10년 경력의 인 요가 전문 강사입니다.",
    instructor_avatar: null, category: "입문", avg_rating: 5.0,
    review_count: 520, enrollment_count: 2500,
    curriculum: { 1: [{ id:20, week:1, sort_order:1, title:"인 요가 기초 자세", duration_sec:1200, is_preview:1 }] },
    reviews: [{ id:20, reviewer_nickname:"정수아", rating:5, content:"잠이 정말 잘 와요.", created_at:"2025-01-15" }],
    isEnrolled: false, isWishlisted: false,
  },
  {
    id: 4, title: "선라이즈 명상 호흡", description: "아침을 깨우는 호흡과 명상 루틴.",
    level: "입문", duration_weeks: 3, lecture_count: 18, total_hours: 9,
    price: 59000, is_live: 0, thumbnail_url: null,
    instructor_name: "박민지", instructor_bio: "명상 지도사 자격을 보유한 호흡 전문 강사입니다.",
    instructor_avatar: null, category: "입문", avg_rating: 4.7,
    review_count: 198, enrollment_count: 940,
    curriculum: { 1: [{ id:30, week:1, sort_order:1, title:"복식 호흡 기초", duration_sec:900, is_preview:1 }] },
    reviews: [{ id:30, reviewer_nickname:"김태희", rating:5, content:"아침이 달라졌어요.", created_at:"2025-03-01" }],
    isEnrolled: false, isWishlisted: false,
  },
  {
    id: 5, title: "아쉬탕가 심화 수련", description: "전통 아쉬탕가 시리즈를 완성하는 과정.",
    level: "심화", duration_weeks: 10, lecture_count: 40, total_hours: 20,
    price: 149000, is_live: 1, thumbnail_url: null,
    instructor_name: "김소라", instructor_bio: "인도 리시케시에서 요가를 수련한 뒤, 10년간 5,000명 이상의 수강생을 가르쳐온 강사입니다.",
    instructor_avatar: null, category: "심화", avg_rating: 4.9,
    review_count: 134, enrollment_count: 620,
    curriculum: { 1: [{ id:40, week:1, sort_order:1, title:"아쉬탕가 1차 시리즈 개요", duration_sec:2400, is_preview:1 }] },
    reviews: [{ id:40, reviewer_nickname:"최준혁", rating:5, content:"수련의 깊이가 달라졌습니다.", created_at:"2025-02-10" }],
    isEnrolled: false, isWishlisted: false,
  },
  {
    id: 6, title: "코어 & 밸런스 필라테스", description: "코어 근육을 강화하는 필라테스 과정.",
    level: "중급", duration_weeks: 6, lecture_count: 36, total_hours: 18,
    price: 99000, is_live: 0, thumbnail_url: null,
    instructor_name: "정수현", instructor_bio: "필라테스 전문 강사로 코어 트레이닝을 전문으로 합니다.",
    instructor_avatar: null, category: "중급", avg_rating: 4.8,
    review_count: 267, enrollment_count: 1100,
    curriculum: { 1: [{ id:50, week:1, sort_order:1, title:"코어 활성화 기초", duration_sec:1500, is_preview:1 }] },
    reviews: [{ id:50, reviewer_nickname:"윤서연", rating:5, content:"자세가 교정됐어요.", created_at:"2025-01-20" }],
    isEnrolled: false, isWishlisted: false,
  },
];

const getMock = (id: number): ICourseDetail =>
  MOCK_LIST.find((m) => m.id === id) ?? MOCK_LIST[0];

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}분`;
}

export default function CourseDetail({ goTo, courseId, loggedIn }: DetailProps) {
  const [course, setCourse]       = useState<ICourseDetail>(() => getMock(courseId));
  const [loading, setLoading]     = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setCourse(getMock(courseId));
    (async () => {
      setLoading(true);
      try {
        const res = await courseApi.detail(courseId);
        if (res.data) { setCourse(res.data); setWishlisted(res.data.isWishlisted); }
      } catch {
        /* fallback to MOCK */
      } finally { setLoading(false); }
    })();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!loggedIn) { if (window.confirm("로그인이 필요합니다. 이동할까요?")) goTo("auth"); return; }
    setEnrolling(true);
    try {
      await enrollmentApi.enroll(course.id);
      alert("✅ 수강 신청이 완료되었습니다!");
      setCourse((p) => ({ ...p, isEnrolled: true }));
    } catch (e) { alert((e as Error).message); }
    finally { setEnrolling(false); }
  };

  const handleWishlist = async () => {
    if (!loggedIn) { if (window.confirm("로그인이 필요합니다. 이동할까요?")) goTo("auth"); return; }
    try {
      const res = await enrollmentApi.toggleWishlist(course.id);
      if (res.data) setWishlisted(res.data.wishlisted);
    } catch (e) { alert((e as Error).message); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 120, color: "var(--mid)" }}>불러오는 중...</div>;

  return (
    <div style={{ paddingTop: 80 }}>
      {/* Hero */}
      <div style={{ background: "var(--dark)", padding: "56px 80px", display: "grid", gridTemplateColumns: "1fr 390px", gap: 72, alignItems: "start" }}>
        <div>
          <div style={S.bread}>
            <span onClick={() => goTo("home")}>홈</span> ›
            <span onClick={() => goTo("courses")}>강의</span> ›
            <span style={{ color: "rgba(245,240,232,0.6)" }}>{course.title}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span style={tagStyle(course.level)}>{course.level}</span>
            {course.is_live === 1 && <span style={tagStyle("라이브")}>LIVE</span>}
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,3.5vw,48px)", fontWeight: 300, color: "var(--cream)", lineHeight: 1.1, marginBottom: 14 }}>
            {course.title.split(" ").slice(0, -1).join(" ")}<br />
            <em style={{ fontStyle: "italic", color: "var(--sand)" }}>{course.title.split(" ").slice(-1)}</em>
          </h1>
          <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 14, color: "rgba(245,240,232,0.55)", fontWeight: 300, lineHeight: 1.8, marginBottom: 22 }}>{course.description}</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[`⭐ ${course.avg_rating} (${course.review_count}개)`, `👥 ${course.enrollment_count.toLocaleString()}명`, `📹 ${course.lecture_count}강`, `⏱ ${course.total_hours}시간`].map((s) => (
              <div key={s} style={{ fontSize: 13, color: "rgba(245,240,232,0.55)" }}>{s}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(245,240,232,0.1)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--sage)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧘‍♀️</div>
            <div>
              <div style={{ fontSize: 14, color: "var(--cream)", fontWeight: 500 }}>{course.instructor_name}</div>
              <div style={{ fontSize: 12, color: "rgba(245,240,232,0.4)" }}>RYT 500 · 경력 10년</div>
            </div>
          </div>
        </div>

        {/* Enroll Card */}
        <div style={S.enrollCard}>
          <div style={{ height: 180, background: "linear-gradient(135deg,#D4E8D4,#A8C8A0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, position: "relative", cursor: "pointer" }}>
            🧘‍♀️
            <div style={{ position: "absolute", width: 52, height: 52, background: "rgba(255,255,255,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>▶</div>
          </div>
          <div style={{ padding: 26 }}>
            <div style={{ fontSize: 11, color: "var(--mid)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>수강료</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 300, marginBottom: 4 }}>₩{course.price.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "var(--mid)", marginBottom: 20 }}>평생 소장 · 무제한 반복 수강</div>
            <button style={{ ...S.ecBtn, opacity: course.isEnrolled ? 0.6 : 1 }} onClick={handleEnroll} disabled={enrolling || course.isEnrolled}>
              {course.isEnrolled ? "✅ 수강 중" : enrolling ? "처리 중..." : "지금 수강 신청"}
            </button>
            <button style={S.ecBtnOl} onClick={handleWishlist}>
              {wishlisted ? "❤️ 찜 완료" : "🤍 찜하기"}
            </button>
            <div style={{ borderTop: "1px solid var(--sand)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--mid)", marginBottom: 10 }}>포함 내용</div>
              {["32개 HD 동영상 강의", "강의 자료 PDF 다운로드", "월 2회 라이브 Q&A", "수료증 발급", "모바일·PC 평생 이용"].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--mid)", padding: "4px 0" }}>
                  <span style={{ color: "var(--sage)", fontWeight: 700 }}>✓</span>{i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "52px 80px", display: "grid", gridTemplateColumns: "1fr 390px", gap: 72 }}>
        <div>
          {/* 배울 내용 */}
          <Section title="이런 것을 배워요">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["아침 루틴에 최적화된 기초 하타 요가 자세 32가지", "올바른 호흡법과 프라나야마 기초", "부상 없이 유연성을 키우는 스트레칭 원리", "자세별 정렬 포인트와 수정 방법", "집에서 혼자 할 수 있는 30분 루틴 구성", "명상과 요가를 연결하는 마음챙김 실천법"].map((l) => (
                <div key={l} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--mid)" }}>
                  <span style={{ color: "var(--deep)", fontWeight: 700, flexShrink: 0 }}>✓</span>{l}
                </div>
              ))}
            </div>
          </Section>

          {/* 커리큘럼 */}
          <Section title="커리큘럼">
            {Object.entries(course.curriculum).map(([wk, lecs]) => (
              <div key={wk}>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--terra)", marginBottom: 9, marginTop: 18 }}>{wk}주차</div>
                {lecs.map((l) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", borderRadius: 10, fontSize: 14, color: "var(--mid)", cursor: "pointer" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--lsage)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                      {l.is_preview ? "▶" : "🔒"}
                    </div>
                    {l.title}
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(107,101,88,0.5)" }}>{fmtSec(l.duration_sec)}</span>
                  </div>
                ))}
              </div>
            ))}
          </Section>

          {/* 후기 */}
          <Section title="수강 후기">
            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: 20, background: "var(--cream)", borderRadius: 14, marginBottom: 22 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, lineHeight: 1 }}>{course.avg_rating}</div>
                <div style={{ color: "var(--terra)", fontSize: 16 }}>★★★★★</div>
                <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 4 }}>{course.review_count}개 후기</div>
              </div>
              <div style={{ flex: 1 }}>
                {[["5★", "78%"], ["4★", "16%"], ["3★", "6%"]].map(([l, p]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--mid)", width: 20 }}>{l}</span>
                    <div style={{ flex: 1, height: 5, background: "var(--sand)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: p, background: "var(--terra)", borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, color: "var(--mid)" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            {course.reviews.map((r) => (
              <div key={r.id} style={{ background: "var(--cream)", borderRadius: 14, padding: 20, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{r.reviewer_nickname}</div>
                  <div style={{ fontSize: 12, color: "var(--mid)" }}>{r.created_at.slice(0, 10)}</div>
                </div>
                <div style={{ color: "var(--terra)", fontSize: 13, marginBottom: 7 }}>{"★".repeat(r.rating)}</div>
                <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 13, lineHeight: 1.8, color: "var(--mid)", fontWeight: 300 }}>{r.content}</p>
              </div>
            ))}
          </Section>
        </div>

        {/* Related */}
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400, marginBottom: 16, paddingBottom: 13, borderBottom: "1px solid var(--sand)" }}>
            다른 강의도 살펴보세요
          </div>
          {MOCK_LIST.filter((m) => m.id !== course.id).slice(0, 4).map((m) => {
            const grads: Record<number,string> = {
              1:"linear-gradient(135deg,#D4E8D4,#A8C8A0)", 2:"linear-gradient(135deg,#E8D4C4,#D4A88A)",
              3:"linear-gradient(135deg,#D4D8E8,#A0A8C8)", 4:"linear-gradient(135deg,#F5E6D4,#E8C8A0)",
              5:"linear-gradient(135deg,#E4D4E8,#C8A8D4)", 6:"linear-gradient(135deg,#D4EAE4,#A0C8BE)",
            };
            const emojis: Record<number,string> = { 1:"🧘‍♀️", 2:"🏋️‍♀️", 3:"🌿", 4:"🌅", 5:"🧘‍♂️", 6:"💧" };
            return (
              <div key={m.id} style={S.relCard} onClick={() => goTo("detail", m.id)}>
                <div style={{ width: 68, height: 68, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: grads[m.id], flexShrink: 0 }}>{emojis[m.id]}</div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: "var(--mid)" }}>{m.level} · {m.duration_weeks ? `${m.duration_weeks}주` : "상시"} · ⭐ {m.avg_rating}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer goTo={goTo} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 25, fontWeight: 400, marginBottom: 16, paddingBottom: 13, borderBottom: "1px solid var(--sand)" }}>{title}</div>
      {children}
    </div>
  );
}

const tagStyle = (type: string): React.CSSProperties => {
  const base: React.CSSProperties = { fontSize: 10, padding: "4px 10px", borderRadius: 100, fontWeight: 500, letterSpacing: "0.04em" };
  if (type === "입문") return { ...base, background: "#D4E8D4", color: "#4A6741" };
  if (type === "중급") return { ...base, background: "#E8D4C4", color: "#7A4A2A" };
  if (type === "심화") return { ...base, background: "#D4D8E8", color: "#3A4A6A" };
  return { ...base, background: "var(--terra)", color: "white" };
};

const S: Record<string, React.CSSProperties> = {
  bread:      { fontSize: 12, color: "rgba(245,240,232,0.4)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
  enrollCard: { background: "white", borderRadius: 20, overflow: "hidden", position: "sticky", top: 96, boxShadow: "0 20px 60px rgba(0,0,0,0.22)" },
  ecBtn:      { display: "block", width: "100%", textAlign: "center", padding: 14, background: "var(--terra)", color: "white", borderRadius: 100, fontSize: 15, fontWeight: 500, border: "none", cursor: "pointer", marginBottom: 9, fontFamily: "'DM Sans',sans-serif" },
  ecBtnOl:    { display: "block", width: "100%", textAlign: "center", padding: 12, border: "1.5px solid var(--dark)", color: "var(--dark)", borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: "pointer", background: "none", marginBottom: 18, fontFamily: "'DM Sans',sans-serif" },
  relCard:    { display: "flex", gap: 14, padding: "13px 0", borderBottom: "1px solid rgba(212,196,168,0.3)", cursor: "pointer" },
};
