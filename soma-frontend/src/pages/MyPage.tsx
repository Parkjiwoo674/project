import { useState, useEffect } from "react";
import type { Enrollment, PageKey } from "@/types";
import { enrollmentApi } from "@/api";
import Footer from "@/components/Footer";

interface MyPageProps {
  goTo: (page: PageKey, id?: number) => void;
}

const EMOJIS = ["🧘‍♀️", "🏋️‍♀️", "🌿", "🌅", "🧘‍♂️", "💧"];
const GRADS  = [
  "linear-gradient(135deg,#D4E8D4,#A8C8A0)",
  "linear-gradient(135deg,#E8D4C4,#D4A88A)",
  "linear-gradient(135deg,#D4D8E8,#A0A8C8)",
  "linear-gradient(135deg,#F5E6D4,#E8C8A0)",
  "linear-gradient(135deg,#E4D4E8,#C8A8D4)",
  "linear-gradient(135deg,#D4EAE4,#A0C8BE)",
];

export default function MyPage({ goTo }: MyPageProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    enrollmentApi.myList()
      .then((res) => setEnrollments(res.data ?? []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "var(--dark)", padding: "56px 80px 44px" }}>
        <div style={S.label}>내 학습</div>
        <h1 style={S.h1}>
          수강 중인 <em style={{ fontStyle: "italic", color: "var(--sand)" }}>클래스</em>
        </h1>
        <p style={S.sub}>총 {enrollments.length}개 강의 수강 중</p>
      </div>

      {/* Content */}
      <div style={{ padding: "48px 80px 80px" }}>
        {loading ? (
          <div style={S.empty}>불러오는 중...</div>
        ) : enrollments.length === 0 ? (
          <div style={S.emptyBox}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🧘‍♀️</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, marginBottom: 10 }}>
              아직 수강 중인 강의가 없어요
            </div>
            <p style={{ fontSize: 14, color: "var(--mid)", marginBottom: 24 }}>
              마음에 드는 강의를 찾아 수강 신청해보세요
            </p>
            <button style={S.btn} onClick={() => goTo("courses")}>강의 둘러보기</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {enrollments.map((e, i) => (
              <div key={e.enrollment_id} style={S.card}>
                {/* 썸네일 */}
                <div
                  style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, background: GRADS[i % 6], cursor: "pointer" }}
                  onClick={() => goTo("player", e.course_id)}
                >
                  {EMOJIS[i % 6]}
                </div>

                <div style={{ padding: "18px 18px 20px" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 400, marginBottom: 4, cursor: "pointer" }}
                    onClick={() => goTo("player", e.course_id)}>
                    {e.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginBottom: 14 }}>👤 {e.instructor_name}</div>

                  {/* 진도율 */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--mid)", marginBottom: 6 }}>
                      <span>진도율</span>
                      <span style={{ fontWeight: 500, color: "var(--deep)" }}>{e.progress_rate}%</span>
                    </div>
                    <div style={{ height: 5, background: "var(--sand)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${e.progress_rate}%`, background: "var(--deep)", borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--mid)", marginTop: 5 }}>
                      {e.completed_lectures} / {e.lecture_count}강 완료
                    </div>
                  </div>

                  <button style={S.playBtn} onClick={() => goTo("player", e.course_id)}>
                    {e.progress_rate === 0 ? "▶ 학습 시작" : e.progress_rate === 100 ? "✅ 완료" : "▶ 이어서 듣기"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer goTo={goTo} />
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  label:   { fontSize: 11, letterSpacing: "0.3em", color: "var(--sage)", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 },
  h1:      { fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 300, color: "var(--cream)", lineHeight: 1.15, marginBottom: 10 },
  sub:     { color: "rgba(245,240,232,0.45)", fontFamily: "'Noto Serif KR',serif", fontSize: 13, fontWeight: 300 },
  empty:   { textAlign: "center", padding: 80, color: "var(--mid)" },
  emptyBox:{ textAlign: "center", padding: "80px 0", color: "var(--mid)" },
  btn:     { padding: "12px 28px", background: "var(--dark)", color: "var(--cream)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  card:    { background: "white", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(212,196,168,0.4)" },
  playBtn: { display: "block", width: "100%", padding: "11px 0", background: "var(--terra)", color: "white", border: "none", borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
};
