import { useState, useEffect } from "react";
import type { CourseDetail, Lecture, PageKey } from "@/types";
import { courseApi } from "@/api";

interface PlayerProps {
  goTo:     (page: PageKey, id?: number) => void;
  courseId: number;
}

// 목업 강의 데이터 (API 연동 전 fallback)
const MOCK: CourseDetail = {
  id: 1, title: "아침을 여는 하타 요가", description: "하루를 상쾌하게 시작하는 30분 루틴.",
  level: "입문", duration_weeks: 4, lecture_count: 32, total_hours: 16,
  price: 89000, is_live: 1, thumbnail_url: null,
  instructor_name: "김소라", instructor_bio: "", instructor_avatar: null,
  category: "입문", avg_rating: 4.9, review_count: 847, enrollment_count: 3247,
  curriculum: {
    1: [
      { id: 1, week: 1, sort_order: 1, title: "오리엔테이션 · 요가 매트와 준비물", duration_sec: 480,  is_preview: 1 },
      { id: 2, week: 1, sort_order: 2, title: "산 자세 (타다사나)와 호흡",          duration_sec: 1320, is_preview: 1 },
      { id: 3, week: 1, sort_order: 3, title: "전굴 자세 (우타나사나)",              duration_sec: 1080, is_preview: 0 },
    ],
    2: [
      { id: 4, week: 2, sort_order: 1, title: "전사 자세 1 (비라바드라사나 I)",      duration_sec: 1440, is_preview: 0 },
      { id: 5, week: 2, sort_order: 2, title: "전사 자세 2 (비라바드라사나 II)",     duration_sec: 1380, is_preview: 0 },
      { id: 6, week: 2, sort_order: 3, title: "삼각 자세 (트리코나사나)",            duration_sec: 1200, is_preview: 0 },
    ],
    3: [
      { id: 7, week: 3, sort_order: 1, title: "나무 자세 (브릭샤사나) 밸런스",       duration_sec: 960,  is_preview: 0 },
      { id: 8, week: 3, sort_order: 2, title: "독수리 자세 (가루다사나)",            duration_sec: 1020, is_preview: 0 },
    ],
    4: [
      { id: 9,  week: 4, sort_order: 1, title: "아기 자세 (발라사나) 이완",          duration_sec: 720,  is_preview: 0 },
      { id: 10, week: 4, sort_order: 2, title: "시체 자세 (사바사나) 마무리 명상",   duration_sec: 900,  is_preview: 0 },
    ],
  },
  reviews: [], isEnrolled: true, isWishlisted: false,
};

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function Player({ goTo, courseId }: PlayerProps) {
  const [course, setCourse]       = useState<CourseDetail>(MOCK);
  const [activeLec, setActiveLec] = useState<Lecture>(MOCK.curriculum[1][0]);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [sideOpen, setSideOpen]   = useState(true);

  useEffect(() => {
    courseApi.detail(courseId).then((res) => {
      if (res.data) {
        setCourse(res.data);
        const firstWeek = Object.values(res.data.curriculum)[0];
        if (firstWeek?.length) setActiveLec(firstWeek[0]);
      }
    }).catch(() => {});
  }, [courseId]);

  const allLectures = Object.values(course.curriculum).flat();
  const currentIdx  = allLectures.findIndex((l) => l.id === activeLec.id);
  const prevLec     = currentIdx > 0 ? allLectures[currentIdx - 1] : null;
  const nextLec     = currentIdx < allLectures.length - 1 ? allLectures[currentIdx + 1] : null;

  const markComplete = () => {
    setCompleted((prev) => new Set([...prev, activeLec.id]));
    if (nextLec) setActiveLec(nextLec);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#1a1a1a", paddingTop: 0 }}>
      {/* Top Bar */}
      <div style={S.topBar}>
        <button style={S.backBtn} onClick={() => goTo("my")}>← 내 수업</button>
        <div style={S.topTitle}>{course.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {completed.size} / {allLectures.length}강 완료
          </span>
          <button style={S.sideToggle} onClick={() => setSideOpen((v) => !v)}>
            {sideOpen ? "◀ 목록 닫기" : "▶ 목록 열기"}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Video Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Video */}
          <div style={S.videoBox}>
            <div style={S.videoPlaceholder}>
              <div style={{ fontSize: 80, marginBottom: 16, opacity: 0.6 }}>🧘‍♀️</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
                {activeLec.title}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 28 }}>
                {fmtSec(activeLec.duration_sec)}
              </div>
              {/* 실제 서비스에서는 <video> 또는 스트리밍 플레이어로 교체 */}
              <div style={S.playCircle}>▶</div>
            </div>
          </div>

          {/* Controls */}
          <div style={S.controls}>
            <button
              style={{ ...S.ctrlBtn, opacity: prevLec ? 1 : 0.3 }}
              disabled={!prevLec}
              onClick={() => prevLec && setActiveLec(prevLec)}
            >
              ← 이전 강의
            </button>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                {currentIdx + 1} / {allLectures.length}강
              </div>
              <div style={{ fontSize: 14, color: "white", fontWeight: 500, maxWidth: 320 }}>
                {activeLec.title}
              </div>
            </div>

            <button
              style={{ ...S.ctrlBtn, ...(completed.has(activeLec.id) ? S.ctrlBtnDone : S.ctrlBtnPrimary) }}
              onClick={markComplete}
            >
              {completed.has(activeLec.id) ? "✅ 완료됨" : nextLec ? "완료 후 다음 →" : "✅ 강의 완료"}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        {sideOpen && (
          <div style={S.sidebar}>
            <div style={S.sideHead}>커리큘럼</div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {Object.entries(course.curriculum).map(([wk, lecs]) => (
                <div key={wk}>
                  <div style={S.weekLabel}>{wk}주차</div>
                  {lecs.map((l) => {
                    const isActive = l.id === activeLec.id;
                    const isDone   = completed.has(l.id);
                    return (
                      <div
                        key={l.id}
                        style={{ ...S.lecRow, ...(isActive ? S.lecRowActive : {}) }}
                        onClick={() => setActiveLec(l)}
                      >
                        <div style={{ ...S.lecIcon, background: isDone ? "var(--deep)" : isActive ? "var(--terra)" : "rgba(255,255,255,0.08)" }}>
                          {isDone ? "✓" : isActive ? "▶" : l.sort_order}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: isActive ? "white" : "rgba(255,255,255,0.7)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.title}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{fmtSec(l.duration_sec)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  topBar:        { height: 56, background: "#111", display: "flex", alignItems: "center", padding: "0 20px", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  backBtn:       { fontSize: 13, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: "6px 0" },
  topTitle:      { flex: 1, fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sideToggle:    { fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  videoBox:      { flex: 1, background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  videoPlaceholder: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  playCircle:    { width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "white", cursor: "pointer" },
  controls:      { height: 80, background: "#111", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  ctrlBtn:       { padding: "9px 20px", borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "'DM Sans',sans-serif", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" },
  ctrlBtnPrimary:{ background: "var(--terra)", color: "white" },
  ctrlBtnDone:   { background: "var(--deep)", color: "white" },
  sidebar:       { width: 320, background: "#161616", borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 },
  sideHead:      { padding: "18px 20px 12px", fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  weekLabel:     { padding: "12px 20px 6px", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--terra)" },
  lecRow:        { display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", cursor: "pointer" },
  lecRowActive:  { background: "rgba(200,113,74,0.1)" },
  lecIcon:       { width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", flexShrink: 0 },
};
