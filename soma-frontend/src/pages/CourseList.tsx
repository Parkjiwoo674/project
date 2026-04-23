import { useState, useEffect } from "react";
import type { Course, PageKey } from "@/types";
import { courseApi } from "@/api";
import Footer from "@/components/Footer";

interface CourseListProps {
  goTo: (page: PageKey, id?: number) => void;
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
const EMOJIS: (string | null)[] = [null, "🏋️‍♀️", "🌿", "🌅", "🧘‍♂️", "💧"];
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
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("전체");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await courseApi.list({
          level:   activeTab === "전체" || activeTab === "라이브" ? undefined : activeTab,
          is_live: activeTab === "라이브" ? true : undefined,
          search:  search || undefined,
        });
        setCourses(res.data);
      } catch (e) {
        setError((e as Error).message ?? "강의 목록을 불러오지 못했습니다.");
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
        ) : error ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--terra)" }}>{error}</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--mid)" }}>강의가 없습니다.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {courses.map((c, i) => (
              <div key={c.id} style={S.card} onClick={() => goTo("detail", c.id)}>
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 62, background: thumbGrad[THUMBS[i % 6]], overflow: "hidden" }}>
                  {c.thumbnail_url
                    ? <img src={c.thumbnail_url} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : EMOJIS[i % 6]
                      ? EMOJIS[i % 6]
                      : <img src="/soma-removebg-preview.png" alt="강사" style={{ height: "100%", width: "100%", objectFit: "cover", objectPosition: "top center" }} />
                  }
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


const S: Record<string, React.CSSProperties> = {
  sLabelLight: { fontSize: 11, letterSpacing: "0.3em", color: "var(--sage)", textTransform: "uppercase", fontWeight: 500, display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  filterBar:   { background: "white", borderBottom: "1px solid rgba(138,158,126,0.15)", padding: "0 80px", display: "flex", gap: 0, position: "sticky", top: 76, zIndex: 50 },
  ftab:        { padding: "16px 20px", fontSize: 13, color: "var(--mid)", cursor: "pointer", borderBottom: "2px solid transparent", background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" },
  ftabOn:      { color: "var(--deep)", borderBottom: "2px solid var(--deep)", fontWeight: 500 },
  srch:        { padding: "9px 16px 9px 16px", border: "1px solid var(--sand)", borderRadius: 100, fontSize: 13, outline: "none", width: 180, fontFamily: "'DM Sans',sans-serif", background: "var(--cream)" },
  card:        { background: "white", borderRadius: 18, overflow: "hidden", cursor: "pointer", border: "1px solid rgba(212,196,168,0.4)" },
};
