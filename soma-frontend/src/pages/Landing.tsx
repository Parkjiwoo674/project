import { useState, useEffect } from "react";
import type { Course, Instructor, PageKey } from "@/types";
import { courseApi, instructorApi } from "@/api";
import Footer from "@/components/Footer";

interface LandingProps {
  goTo: (page: PageKey, id?: number) => void;
}

interface BestReview {
  id:                number;
  rating:            number;
  content:           string;
  created_at:        string;
  reviewer_nickname: string;
  reviewer_avatar:   string | null;
  course_title:      string;
}

const FEATURES = [
  ["01", "🌿", "맞춤형 커리큘럼", "초보자부터 중급자까지, 나의 수준에 맞는 클래스를 자동으로 추천합니다."],
  ["02", "🎥", "4K 고화질 강의", "세밀한 동작 하나하나를 놓치지 않도록 멀티 앵글 4K 카메라로 촬영합니다."],
  ["03", "🕐", "라이브 & VOD", "매일 진행되는 실시간 라이브 클래스와 언제든 볼 수 있는 VOD를 제공합니다."],
] as const;

const GRADS = [
  "linear-gradient(135deg,#D4E8D4,#A8C8A0)",
  "linear-gradient(135deg,#E8D4C4,#D4A88A)",
  "linear-gradient(135deg,#D4D8E8,#A0A8C8)",
];

