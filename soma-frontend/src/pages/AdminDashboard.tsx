import { useState, useEffect } from "react";
import type { PageKey } from "@/types";
import Footer from "@/components/Footer";

interface Props {
  goTo: (page: PageKey, id?: number) => void;
}

interface User {
  id:         number;
  name:       string;
  nickname:   string;
  email:      string;
  role:       string;
  avatar_url: string | null;
  created_at: string;
}

interface Review {
  id:                number;
  rating:            number;
  content:           string;
  created_at:        string;
  reviewer_nickname: string;
  course_title:      string;
  course_id:         number;
}

interface Stats {
  total_users:       number;
  total_instructors: number;
  total_students:    number;
  total_courses:     number;
  total_reviews:     number;
  total_revenue:     number;
  monthly_revenue:   { week: string; revenue: number; count: number }[];
}

const BASE = "/api";
const getToken = () => localStorage.getItem("soma_token");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" });

type Tab = "stats" | "users" | "reviews";

const STAT_CARDS = (stats: Stats) => [
  { label: "총 회원",   value: stats.total_users,       unit: "명" },
  { label: "강사",      value: stats.total_instructors, unit: "명" },
  { label: "수강생",    value: stats.total_students,    unit: "명" },
  { label: "공개 강의", value: stats.total_courses,     unit: "개" },
  { label: "후기",      value: stats.total_reviews,     unit: "개" },
  { label: "총 매출",   value: `₩${Number(stats.total_revenue).toLocaleString()}`, unit: "" },
];

