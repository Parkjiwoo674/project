import { useState, useEffect } from "react";
import type { Course, PageKey } from "@/types";
import { wishlistApi, enrollmentApi } from "@/api";
import Footer from "@/components/Footer";

interface WishlistProps {
  goTo: (page: PageKey, id?: number) => void;
}

const GRADS = [
  "linear-gradient(135deg,#D4E8D4,#A8C8A0)",
  "linear-gradient(135deg,#E8D4C4,#D4A88A)",
  "linear-gradient(135deg,#D4D8E8,#A0A8C8)",
  "linear-gradient(135deg,#F5E6D4,#E8C8A0)",
  "linear-gradient(135deg,#E4D4E8,#C8A8D4)",
  "linear-gradient(135deg,#D4EAE4,#A0C8BE)",
];

const tagStyle = (type: string): React.CSSProperties => {
  const base: React.CSSProperties = { fontSize: 10, padding: "4px 10px", borderRadius: 100, fontWeight: 500 };
  if (type === "입문") return { ...base, background: "#D4E8D4", color: "#4A6741" };
  if (type === "중급") return { ...base, background: "#E8D4C4", color: "#7A4A2A" };
  if (type === "심화") return { ...base, background: "#D4D8E8", color: "#3A4A6A" };
  return { ...base, background: "var(--terra)", color: "white" };
};

export default function WishlistPage({ goTo }: WishlistProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistApi.list()
      .then((res) => setCourses(res.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (courseId: number) => {
    try {
      await enrollmentApi.toggleWishlist(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div style={{ background: "var(--dark)", padding: "56px 80px 44px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--sage)", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>찜 목록</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 300, color: "var(--cream)", lineHeight: 1.15, marginBottom: 10 }}>
          관심 있는 <em style={{ fontStyle: "italic", color: "var(--sand)" }}>강의</em>
        </h1>
        <p style={{ color: "rgba(245,240,232,0.45)", fontSize: 13 }}>총 {courses.length}개</p>
      </div>

      <div style={{ padding: "48px 80px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--mid)" }}>불러오는 중...</div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤍</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300, marginBottom: 10 }}>찜한 강의가 없어요</div>
            <p style={{ fontSize: 14, color: "var(--mid)", marginBottom: 24 }}>마음에 드는 강의를 찜해보세요</p>
            <button style={S.btn} onClick={() => goTo("courses")}>강의 둘러보기</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {courses.map((c, i) => (
              <div key={c.id} style={S.card}>
                <div style={{ height: 160, background: GRADS[i % 6], display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}
                  onClick={() => goTo("detail", c.id)}>
                  {c.thumbnail_url
                    ? <img src={c.thumbnail_url} alt={c.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 48 }}>🧘</span>
                  }
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <span style={tagStyle(c.level)}>{c.level}</span>
                    {c.is_live === 1 && <span style={tagStyle("라이브")}>LIVE</span>}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 400, marginBottom: 4, cursor: "pointer" }}
                    onClick={() => goTo("detail", c.id)}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginBottom: 12 }}>👤 {c.instructor_name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(212,196,168,0.4)" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300 }}>₩{c.price.toLocaleString()}</div>
                    <button onClick={() => handleRemove(c.id)}
                      style={{ fontSize: 12, color: "var(--terra)", background: "none", border: "1px solid var(--terra)", borderRadius: 100, padding: "5px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                      ❤️ 찜 취소
                    </button>
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
  btn:  { padding: "12px 28px", background: "var(--dark)", color: "var(--cream)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  card: { background: "white", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(212,196,168,0.4)" },
};
