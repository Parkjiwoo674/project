import { useState, useEffect, useRef } from "react";
import type { CourseDetail as ICourseDetail, Review, QnaQuestion, PageKey } from "@/types";
import { courseApi, enrollmentApi, reviewApi, qnaApi } from "@/api";
import Footer from "@/components/Footer";

interface DetailProps {
  goTo:      (page: PageKey, id?: number) => void;
  courseId:  number;
  loggedIn:  boolean;
  userId?:   number;
}

function fmtSec(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}분`;
}

export default function CourseDetail({ goTo, courseId, loggedIn, userId }: DetailProps) {
  const [course, setCourse]           = useState<ICourseDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [enrolling, setEnrolling]     = useState(false);
  const [wishlisted, setWishlisted]   = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPaused, setPreviewPaused] = useState(false);
  const previewLeft = useRef(30);

  // 후기
  const [reviews, setReviews]         = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Q&A
  const [qnas, setQnas]               = useState<QnaQuestion[]>([]);
  const [qnaInput, setQnaInput]       = useState("");
  const [answerInputs, setAnswerInputs] = useState<Record<number, string>>({});
  const [openQna, setOpenQna]         = useState<number | null>(null);

  useEffect(() => {
    if (!showPreview) { previewLeft.current = 30; setPreviewPaused(false); return; }
    if (previewPaused) return;
    const t = setInterval(() => {
      previewLeft.current -= 1;
      if (previewLeft.current <= 0) { clearInterval(t); setShowPreview(false); }
    }, 1000);
    return () => clearInterval(t);
  }, [showPreview, previewPaused]);

  useEffect(() => {
    setLoading(true);
    courseApi.detail(courseId)
      .then((res) => {
        if (res.data) {
          setCourse(res.data);
          setWishlisted(res.data.isWishlisted);
          setReviews(res.data.reviews);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    qnaApi.list(courseId).then((res) => {
      if (res.data) setQnas(res.data);
    }).catch(() => {});
  }, [courseId]);

  const handleEnroll = async () => {
    if (!loggedIn) { if (window.confirm("로그인이 필요합니다. 이동할까요?")) goTo("auth"); return; }
    if (!course) return;
    // 결제 페이지로 이동
    goTo("payment", course.id);
  };

  const handleWishlist = async () => {
    if (!loggedIn) { if (window.confirm("로그인이 필요합니다. 이동할까요?")) goTo("auth"); return; }
    if (!course) return;
    try {
      const res = await enrollmentApi.toggleWishlist(course.id);
      if (res.data) setWishlisted(res.data.wishlisted);
    } catch (e) { alert((e as Error).message); }
  };

  const handleReviewSubmit = async () => {
    if (!loggedIn) { if (window.confirm("로그인이 필요합니다. 이동할까요?")) goTo("auth"); return; }
    if (!course || !reviewContent.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await reviewApi.create(course.id, { rating: reviewRating, content: reviewContent });
      if (res.data) {
        setReviews((prev) => [res.data!, ...prev]);
        setReviewContent("");
        setReviewRating(5);
        setCourse((p) => p ? { ...p, review_count: p.review_count + 1 } : p);
      }
    } catch (e) { alert((e as Error).message); }
    finally { setSubmittingReview(false); }
  };

  const handleReviewDelete = async (reviewId: number) => {
    if (!course || !window.confirm("후기를 삭제할까요?")) return;
    try {
      await reviewApi.delete(course.id, reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setCourse((p) => p ? { ...p, review_count: Math.max(0, p.review_count - 1) } : p);
    } catch (e) { alert((e as Error).message); }
  };

  const handleQnaSubmit = async () => {
    if (!loggedIn) { if (window.confirm("로그인이 필요합니다. 이동할까요?")) goTo("auth"); return; }
    if (!course || !qnaInput.trim()) return;
    try {
      const res = await qnaApi.createQuestion(course.id, qnaInput);
      if (res.data) { setQnas((prev) => [res.data!, ...prev]); setQnaInput(""); }
    } catch (e) { alert((e as Error).message); }
  };

  const handleAnswerSubmit = async (questionId: number) => {
    if (!loggedIn || !course) return;
    const content = answerInputs[questionId];
    if (!content?.trim()) return;
    try {
      const res = await qnaApi.createAnswer(course.id, questionId, content);
      if (res.data) {
        setQnas((prev) => prev.map((q) =>
          q.id === questionId ? { ...q, answers: [...q.answers, res.data!] } : q
        ));
        setAnswerInputs((prev) => ({ ...prev, [questionId]: "" }));
      }
    } catch (e) { alert((e as Error).message); }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 120, color: "var(--mid)" }}>불러오는 중...</div>;
  if (!course) return <div style={{ textAlign: "center", padding: 120, color: "var(--mid)" }}>강의를 찾을 수 없습니다.</div>;

  return (
    <div style={{ paddingTop: 80 }}>
      {/* 미리보기 모달 */}
      {showPreview && (() => {
        const firstVideo = Object.values(course.curriculum).flat()[0]?.video_url;
        if (!firstVideo) return null;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowPreview(false)}>
            <div style={{ width: "min(860px, 90vw)", aspectRatio: "16/9", position: "relative" }} onClick={(e) => e.stopPropagation()}>
              <iframe
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${firstVideo}?autoplay=1&rel=0&enablejsapi=1`}
                title="미리보기"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 12, display: "block" }}
                onLoad={(e) => {
                  const handler = (ev: MessageEvent) => {
                    try {
                      const data = JSON.parse(ev.data);
                      if (data.event === "onStateChange") setPreviewPaused(data.info !== 1);
                    } catch {}
                  };
                  window.addEventListener("message", handler);
                  (e.target as HTMLIFrameElement).dataset.handler = "set";
                  return () => window.removeEventListener("message", handler);
                }}
              />
              <button onClick={() => setShowPreview(false)}
                style={{ position: "absolute", top: -40, right: 0, background: "none", border: "none", color: "white", fontSize: 28, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        );
      })()}
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
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--sage)", overflow: "hidden", flexShrink: 0 }}>
              {course.instructor_avatar
                ? <img src={course.instructor_avatar} alt={course.instructor_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <img src="/soma-removebg-preview.png" alt={course.instructor_name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              }
            </div>
            <div>
              <div style={{ fontSize: 14, color: "var(--cream)", fontWeight: 500 }}>{course.instructor_name}</div>
              <div style={{ fontSize: 12, color: "rgba(245,240,232,0.4)" }}>RYT 500 · 경력 10년</div>
            </div>
          </div>
        </div>

        {/* Enroll Card */}
        <div style={S.enrollCard}>
          {/* 썸네일 or 미리보기 */}
          {(() => {
            const firstVideo = Object.values(course.curriculum).flat()[0]?.video_url;
            const hasPreview = !!firstVideo;
            const thumbSrc = course.thumbnail_url
              || (firstVideo ? `https://img.youtube.com/vi/${firstVideo}/maxresdefault.jpg` : null);
            return (
              <div style={{ height: 180, position: "relative", overflow: "hidden", cursor: hasPreview ? "pointer" : "default", background: "var(--lsage)" }}
                onClick={() => hasPreview && setShowPreview(true)}>
                {thumbSrc
                  ? <img src={thumbSrc} alt="썸네일" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>🧘</div>
                }
                {hasPreview && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>▶</div>
                  </div>
                )}
              </div>
            );
          })()}
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
          {course.description && (
            <Section title="이런 것을 배워요">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {course.description.split("\n").filter((l) => l.trim()).map((l) => (
                  <div key={l} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--mid)" }}>
                    <span style={{ color: "var(--deep)", fontWeight: 700, flexShrink: 0 }}>✓</span>{l.trim()}
                  </div>
                ))}
              </div>
            </Section>
          )}

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
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, lineHeight: 1 }}>{course.avg_rating ?? "-"}</div>
                <div style={{ color: "var(--terra)", fontSize: 16 }}>{"★".repeat(Math.round(course.avg_rating ?? 0))}</div>
                <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 4 }}>{course.review_count}개 후기</div>
              </div>
            </div>

            {/* 후기 작성 폼 */}
            {loggedIn && course.isEnrolled && (
              <div style={{ background: "var(--lsage)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>후기 작성</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} onClick={() => setReviewRating(n)}
                      style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", color: n <= reviewRating ? "var(--terra)" : "var(--sand)" }}>★</button>
                  ))}
                </div>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="수강 후기를 작성해주세요..."
                  style={{ width: "100%", minHeight: 80, padding: "10px 14px", border: "1px solid var(--sand)", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none" }}
                />
                <button onClick={handleReviewSubmit} disabled={submittingReview || !reviewContent.trim()}
                  style={{ marginTop: 10, padding: "9px 22px", background: "var(--deep)", color: "white", border: "none", borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: !reviewContent.trim() ? 0.5 : 1 }}>
                  {submittingReview ? "등록 중..." : "후기 등록"}
                </button>
              </div>
            )}

            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--mid)", fontSize: 14 }}>아직 후기가 없어요. 첫 번째 후기를 남겨보세요!</div>
            ) : reviews.map((r) => (
              <div key={r.id} style={{ background: "var(--cream)", borderRadius: 14, padding: 20, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#D9D9D9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#9E9E9E"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{r.reviewer_nickname}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "var(--mid)" }}>{r.created_at.slice(0, 10)}</div>
                    {loggedIn && userId && (
                      <button onClick={() => handleReviewDelete(r.id)}
                        style={{ fontSize: 11, color: "var(--mid)", background: "none", border: "none", cursor: "pointer" }}>삭제</button>
                    )}
                  </div>
                </div>
                <div style={{ color: "var(--terra)", fontSize: 13, marginBottom: 7 }}>{"★".repeat(r.rating)}</div>
                <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 13, lineHeight: 1.8, color: "var(--mid)", fontWeight: 300 }}>{r.content}</p>
              </div>
            ))}
          </Section>

          {/* Q&A */}
          <Section title="Q&A">
            <div style={{ background: "var(--lsage)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <textarea
                value={qnaInput}
                onChange={(e) => setQnaInput(e.target.value)}
                placeholder={loggedIn ? "강의에 대해 궁금한 점을 질문해보세요..." : "로그인 후 질문할 수 있습니다."}
                disabled={!loggedIn}
                style={{ width: "100%", minHeight: 72, padding: "10px 14px", border: "1px solid var(--sand)", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none" }}
              />
              <button onClick={handleQnaSubmit} disabled={!loggedIn || !qnaInput.trim()}
                style={{ marginTop: 10, padding: "9px 22px", background: "var(--terra)", color: "white", border: "none", borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: !loggedIn || !qnaInput.trim() ? 0.5 : 1 }}>
                질문 등록
              </button>
            </div>

            {qnas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--mid)", fontSize: 14 }}>아직 질문이 없어요.</div>
            ) : qnas.map((q) => (
              <div key={q.id} style={{ border: "1px solid var(--sand)", borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
                  onClick={() => setOpenQna(openQna === q.id ? null : q.id)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{q.content}</div>
                    <div style={{ fontSize: 11, color: "var(--mid)" }}>{q.author_nickname} · {q.created_at.slice(0,10)} · 답변 {q.answer_count}개</div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--mid)" }}>{openQna === q.id ? "▲" : "▼"}</span>
                </div>
                {openQna === q.id && (
                  <div style={{ borderTop: "1px solid var(--sand)", background: "var(--warm)" }}>
                    {q.answers.map((a) => (
                      <div key={a.id} style={{ padding: "14px 20px 14px 36px", borderBottom: "1px solid rgba(212,196,168,0.3)" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: a.role === "instructor" ? "var(--terra)" : "var(--deep)", background: a.role === "instructor" ? "rgba(200,113,74,0.1)" : "var(--lsage)", padding: "2px 8px", borderRadius: 100 }}>
                            {a.role === "instructor" ? "강사" : a.author_nickname}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--mid)" }}>{a.created_at.slice(0,10)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--mid)", lineHeight: 1.7 }}>{a.content}</p>
                      </div>
                    ))}
                    {loggedIn && (
                      <div style={{ padding: "12px 20px", display: "flex", gap: 10 }}>
                        <input
                          value={answerInputs[q.id] ?? ""}
                          onChange={(e) => setAnswerInputs((prev) => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="답변을 입력하세요..."
                          style={{ flex: 1, padding: "8px 14px", border: "1px solid var(--sand)", borderRadius: 100, fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                        />
                        <button onClick={() => handleAnswerSubmit(q.id)}
                          style={{ padding: "8px 18px", background: "var(--deep)", color: "white", border: "none", borderRadius: 100, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                          등록
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Section>
        </div>

        {/* Related — 같은 강사의 다른 강의 */}
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400, marginBottom: 16, paddingBottom: 13, borderBottom: "1px solid var(--sand)" }}>
            강사의 다른 강의
          </div>
          <RelatedCourses courseId={courseId} goTo={goTo} />
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

function RelatedCourses({ courseId, goTo }: { courseId: number; goTo: (p: PageKey, id?: number) => void }) {
  const [related, setRelated] = useState<import("@/types").Course[]>([]);
  useEffect(() => {
    courseApi.list({ limit: 5 }).then((res) => {
      setRelated(res.data.filter((c) => c.id !== courseId).slice(0, 4));
    }).catch(() => {});
  }, [courseId]);

  const GRADS = [
    "linear-gradient(135deg,#D4E8D4,#A8C8A0)",
    "linear-gradient(135deg,#E8D4C4,#D4A88A)",
    "linear-gradient(135deg,#D4D8E8,#A0A8C8)",
    "linear-gradient(135deg,#F5E6D4,#E8C8A0)",
  ];

  return (
    <>
      {related.map((m, i) => (
        <div key={m.id} style={S.relCard} onClick={() => goTo("detail", m.id)}>
          <div style={{ width: 68, height: 68, borderRadius: 10, overflow: "hidden", background: GRADS[i % 4], flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {m.thumbnail_url
              ? <img src={m.thumbnail_url} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 28 }}>🧘</span>
            }
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, marginBottom: 4 }}>{m.title}</div>
            <div style={{ fontSize: 12, color: "var(--mid)" }}>{m.level} · {m.duration_weeks ? `${m.duration_weeks}주` : "상시"} · ⭐ {m.avg_rating ?? "-"}</div>
          </div>
        </div>
      ))}
    </>
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