export default function AdminDashboard({ goTo }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [stats, setStats]         = useState<Stats | null>(null);
  const [users, setUsers]         = useState<User[]>([]);
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sRes, uRes, rRes] = await Promise.all([
          fetch(`${BASE}/admin/stats`,   { headers: authHeader() }).then((r) => r.json()),
          fetch(`${BASE}/admin/users`,   { headers: authHeader() }).then((r) => r.json()),
          fetch(`${BASE}/admin/reviews`, { headers: authHeader() }).then((r) => r.json()),
        ]);
        if (sRes.data) setStats(sRes.data);
        if (uRes.data) setUsers(uRes.data);
        if (rRes.data) setReviews(rRes.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm("이 후기를 삭제할까요?")) return;
    try {
      await fetch(`${BASE}/admin/reviews/${reviewId}`, { method: "DELETE", headers: authHeader() });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e) { alert((e as Error).message); }
  };

  const filteredUsers   = users.filter((u) =>
    u.name.includes(search) || u.nickname.includes(search) || u.email.includes(search)
  );
  const filteredReviews = reviews.filter((r) =>
    r.reviewer_nickname.includes(search) || r.content.includes(search) || r.course_title.includes(search)
  );

  const TABS: [Tab, string][] = [["stats", "통계"], ["users", "회원 목록"], ["reviews", "후기 관리"]];

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div style={{ background: "var(--dark)", padding: "48px 80px 36px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--terra)", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}>관리자</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 300, color: "var(--cream)", marginBottom: 8 }}>
          관리자 <em style={{ fontStyle: "italic", color: "var(--sand)" }}>대시보드</em>
        </h1>
      </div>

      {/* 탭 */}
      <div style={{ background: "white", borderBottom: "1px solid var(--sand)", padding: "0 80px", display: "flex", position: "sticky", top: 76, zIndex: 50 }}>
        {TABS.map(([t, label]) => (
          <button key={t} onClick={() => { setActiveTab(t); setSearch(""); }}
            style={{ padding: "16px 24px", fontSize: 14, background: "none", border: "none", borderBottom: `2px solid ${activeTab === t ? "var(--dark)" : "transparent"}`, color: activeTab === t ? "var(--dark)" : "var(--mid)", cursor: "pointer", fontWeight: activeTab === t ? 500 : 400, fontFamily: "'DM Sans',sans-serif", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "40px 80px 80px", flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80, color: "var(--mid)" }}>불러오는 중...</div>
        ) : (
          <>
            {/* ── 통계 탭 ── */}
            {activeTab === "stats" && stats && (
              <div>
                {/* 요약 카드 */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 40 }}>
                  {STAT_CARDS(stats).map(({ label, value, unit }, idx) => (
                    <div key={label} style={{
                      background: "white",
                      borderRadius: 16,
                      padding: "24px 28px",
                      border: "1px solid var(--sand)",
                    }}>
                      <div style={{ fontSize: 11, color: "var(--mid)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 300, color: "var(--dark)" }}>
                        {value}<span style={{ fontSize: 16, marginLeft: 4, color: "var(--mid)", fontFamily: "'DM Sans',sans-serif" }}>{unit}</span>
                      </div>
                      {/* ✅ 총 매출 카드만 하단 포인트 */}
                      {idx === 5 && (
                        <div style={{ marginTop: 12, height: 2, background: "var(--sage)", borderRadius: 2 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* 주간 매출 그래프 */}
                {stats.monthly_revenue.length > 0 && (
                  <div style={{ background: "white", borderRadius: 16, padding: "32px 36px", border: "1px solid var(--sand)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400 }}>주간 매출</div>
                      <div style={{ fontSize: 12, color: "var(--mid)" }}>최근 4주</div>
                    </div>
                    <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 200, paddingBottom: 8, borderBottom: "1px solid var(--sand)" }}>
                      {stats.monthly_revenue.map((m) => {
                        const max = Math.max(...stats.monthly_revenue.map((x) => Number(x.revenue)));
                        const h   = max > 0 ? Math.round((Number(m.revenue) / max) * 150) : 0;
                        return (
                          <div key={m.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                            <div style={{ fontSize: 12, color: "var(--mid)" }}>
                              ₩{(Number(m.revenue) / 10000).toFixed(0)}만
                            </div>
                            <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                              {/* ✅ 단색 크림/세이지 계열, 주황 없음 */}
                              <div style={{
                                width: "55%",
                                height: Math.max(h, 4),
                                background: "var(--sage)",
                                borderRadius: "6px 6px 0 0",
                                opacity: 0.75,
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                      {stats.monthly_revenue.map((m, i) => (
                        <div key={m.week} style={{ flex: 1, textAlign: "center", fontSize: 12, color: "var(--mid)" }}>
                          {i + 1}주차
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                      {stats.monthly_revenue.map((m) => (
                        <div key={m.week} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--mid)" }}>
                          {m.count}건
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats.monthly_revenue.length === 0 && (
                  <div style={{ background: "white", borderRadius: 16, padding: "48px", border: "1px solid var(--sand)", textAlign: "center", color: "var(--mid)", fontSize: 14 }}>
                    아직 매출 데이터가 없어요.
                  </div>
                )}
              </div>
            )}

            {/* ── 회원 목록 탭 ── */}
            {activeTab === "users" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 14, color: "var(--mid)" }}>총 <strong>{users.length}명</strong></div>
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름, 닉네임, 이메일 검색..."
                    style={{ padding: "9px 16px", border: "1px solid var(--sand)", borderRadius: 100, fontSize: 13, outline: "none", width: 240, fontFamily: "'DM Sans',sans-serif" }} />
                </div>
                <div style={{ background: "white", borderRadius: 16, border: "1px solid var(--sand)", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--sand)" }}>
                        {["이름", "닉네임", "이메일", "역할", "가입일"].map((h) => (
                          <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 500, color: "var(--mid)", textAlign: "left", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: i < filteredUsers.length - 1 ? "1px solid rgba(212,196,168,0.3)" : "none" }}>
                          <td style={{ padding: "12px 16px", fontSize: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--lsage)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {u.avatar_url
                                  ? <img src={u.avatar_url} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="#8A9E7E"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                                }
                              </div>
                              {u.name}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 14, color: "var(--mid)" }}>{u.nickname}</td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--mid)" }}>{u.email}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 100, fontWeight: 500,
                              background: u.role === "admin" ? "rgba(200,113,74,0.1)" : u.role === "instructor" ? "rgba(74,103,65,0.1)" : "rgba(107,101,88,0.08)",
                              color: u.role === "admin" ? "var(--terra)" : u.role === "instructor" ? "var(--deep)" : "var(--mid)" }}>
                              {u.role === "admin" ? "관리자" : u.role === "instructor" ? "강사" : "학생"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--mid)" }}>{u.created_at.slice(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--mid)", fontSize: 14 }}>검색 결과가 없어요.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── 후기 관리 탭 ── */}
            {activeTab === "reviews" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 14, color: "var(--mid)" }}>총 <strong>{reviews.length}개</strong></div>
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="닉네임, 내용, 강의명 검색..."
                    style={{ padding: "9px 16px", border: "1px solid var(--sand)", borderRadius: 100, fontSize: 13, outline: "none", width: 240, fontFamily: "'DM Sans',sans-serif" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredReviews.map((r) => (
                    <div key={r.id} style={{ background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--sand)", display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontWeight: 500, fontSize: 14 }}>{r.reviewer_nickname}</span>
                          <span style={{ color: "var(--terra)", fontSize: 12 }}>{"★".repeat(r.rating)}<span style={{ color: "var(--sand)" }}>{"★".repeat(5 - r.rating)}</span></span>
                          <span style={{ fontSize: 11, color: "var(--sage)", background: "var(--lsage)", padding: "2px 8px", borderRadius: 100 }}>{r.course_title}</span>
                          <span style={{ fontSize: 11, color: "var(--mid)", marginLeft: "auto" }}>{r.created_at.slice(0, 10)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--mid)", lineHeight: 1.7 }}>{r.content}</p>
                      </div>
                      <button onClick={() => handleDeleteReview(r.id)}
                        style={{ padding: "6px 14px", background: "none", border: "1px solid #fcc", borderRadius: 100, fontSize: 12, color: "#c33", cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans',sans-serif" }}>
                        삭제
                      </button>
                    </div>
                  ))}
                  {filteredReviews.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "var(--mid)", fontSize: 14 }}>후기가 없어요.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer goTo={goTo} />
    </div>
  );
}