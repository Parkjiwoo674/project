import { useState, useEffect } from "react";
import type { Course, PageKey } from "@/types";
import { courseApi } from "@/api";
import Footer from "@/components/Footer";

interface CourseListProps {
  goTo: (page: PageKey) => void;
}

const TABS = ["전체", "입문", "중급", "심화", "라이브"] as const;
type Tab = (typeof TABS)[number];

const thumbGrad: Record<string, string> = {
  t1: "linear-gradient(135deg,#D4E8D4,#A8C8A0)",
  t2: "linear-gradient(135deg,#E8D4C4,#D4A88A)",
  t3: "linear-gradient(135deg,#D4D8E8,#A0A8C8)",
  t4: "linear-gradient(135deg,#F5E6D4,#E8C8A0)",
  t5: "linear-gradient(135deg,#E4D4E8,#C8A8D4)",
  t6: "linear-gradient(135deg,#D4EAE4,#A0C8BE)",
};
const EMOJIS = ["🧘‍♀️", "🏋️‍♀️", "🌿", "🌅", "🧘‍♂️", "💧"];
const THUMBS = ["t1", "t2", "t3", "t4", "t5", "t6"];

const tagStyle = (type: string): React.CSSProperties => {
  const base: React.CSSProperties = { fontSize: 10, padding: "4px 10px", borderRadius: 100, fontWeight: 500, letterSpacing: "0.04em" };
  if (type === "입문") return { ...base, background: "#D4E8D4", color: "#4A6741" };
  if (type === "중급") return { ...base, background: "#E8D4C4", color: "#7A4A2A" };
  if (type === "심화") return { ...base, background: "#D4D8E8", color: "#3A4A6A" };
  return { ...base, background: "var(--terra)", color: "white" };
};

export default function CourseList({ goTo }: CourseListProps) {
  const [courses, setCourses]   = useState<Course[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("전체");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await courseApi.list({
          level:   activeTab === "전체" || activeTab === "라이브" ? undefined : activeTab,
          is_live: activeTab === "라이브" ? true : undefined,
          search:  search || undefined,
        });
        setCourses(res.data);
      } catch {
        // fallback: 빈 배열
        setCourses([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab, search]);

  return (
    <div style={{ paddingTop: 80 }}>
      {/* Hero */}
      <div style={{ background: "var(--dark)", padding: "72px 80px 52px" }}>
        <div style={S.sLabelLight}>전체 클래스</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, lineHeight: 1.15, color: "var(--cream)", marginBottom: 12 }}>
          나에게 맞는 <em style={{ fontStyle: "italic", color: "var(--sand)" }}>강의</em>를 찾아보세요
        </h1>
        <p style={{ color: "rgba(245,240,232,0.5)", fontFamily: "'Noto Serif KR',serif", fontSize: 14, fontWeight: 300 }}>
          180개 이상의 요가 클래스 · 입문부터 심화까지
        </p>
      </div>

      {/* Filter */}
      <div style={S.filterBar}>
        {TABS.map((t) => (
          <button
            key={t}
            style={{ ...S.ftab, ...(activeTab === t ? S.ftabOn : {}) }}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
        <div style={{ marginLeft: "auto", padding: "10px 0" }}>
          <input
            style={S.srch}
            placeholder="강의 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "44px 80px 80px" }}>
        <div style={{ fontSize: 13, color: "var(--mid)", marginBottom: 26 }}>
          총 <strong>{courses.length}개</strong>의 강의
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--mid)" }}>불러오는 중...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {(courses.length > 0 ? courses : MOCK_COURSES).map((c, i) => (
              <div key={c.id} style={S.card} onClick={() => goTo("detail", c.id)}>
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 62, background: thumbGrad[THUMBS[i % 6]] }}>
                  {EMOJIS[i % 6]}
                </div>
                <div style={{ padding: "18px 18px 22px" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
                    <span style={tagStyle(c.level)}>{c.level}</span>
                    {c.is_live === 1 && <span style={tagStyle("라이브")}>LIVE</span>}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 400, marginBottom: 5 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginBottom: 12 }}>👤 {c.instructor_name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(212,196,168,0.4)" }}>
                    <div style={{ fontSize: 12, color: "var(--mid)" }}>📹 {c.lecture_count}강 · {c.duration_weeks ? `${c.duration_weeks}주` : "상시"}</div>
                    <div style={{ display: "flex", gap: 4, fontSize: 13, fontWeight: 500 }}>
                      <span style={{ color: "var(--terra)" }}>★</span>
                      {c.avg_rating ?? "-"}
                    </div>
                  </div>
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

// API 연동 전 화면 확인용 목업
const MOCK_COURSES: Course[] = [
  { id:1, title:"아침을 여는 하타 요가",   level:"입문", duration_weeks:4,  lecture_count:32, total_hours:16, price:89000,  is_live:1, thumbnail_url:null, instructor_name:"김소라", category:"입문", avg_rating:4.9, enrollment_count:3247, description:"" },
  { id:2, title:"파워 빈야사 플로우",       level:"중급", duration_weeks:8,  lecture_count:56, total_hours:28, price:119000, is_live:0, thumbnail_url:null, instructor_name:"김소라", category:"중급", avg_rating:4.8, enrollment_count:1800, description:"" },
  { id:3, title:"숙면을 위한 인 요가",      level:"입문", duration_weeks:null,lecture_count:24, total_hours:12, price:69000,  is_live:0, thumbnail_url:null, instructor_name:"이지현", category:"입문", avg_rating:5.0, enrollment_count:2500, description:"" },
  { id:4, title:"선라이즈 명상 호흡",       level:"입문", duration_weeks:3,  lecture_count:18, total_hours:9,  price:59000,  is_live:0, thumbnail_url:null, instructor_name:"박민지", category:"입문", avg_rating:4.7, enrollment_count:940,  description:"" },
  { id:5, title:"아쉬탕가 심화 수련",       level:"심화", duration_weeks:10, lecture_count:40, total_hours:20, price:149000, is_live:1, thumbnail_url:null, instructor_name:"김소라", category:"심화", avg_rating:4.9, enrollment_count:620,  description:"" },
  { id:6, title:"코어 & 밸런스 필라테스",   level:"중급", duration_weeks:6,  lecture_count:36, total_hours:18, price:99000,  is_live:0, thumbnail_url:null, instructor_name:"정수현", category:"중급", avg_rating:4.8, enrollment_count:1100, description:"" },
];

const S: Record<string, React.CSSProperties> = {
  sLabelLight: { fontSize: 11, letterSpacing: "0.3em", color: "var(--sage)", textTransform: "uppercase", fontWeight: 500, display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  filterBar:   { background: "white", borderBottom: "1px solid rgba(138,158,126,0.15)", padding: "0 80px", display: "flex", gap: 0, position: "sticky", top: 76, zIndex: 50 },
  ftab:        { padding: "16px 20px", fontSize: 13, color: "var(--mid)", cursor: "pointer", borderBottom: "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" },
  ftabOn:      { color: "var(--deep)", borderBottom: "2px solid var(--deep)", fontWeight: 500 },
  srch:        { padding: "9px 16px 9px 16px", border: "1px solid var(--sand)", borderRadius: 100, fontSize: 13, outline: "none", width: 180, fontFamily: "'DM Sans',sans-serif", background: "var(--cream)" },
  card:        { background: "white", borderRadius: 18, overflow: "hidden", cursor: "pointer", border: "1px solid rgba(212,196,168,0.4)" },
};