export default function Landing({ goTo }: LandingProps) {
  const [topCourses, setTopCourses]           = useState<Course[]>([]);
  const [featuredInstructor, setFeaturedInstructor] = useState<Instructor | null>(null);
  const [bestReviews, setBestReviews]         = useState<BestReview[]>([]);

  useEffect(() => {
    courseApi.list({ limit: 3 }).then((res) => {
      const sorted = [...res.data].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0)).slice(0, 3);
      setTopCourses(sorted);
    }).catch(() => {});

    instructorApi.list().then((res) => {
      const list = res.data ?? [];
      if (list.length > 0) {
        const top = list.sort((a, b) => b.student_count - a.student_count)[0];
        setFeaturedInstructor(top);
      }
    }).catch(() => {});

    // ✅ 베스트 후기 불러오기
    fetch("/api/reviews/best")
      .then((r) => r.json())
      .then((res) => { if (res.data) setBestReviews(res.data); })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section style={S.hero}>
        <div style={S.heroLeft}>
          <div style={S.eyebrow}>온라인 요가 클래스</div>
          <h1 style={S.heroTitle}>
            몸과 마음이<br />
            <em style={{ fontStyle: "italic", color: "var(--deep)" }}>하나가 되는</em><br />
            순간
          </h1>
          <p style={S.heroSub}>
            언제 어디서든, 나만의 속도로.<br />
            국내 최고 강사진과 함께하는 프리미엄 요가 인강으로 진정한 웰니스를 경험하세요.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button style={S.btnDark}  onClick={() => goTo("courses")}>클래스 둘러보기</button>
            <button style={S.btnGhost} onClick={() => goTo("auth")}>가입하기 →</button>
          </div>
          <div style={S.heroStats}>
            {(["12k+|수강생", "180+|클래스", "4.9|평균 평점"] as const).map((s) => {
              const [num, lbl] = s.split("|");
              return (
                <div key={lbl}>
                  <div style={S.statNum}>{num}</div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 2 }}>{lbl}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={S.heroRight}>
          <div style={S.heroBg} />
          <div style={S.heroEmoji}>
            <img src="/따뜻한 햇살 속 요가 클래스.png" alt="요가 클래스" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "100px 80px", background: "var(--cream)" }}>
        <div style={{ maxWidth: 540, marginBottom: 60 }}>
          <div style={S.sLabel}>왜 소마인가</div>
          <h2 style={S.sTitle}>다른 곳에선 경험할 수<br /><em style={{ fontStyle: "italic", color: "var(--deep)" }}>없는 것들</em></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
          {FEATURES.map(([num, icon, title, desc]) => (
            <div key={num} style={S.featCard}>
              <span style={{ position: "absolute", top: 18, right: 22, fontFamily: "'Cormorant Garamond',serif", fontSize: 60, fontWeight: 300, color: "rgba(138,158,126,0.1)", lineHeight: 1 }}>{num}</span>
              <span style={{ fontSize: 28, marginBottom: 22, display: "block" }}>{icon}</span>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400, marginBottom: 12 }}>{title}</div>
              <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 13, lineHeight: 1.8, color: "var(--mid)", fontWeight: 300 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular Courses ── */}
      <section style={{ padding: "100px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 52 }}>
          <div>
            <div style={S.sLabel}>클래스</div>
            <h2 style={S.sTitle}>인기 <em style={{ fontStyle: "italic", color: "var(--deep)" }}>강의</em></h2>
          </div>
          <button style={S.btnGhost} onClick={() => goTo("courses")}>모든 클래스 보기 →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {topCourses.map((c, i) => (
            <div key={c.id} style={S.courseCard} onClick={() => goTo("detail", c.id)}>
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 68, position: "relative", background: GRADS[i % 3], overflow: "hidden" }}>
                {i === 0 && <span style={{ position: "absolute", top: 14, left: 14, background: "white", borderRadius: 100, padding: "5px 12px", fontSize: 11, fontWeight: 500 }}>🔥 인기</span>}
                {c.thumbnail_url
                  ? <img src={c.thumbnail_url} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span>🧘</span>
                }
              </div>
              <div style={{ padding: 22 }}>
                <div style={{ fontSize: 11, color: "var(--sage)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  {c.level} · {c.duration_weeks ? `${c.duration_weeks}주 과정` : "상시"}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400, marginBottom: 8 }}>{c.title}</div>
                <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 13, color: "var(--mid)", fontWeight: 300, lineHeight: 1.65, marginBottom: 14 }}>{c.description}</p>
                <div style={{ fontSize: 12, color: "var(--mid)" }}>
                  📹 {c.lecture_count}강 · ⭐ {c.avg_rating ?? "-"} · {c.enrollment_count.toLocaleString()}명
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Instructor ── */}
      {featuredInstructor && (
        <section style={{ padding: "100px 80px", background: "var(--dark)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: "100%", aspectRatio: "3/4", background: "white", borderRadius: "180px 180px 20px 20px", overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              {featuredInstructor.avatar_url
                ? <img src={featuredInstructor.avatar_url} alt={featuredInstructor.name} style={{ width: "100%", objectFit: "cover", objectPosition: "top center" }} />
                : <img src="/soma-removebg-preview.png" alt={featuredInstructor.name} style={{ width: "100%", objectFit: "cover", objectPosition: "top center" }} />
              }
            </div>
            <div style={{ position: "absolute", bottom: -20, right: -20, width: 110, height: 110, background: "var(--terra)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond',serif", fontSize: 12, color: "white", textAlign: "center", lineHeight: 1.5 }}>
              {featuredInstructor.course_count}개<br />강의
            </div>
          </div>
          <div>
            <div style={{ ...S.sLabel, color: "var(--sage)" }}>강사 소개</div>
            <h2 style={{ ...S.sTitle, color: "var(--cream)" }}>
              {featuredInstructor.name} <em style={{ fontStyle: "italic", color: "var(--deep)" }}>선생님</em>
            </h2>
            <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 14, lineHeight: 1.9, color: "rgba(245,240,232,0.65)", fontWeight: 300, margin: "22px 0 30px" }}>
              {featuredInstructor.bio || "소마에서 활동 중인 강사입니다."}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {featuredInstructor.certifications
                ? (JSON.parse(featuredInstructor.certifications) as string[]).map((c) => (
                    <span key={c} style={{ border: "1px solid rgba(138,158,126,0.35)", color: "var(--sage)", fontSize: 12, padding: "7px 14px", borderRadius: 100 }}>{c}</span>
                  ))
                : null
              }
              <span style={{ border: "1px solid rgba(138,158,126,0.35)", color: "var(--sage)", fontSize: 12, padding: "7px 14px", borderRadius: 100 }}>
                수강생 {featuredInstructor.student_count.toLocaleString()}명
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Best Reviews ── */}
      {bestReviews.length > 0 && (
        <section style={{ padding: "100px 80px", background: "var(--cream)" }}>
          <div style={{ maxWidth: 540, marginBottom: 52 }}>
            <div style={S.sLabel}>수강 후기</div>
            <h2 style={S.sTitle}>수강생들의 <em style={{ fontStyle: "italic", color: "var(--deep)" }}>이야기</em></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {bestReviews.map((r) => (
              <div key={r.id} style={S.testiCard}>
                {/* 별점 */}
                <div style={{ color: "var(--terra)", fontSize: 14, marginBottom: 14 }}>
                  {"★".repeat(r.rating)}<span style={{ color: "var(--sand)" }}>{"★".repeat(5 - r.rating)}</span>
                </div>
                {/* 내용 */}
                <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 13, lineHeight: 1.85, color: "var(--mid)", fontWeight: 300, marginBottom: 20, minHeight: 60 }}>
                  "{r.content}"
                </p>
                {/* 강의명 */}
                <div style={{ fontSize: 11, color: "var(--sage)", letterSpacing: "0.06em", marginBottom: 16, padding: "5px 10px", background: "var(--lsage)", borderRadius: 100, display: "inline-block" }}>
                  {r.course_title}
                </div>
                {/* 작성자 */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 16, borderTop: "1px solid var(--sand)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "var(--lsage)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {r.reviewer_avatar
                      ? <img src={r.reviewer_avatar} alt={r.reviewer_nickname} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="#8A9E7E"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.reviewer_nickname}</div>
                    <div style={{ fontSize: 11, color: "var(--mid)" }}>{r.created_at.slice(0, 10)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer goTo={goTo} />
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  hero:      { minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" },
  heroLeft:  { display: "flex", flexDirection: "column", justifyContent: "center", padding: "140px 80px 80px" },
  eyebrow:   { fontSize: 11, letterSpacing: "0.3em", color: "var(--terra)", textTransform: "uppercase", fontWeight: 500, marginBottom: 28, display: "flex", alignItems: "center", gap: 12 },
  heroTitle: { fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(52px,5.5vw,80px)", fontWeight: 300, lineHeight: 1.05, marginBottom: 26 },
  heroSub:   { fontFamily: "'Noto Serif KR',serif", fontSize: 15, fontWeight: 300, lineHeight: 1.85, color: "var(--mid)", maxWidth: 380, marginBottom: 42 },
  heroRight: { position: "relative", overflow: "hidden" },
  heroBg:    { position: "absolute", inset: 0, background: "linear-gradient(135deg,var(--lsage),var(--sand))" },
  heroEmoji: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  floatCard: { position: "absolute", bottom: 80, left: -40, background: "white", borderRadius: 20, padding: "20px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", minWidth: 220, zIndex: 3 },
  heroStats: { display: "flex", gap: 36, marginTop: 56, paddingTop: 36, borderTop: "1px solid rgba(138,158,126,0.2)" },
  statNum:   { fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 300 },
  sLabel:    { fontSize: 11, letterSpacing: "0.3em", color: "var(--terra)", textTransform: "uppercase", fontWeight: 500, display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  sTitle:    { fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, lineHeight: 1.15 },
  featCard:  { background: "var(--warm)", padding: "44px 36px", position: "relative", overflow: "hidden" },
  courseCard:{ borderRadius: 20, overflow: "hidden", background: "var(--cream)", cursor: "pointer" },
  btnDark:   { background: "var(--dark)", color: "var(--cream)", padding: "14px 30px", borderRadius: 100, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  btnGhost:  { background: "none", border: "none", fontSize: 14, cursor: "pointer", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif" },
  testiCard: { background: "white", borderRadius: 20, padding: "28px 24px" },
};