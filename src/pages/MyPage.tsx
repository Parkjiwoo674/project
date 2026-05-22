import { useState, useEffect } from "react";
import type { Enrollment, PageKey, User } from "@/types";
import { enrollmentApi, paymentApi, userApi, uploadApi } from "@/api";
import Footer from "@/components/Footer";

interface MyPageProps {
  goTo: (page: PageKey, id?: number) => void;
  onUpdate: (updated: Partial<User>) => void;
}

interface ProfileForm {
  nickname: string;
  avatar_url: string;
}

interface PaymentStats {
  totalPaid: number;
  totalRefunded: number;
  netSpent: number;
}

const GRADS = [
  "linear-gradient(135deg,#D4E8D4,#A8C8A0)",
  "linear-gradient(135deg,#E8D4C4,#D4A88A)",
  "linear-gradient(135deg,#D4D8E8,#A0A8C8)",
  "linear-gradient(135deg,#F5E6D4,#E8C8A0)",
  "linear-gradient(135deg,#E4D4E8,#C8A8D4)",
  "linear-gradient(135deg,#D4EAE4,#A0C8BE)",
];

export default function MyPage({ goTo, onUpdate }: MyPageProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [profile, setProfile] = useState<ProfileForm>({ nickname: "", avatar_url: "" });
  const [stats, setStats] = useState<PaymentStats>({ totalPaid: 0, totalRefunded: 0, netSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    Promise.all([
      enrollmentApi.myList(),
      userApi.getProfile(),
      paymentApi.myPayments(),
    ])
      .then(([enrollRes, profileRes, paymentRes]) => {
        setEnrollments(enrollRes.data ?? []);
        if (profileRes.data) {
          setProfile({
            nickname: profileRes.data.nickname ?? "",
            avatar_url: profileRes.data.avatar_url ?? "",
          });
        }

        // 결제 통계 계산
        const payments = paymentRes.data ?? [];
        const totalPaid = payments
          .filter((p: any) => p.status === "done")
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const totalRefunded = payments
          .filter((p: any) => p.status === "canceled")
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        setStats({
          totalPaid,
          totalRefunded,
          netSpent: totalPaid - totalRefunded,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadApi.avatar(file);
      setProfile((p) => ({ ...p, avatar_url: url }));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await userApi.updateProfile(profile);
      onUpdate({ nickname: profile.nickname, avatar_url: profile.avatar_url });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setEditMode(false);
      }, 1500);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (courseId: number, title: string) => {
    if (!window.confirm(`"${title}" 수강을 취소할까요?\n진도 데이터도 함께 삭제됩니다.`))
      return;
    try {
      await enrollmentApi.cancel(courseId);
      setEnrollments((prev) => prev.filter((e) => e.course_id !== courseId));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 80, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mid)" }}>
        불러오는 중...
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "var(--dark)", padding: "56px 80px 44px" }}>
        <div style={S.label}>마이페이지</div>
        <h1 style={S.h1}>
          내 <em style={{ fontStyle: "italic", color: "var(--sand)" }}>학습 현황</em>
        </h1>
      </div>

      {/* Content */}
      <div style={{ padding: "48px 80px 80px" }}>
        {/* 프로필 + 결제 통계 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 48 }}>
          {/* 프로필 카드 */}
          <div style={S.profileCard}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={S.avatarLarge}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 40 }}>🧘</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                {editMode ? (
                  <input
                    style={S.nicknameInput}
                    value={profile.nickname}
                    onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
                    placeholder="닉네임"
                  />
                ) : (
                  <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{profile.nickname}</div>
                )}
              </div>
            </div>

            {editMode ? (
              <>
                <label style={S.uploadLabel}>
                  <span>📷</span>
                  <span>{uploading ? "업로드 중..." : "사진 변경"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                    }}
                  />
                </label>
                {profile.avatar_url && (
                  <button
                    onClick={() => setProfile((p) => ({ ...p, avatar_url: "" }))}
                    style={S.removeBtn}
                  >
                    사진 제거
                  </button>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button onClick={() => setEditMode(false)} style={S.cancelBtn}>
                    취소
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving} style={S.saveBtn}>
                    {saved ? "✓ 저장됨" : saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} style={S.editBtn}>
                프로필 수정
              </button>
            )}
          </div>

          {/* 결제 통계 카드 */}
          <div style={S.statsCard}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "var(--dark)" }}>
              💰 결제 통계
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <div style={S.statBox}>
                <div style={S.statLabel}>총 결제</div>
                <div style={S.statValue}>{formatPrice(stats.totalPaid)}</div>
              </div>
              <div style={S.statBox}>
                <div style={S.statLabel}>환불</div>
                <div style={{ ...S.statValue, color: "#e74c3c" }}>
                  -{formatPrice(stats.totalRefunded)}
                </div>
              </div>
              <div style={{ ...S.statBox, background: "var(--lsage)", border: "2px solid var(--sage)" }}>
                <div style={S.statLabel}>실제 사용</div>
                <div style={{ ...S.statValue, color: "var(--deep)", fontWeight: 600 }}>
                  {formatPrice(stats.netSpent)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 수강 중인 강의 */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: "var(--dark)" }}>
            📚 수강 중인 강의 ({enrollments.length})
          </h2>
        </div>

        {enrollments.length === 0 ? (
          <div style={S.emptyBox}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, marginBottom: 10 }}>
              아직 수강 중인 강의가 없어요
            </div>
            <p style={{ fontSize: 14, color: "var(--mid)", marginBottom: 24 }}>
              마음에 드는 강의를 찾아 수강 신청해보세요
            </p>
            <button style={S.btn} onClick={() => goTo("courses")}>
              강의 둘러보기
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {enrollments.map((e, i) => (
              <div key={e.enrollment_id} style={S.card}>
                {/* 썸네일 */}
                <div
                  style={{
                    height: 160,
                    background: GRADS[i % 6],
                    cursor: "pointer",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 56,
                  }}
                  onClick={() => goTo("player", e.course_id)}
                >
                  {e.thumbnail_url ? (
                    <img
                      src={e.thumbnail_url}
                      alt={e.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span>🧘</span>
                  )}
                </div>

                <div style={{ padding: "18px 18px 20px" }}>
                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: 18,
                      fontWeight: 400,
                      marginBottom: 4,
                      cursor: "pointer",
                    }}
                    onClick={() => goTo("player", e.course_id)}
                  >
                    {e.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginBottom: 14 }}>
                    👤 {e.instructor_name}
                  </div>

                  {/* 진도율 */}
                  <div style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--mid)",
                        marginBottom: 6,
                      }}
                    >
                      <span>진도율</span>
                      <span style={{ fontWeight: 500, color: "var(--deep)" }}>
                        {e.progress_rate}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        background: "var(--sand)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${e.progress_rate}%`,
                          background: "var(--deep)",
                          borderRadius: 4,
                          transition: "width 0.4s",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--mid)", marginTop: 5 }}>
                      {e.completed_lectures} / {e.lecture_count}강 완료
                    </div>
                  </div>

                  <button style={S.playBtn} onClick={() => goTo("player", e.course_id)}>
                    {e.progress_rate === 0
                      ? "▶ 학습 시작"
                      : e.progress_rate === 100
                      ? "✅ 완료"
                      : "▶ 이어서 듣기"}
                  </button>
                  <button
                    style={{
                      ...S.cancelBtn2,
                      opacity: e.completed_lectures > 0 ? 0.4 : 1,
                      cursor: e.completed_lectures > 0 ? "not-allowed" : "pointer",
                    }}
                    onClick={() => {
                      if (e.completed_lectures > 0) {
                        alert("완료한 강의가 있어 수강 취소가 불가합니다.");
                        return;
                      }
                      handleCancel(e.course_id, e.title);
                    }}
                  >
                    {e.completed_lectures > 0 ? "취소 불가" : "수강 취소"}
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
  label: {
    fontSize: 11,
    letterSpacing: "0.3em",
    color: "var(--sage)",
    textTransform: "uppercase",
    fontWeight: 500,
    marginBottom: 14,
  },
  h1: {
    fontFamily: "'Cormorant Garamond',serif",
    fontSize: "clamp(28px,3.5vw,44px)",
    fontWeight: 300,
    color: "var(--cream)",
    lineHeight: 1.15,
  },
  profileCard: {
    background: "white",
    padding: 24,
    borderRadius: 16,
    border: "1px solid rgba(212,196,168,0.4)",
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    overflow: "hidden",
    background: "var(--lsage)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nicknameInput: {
    width: "100%",
    padding: "8px 12px",
    border: "1.5px solid var(--sand)",
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'DM Sans',sans-serif",
    outline: "none",
  },
  uploadLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    border: "1px solid var(--sand)",
    borderRadius: 100,
    fontSize: 13,
    color: "var(--mid)",
    cursor: "pointer",
    marginBottom: 8,
  },
  removeBtn: {
    marginLeft: 8,
    fontSize: 12,
    color: "#c33",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  editBtn: {
    width: "100%",
    padding: "10px 0",
    background: "var(--dark)",
    color: "white",
    border: "none",
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
  },
  cancelBtn: {
    flex: 1,
    padding: "10px 0",
    background: "none",
    border: "1.5px solid var(--sand)",
    borderRadius: 100,
    fontSize: 13,
    cursor: "pointer",
    color: "var(--mid)",
    fontFamily: "'DM Sans',sans-serif",
  },
  saveBtn: {
    flex: 1,
    padding: "10px 0",
    background: "var(--deep)",
    color: "white",
    border: "none",
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
  },
  statsCard: {
    background: "white",
    padding: 24,
    borderRadius: 16,
    border: "1px solid rgba(212,196,168,0.4)",
  },
  statBox: {
    padding: 16,
    background: "var(--warm)",
    borderRadius: 12,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "var(--mid)",
    marginBottom: 8,
    fontWeight: 500,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 600,
    color: "var(--dark)",
  },
  emptyBox: {
    textAlign: "center",
    padding: "80px 0",
    color: "var(--mid)",
  },
  btn: {
    padding: "12px 28px",
    background: "var(--dark)",
    color: "var(--cream)",
    border: "none",
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(212,196,168,0.4)",
  },
  playBtn: {
    display: "block",
    width: "100%",
    padding: "11px 0",
    background: "var(--terra)",
    color: "white",
    border: "none",
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
    marginBottom: 8,
  },
  cancelBtn2: {
    display: "block",
    width: "100%",
    padding: "9px 0",
    background: "none",
    color: "var(--mid)",
    border: "1px solid var(--sand)",
    borderRadius: 100,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
  },
};
