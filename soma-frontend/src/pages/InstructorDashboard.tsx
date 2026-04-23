import { useState, useEffect } from "react";
import type { Lecture, QnaQuestion, PageKey } from "@/types";
import { instructorCourseApi, uploadApi, qnaApi, type InstructorCourse, type LectureForm } from "@/api";
import Footer from "@/components/Footer";

interface Props {
  goTo: (page: PageKey, id?: number) => void;
}

const LEVELS = ["입문", "중급", "심화"] as const;

const EMPTY_COURSE = { title: "", description: "", level: "입문", price: "", is_live: false, duration_weeks: "", thumbnail_url: "" };
const EMPTY_LECTURE: LectureForm = { week: 1, title: "", duration_sec: 0, is_preview: false, video_url: "" };

// 유튜브 링크에서 ID 추출
function extractYoutubeId(input: string): string {
  if (!input) return "";
  // 이미 ID만 입력한 경우 (11자리 영숫자)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  try {
    const url = new URL(input);
    // youtu.be/ID
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0];
    // youtube.com/watch?v=ID
    return url.searchParams.get("v") ?? input;
  } catch {
    return input;
  }
}

export default function InstructorDashboard({ goTo }: Props) {
  const [courses, setCourses]         = useState<InstructorCourse[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<InstructorCourse | null>(null);
  const [lectures, setLectures]       = useState<Lecture[]>([]);
  const [activeTab, setActiveTab]     = useState<"curriculum" | "qna">("curriculum");
  const [qnas, setQnas]               = useState<QnaQuestion[]>([]);
  const [answerInputs, setAnswerInputs] = useState<Record<number, string>>({});
  const [openQna, setOpenQna]         = useState<number | null>(null);

  // 모달 상태
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse]   = useState<InstructorCourse | null>(null);
  const [courseForm, setCourseForm]         = useState(EMPTY_COURSE);

  const [showLectureForm, setShowLectureForm] = useState(false);
  const [editingLecture, setEditingLecture]   = useState<Lecture | null>(null);
  const [lectureForm, setLectureForm]         = useState<LectureForm>(EMPTY_LECTURE);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [youtubeInput, setYoutubeInput]       = useState("");

  useEffect(() => {
    instructorCourseApi.list()
      .then((res) => setCourses(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadLectures = async (courseId: number) => {
    const res = await instructorCourseApi.getLectures(courseId);
    setLectures(res.data ?? []);
  };

  const selectCourse = (c: InstructorCourse) => {
    setSelectedCourse(c);
    setActiveTab("curriculum");
    loadLectures(c.id);
    qnaApi.list(c.id).then((res) => setQnas(res.data ?? [])).catch(() => {});
  };

  const handleAnswerSubmit = async (questionId: number) => {
    if (!selectedCourse) return;
    const content = answerInputs[questionId];
    if (!content?.trim()) return;
    try {
      const res = await qnaApi.createAnswer(selectedCourse.id, questionId, content);
      if (res.data) {
        setQnas((prev) => prev.map((q) =>
          q.id === questionId ? { ...q, answers: [...q.answers, res.data!], answer_count: q.answer_count + 1 } : q
        ));
        setAnswerInputs((prev) => ({ ...prev, [questionId]: "" }));
      }
    } catch (e) { alert((e as Error).message); }
  };

  const handleThumbnailUpload = async (file: File) => {    setThumbnailUploading(true);
    try {
      const url = await uploadApi.thumbnail(file);
      setCourseForm((p) => ({ ...p, thumbnail_url: url }));
    } catch (e) { alert((e as Error).message); }
    finally { setThumbnailUploading(false); }
  };

  // ── 강의 저장 ──────────────────────────────────────────────
  const handleSaveCourse = async () => {
    const body = {
      ...courseForm,
      price: Number(courseForm.price),
      duration_weeks: courseForm.duration_weeks ? Number(courseForm.duration_weeks) : undefined,
    };
    try {
      if (editingCourse) {
        await instructorCourseApi.update(editingCourse.id, { ...body, is_published: editingCourse.is_published });
        setCourses((prev) => prev.map((c) => c.id === editingCourse.id ? { ...c, ...body, is_live: body.is_live ? 1 : 0 } as InstructorCourse : c));
      } else {
        const res = await instructorCourseApi.create(body);
        if (res.data) {
          const newCourse: InstructorCourse = {
            id: res.data.id, ...body, is_live: body.is_live ? 1 : 0, is_published: 0,
            duration_weeks: body.duration_weeks ?? null, thumbnail_url: body.thumbnail_url || null,
            lecture_count: 0, total_hours: 0, enrollment_count: 0, avg_rating: null, review_count: 0,
            created_at: new Date().toISOString(),
          };
          setCourses((prev) => [newCourse, ...prev]);
        }
      }
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm(EMPTY_COURSE);
    } catch (e) { alert((e as Error).message); }
  };

  const handleDeleteCourse = async (courseId: number) => {
    const target = courses.find((c) => c.id === courseId);
    const hasStudents = target && target.enrollment_count > 0;
    const msg = hasStudents
      ? `"${target?.title}" 강의를 삭제할까요?\n⚠️ 수강생 ${target?.enrollment_count}명의 수강 데이터도 함께 삭제됩니다.`
      : `"${target?.title}" 강의를 삭제할까요?`;
    if (!window.confirm(msg)) return;
    try {
      await instructorCourseApi.delete(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
    } catch (e) { alert((e as Error).message); }
  };

  const handleTogglePublish = async (courseId: number) => {
    try {
      const res = await instructorCourseApi.togglePublish(courseId);
      if (res.data) {
        setCourses((prev) => prev.map((c) => c.id === courseId ? { ...c, is_published: res.data!.is_published as 0 | 1 } : c));
        if (selectedCourse?.id === courseId) setSelectedCourse((p) => p ? { ...p, is_published: res.data!.is_published as 0 | 1 } : p);
      }
    } catch (e) { alert((e as Error).message); }
  };

  // ── 강의 영상 저장 ─────────────────────────────────────────
  const handleSaveLecture = async () => {
    if (!selectedCourse) return;
    try {
      if (editingLecture) {
        await instructorCourseApi.updateLecture(selectedCourse.id, editingLecture.id, lectureForm);
        setLectures((prev) => prev.map((l) => l.id === editingLecture.id ? { ...l, ...lectureForm, is_preview: lectureForm.is_preview ? 1 : 0 } : l));
      } else {
        const res = await instructorCourseApi.addLecture(selectedCourse.id, lectureForm);
        if (res.data) {
          const newLec: Lecture = { id: res.data.id, ...lectureForm, is_preview: lectureForm.is_preview ? 1 : 0, sort_order: lectures.length + 1 };
          setLectures((prev) => [...prev, newLec]);
          setCourses((prev) => prev.map((c) => c.id === selectedCourse.id ? { ...c, lecture_count: c.lecture_count + 1 } : c));
        }
      }
      setShowLectureForm(false);
      setEditingLecture(null);
      setLectureForm(EMPTY_LECTURE);
    } catch (e) { alert((e as Error).message); }
  };

  const handleDeleteLecture = async (lectureId: number) => {
    if (!selectedCourse || !window.confirm("이 강의를 삭제할까요?")) return;
    try {
      await instructorCourseApi.deleteLecture(selectedCourse.id, lectureId);
      setLectures((prev) => prev.filter((l) => l.id !== lectureId));
      setCourses((prev) => prev.map((c) => c.id === selectedCourse.id ? { ...c, lecture_count: Math.max(0, c.lecture_count - 1) } : c));
    } catch (e) { alert((e as Error).message); }
  };

  const openEditCourse = (c: InstructorCourse) => {
    setEditingCourse(c);
    setCourseForm({ title: c.title, description: "", level: c.level, price: c.price.toString(), is_live: c.is_live === 1, duration_weeks: c.duration_weeks?.toString() ?? "", thumbnail_url: c.thumbnail_url ?? "" });
    setShowCourseForm(true);
  };

  const openEditLecture = (l: Lecture) => {
    setEditingLecture(l);
    setYoutubeInput(l.video_url ?? "");
    setLectureForm({ week: l.week, title: l.title, duration_sec: l.duration_sec, is_preview: l.is_preview === 1, video_url: l.video_url ?? "" });
    setShowLectureForm(true);
  };

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ background: "var(--dark)", padding: "48px 80px 36px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--terra)", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}></div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 300, color: "var(--cream)", marginBottom: 8 }}>
          내 <em style={{ fontStyle: "italic", color: "var(--sand)" }}>강의 관리</em>
        </h1>
        <p style={{ color: "rgba(245,240,232,0.45)", fontSize: 13 }}>총 {courses.length}개 강의</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedCourse ? "380px 1fr" : "1fr", gap: 0, minHeight: "calc(100vh - 200px)" }}>
        {/* 강의 목록 */}
        <div style={{ borderRight: selectedCourse ? "1px solid var(--sand)" : "none", padding: "32px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400 }}>강의 목록</div>
            <button style={S.addBtn} onClick={() => { setEditingCourse(null); setCourseForm(EMPTY_COURSE); setShowCourseForm(true); }}>
              + 새 강의
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--mid)" }}>불러오는 중...</div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--mid)" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}></div>
              <div style={{ fontSize: 14, marginBottom: 16 }}>아직 등록한 강의가 없어요</div>
              <button style={S.addBtn} onClick={() => setShowCourseForm(true)}>첫 강의 만들기</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {courses.map((c) => (
                <div key={c.id} style={{ ...S.courseCard, ...(selectedCourse?.id === c.id ? S.courseCardActive : {}) }}
                  onClick={() => selectCourse(c)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 400, flex: 1, marginRight: 8 }}>{c.title}</div>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 100, fontWeight: 500, background: c.is_published ? "rgba(74,103,65,0.15)" : "rgba(107,101,88,0.1)", color: c.is_published ? "var(--deep)" : "var(--mid)", flexShrink: 0 }}>
                      {c.is_published ? "공개" : "비공개"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginBottom: 10 }}>
                    {c.level} · 📹 {c.lecture_count}강 · 👥 {c.enrollment_count}명 · ⭐ {c.avg_rating ?? "-"}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={S.smBtn} onClick={(e) => { e.stopPropagation(); openEditCourse(c); }}>수정</button>
                    <button style={{ ...S.smBtn, color: c.is_published ? "var(--mid)" : "var(--deep)" }}
                      onClick={(e) => { e.stopPropagation(); handleTogglePublish(c.id); }}>
                      {c.is_published ? "비공개" : "공개"}
                    </button>
                    <button style={{ ...S.smBtn, color: "#c33" }} onClick={(e) => { e.stopPropagation(); handleDeleteCourse(c.id); }}>삭제</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 커리큘럼 관리 */}
        {selectedCourse && (
          <div style={{ padding: "32px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400 }}>{selectedCourse.title}</div>
                <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 4 }}>총 {lectures.length}강 · Q&A {qnas.length}개</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {activeTab === "curriculum" && (
                  <button style={S.addBtn} onClick={() => { setEditingLecture(null); setLectureForm(EMPTY_LECTURE); setYoutubeInput(""); setShowLectureForm(true); }}>
                    + 강의 추가
                  </button>
                )}
                <button style={{ ...S.smBtn, padding: "8px 14px" }} onClick={() => goTo("detail", selectedCourse.id)}>미리보기</button>
              </div>
            </div>

            {/* 탭 */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--sand)", marginBottom: 20, marginTop: 16 }}>
              {(["curriculum", "qna"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "10px 20px", fontSize: 13, background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab ? "var(--dark)" : "transparent"}`, color: activeTab === tab ? "var(--dark)" : "var(--mid)", cursor: "pointer", fontWeight: activeTab === tab ? 500 : 400, fontFamily: "'DM Sans',sans-serif", marginBottom: -1 }}>
                  {tab === "curriculum" ? `커리큘럼 (${lectures.length})` : `Q&A (${qnas.length})`}
                </button>
              ))}
            </div>

            {/* 통계 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
              {[
                ["수강생", `${selectedCourse.enrollment_count}명`],
                ["평점", `${selectedCourse.avg_rating ?? "-"} ★`],
                ["후기", `${selectedCourse.review_count}개`],
                ["수익", `₩${(selectedCourse.price * selectedCourse.enrollment_count).toLocaleString()}`],
              ].map(([label, val]) => (
                <div key={label} style={{ background: "var(--cream)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "var(--mid)", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* 커리큘럼 탭 */}
            {activeTab === "curriculum" && (
              lectures.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--mid)" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
                  <div style={{ fontSize: 14 }}>아직 강의가 없어요. 첫 강의를 추가해보세요!</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {lectures.map((l, i) => (
                    <div key={l.id} style={S.lecRow}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--lsage)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, color: "var(--deep)", fontWeight: 500 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 400, marginBottom: 2 }}>{l.title}</div>
                        <div style={{ fontSize: 11, color: "var(--mid)" }}>
                          {l.week}주차 · {Math.floor(l.duration_sec / 60)}분
                          {l.is_preview === 1 && <span style={{ marginLeft: 8, color: "var(--terra)" }}>무료 미리보기</span>}
                          {l.video_url && <span style={{ marginLeft: 8, color: "var(--deep)" }}>▶ 영상 있음</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button style={S.smBtn} onClick={() => openEditLecture(l)}>수정</button>
                        <button style={{ ...S.smBtn, color: "#c33" }} onClick={() => handleDeleteLecture(l.id)}>삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Q&A 탭 */}
            {activeTab === "qna" && (
              qnas.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--mid)" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: 14 }}>아직 질문이 없어요.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {qnas.map((q) => (
                    <div key={q.id} style={{ border: "1px solid var(--sand)", borderRadius: 14, overflow: "hidden" }}>
                      <div style={{ padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: openQna === q.id ? "var(--lsage)" : "white" }}
                        onClick={() => setOpenQna(openQna === q.id ? null : q.id)}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{q.content}</div>
                          <div style={{ fontSize: 11, color: "var(--mid)" }}>{q.author_nickname} · {q.created_at.slice(0,10)} · 답변 {q.answer_count}개</div>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--mid)", flexShrink: 0, marginLeft: 12 }}>{openQna === q.id ? "▲" : "▼"}</span>
                      </div>
                      {openQna === q.id && (
                        <div style={{ borderTop: "1px solid var(--sand)", background: "var(--warm)" }}>
                          {q.answers.map((a) => (
                            <div key={a.id} style={{ padding: "12px 18px 12px 32px", borderBottom: "1px solid rgba(212,196,168,0.3)" }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                                <span style={{ fontSize: 11, fontWeight: 500, color: a.role === "instructor" ? "var(--terra)" : "var(--deep)", background: a.role === "instructor" ? "rgba(200,113,74,0.1)" : "var(--lsage)", padding: "2px 8px", borderRadius: 100 }}>
                                  {a.role === "instructor" ? "강사" : a.author_nickname}
                                </span>
                                <span style={{ fontSize: 11, color: "var(--mid)" }}>{a.created_at.slice(0,10)}</span>
                              </div>
                              <p style={{ fontSize: 13, color: "var(--mid)", lineHeight: 1.7 }}>{a.content}</p>
                            </div>
                          ))}
                          {/* 답변 입력 */}
                          <div style={{ padding: "12px 18px", display: "flex", gap: 10 }}>
                            <input
                              value={answerInputs[q.id] ?? ""}
                              onChange={(e) => setAnswerInputs((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnswerSubmit(q.id); } }}
                              placeholder="답변을 입력하세요... (Enter로 등록)"
                              style={{ flex: 1, padding: "9px 14px", border: "1px solid var(--sand)", borderRadius: 100, fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
                            />
                            <button onClick={() => handleAnswerSubmit(q.id)}
                              style={{ padding: "9px 18px", background: "var(--terra)", color: "white", border: "none", borderRadius: 100, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                              답변 등록
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* 강의 등록/수정 모달 */}
      {showCourseForm && (
        <Modal title={editingCourse ? "강의 수정" : "새 강의 등록"} onClose={() => { setShowCourseForm(false); setEditingCourse(null); }}>
          <FormField label="강의 제목">
            <input style={S.input} value={courseForm.title} onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))} placeholder="강의 제목을 입력하세요" />
          </FormField>
          <FormField label="강의 설명">
            <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} value={courseForm.description} onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))} placeholder="강의 소개를 입력하세요" />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="레벨">
              <select style={S.input} value={courseForm.level} onChange={(e) => setCourseForm((p) => ({ ...p, level: e.target.value }))}>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </FormField>
            <FormField label="가격 (원)">
              <input style={{ ...S.input, MozAppearance: "textfield" } as React.CSSProperties} type="number" value={courseForm.price} onChange={(e) => setCourseForm((p) => ({ ...p, price: e.target.value }))} placeholder="예: 89000" min={0} />
            </FormField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="기간 (주, 비워두면 상시)">
              <input style={S.input} type="number" value={courseForm.duration_weeks} onChange={(e) => setCourseForm((p) => ({ ...p, duration_weeks: e.target.value }))} placeholder="예: 4" />
            </FormField>
            <FormField label="썸네일 이미지">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1.5px dashed var(--sand)", borderRadius: 10, cursor: "pointer", fontSize: 13, color: "var(--mid)" }}>
                  <span>📁</span>
                  <span>{thumbnailUploading ? "업로드 중..." : courseForm.thumbnail_url ? "이미지 변경" : "이미지 선택 (JPG, PNG, WEBP · 최대 5MB)"}</span>
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(f); }} />
                </label>
                {courseForm.thumbnail_url && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={courseForm.thumbnail_url} alt="썸네일" style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 6 }} />
                    <button style={{ fontSize: 12, color: "#c33", background: "none", border: "none", cursor: "pointer" }}
                      onClick={() => setCourseForm((p) => ({ ...p, thumbnail_url: "" }))}>제거</button>
                  </div>
                )}
              </div>
            </FormField>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--mid)", marginBottom: 20, cursor: "pointer" }}>
            <input type="checkbox" checked={courseForm.is_live} onChange={(e) => setCourseForm((p) => ({ ...p, is_live: e.target.checked }))} style={{ accentColor: "var(--terra)" }} />
            라이브 강의
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.cancelBtn} onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>취소</button>
            <button style={S.saveBtn} onClick={handleSaveCourse}>{editingCourse ? "수정 완료" : "강의 등록"}</button>
          </div>
        </Modal>
      )}

      {/* 강의 영상 추가/수정 모달 */}
      {showLectureForm && (
        <Modal title={editingLecture ? "강의 수정" : "강의 추가"} onClose={() => { setShowLectureForm(false); setEditingLecture(null); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="주차">
              <input style={S.input} type="number" min={1} value={lectureForm.week} onChange={(e) => setLectureForm((p) => ({ ...p, week: Number(e.target.value) }))} />
            </FormField>
            <FormField label="재생 시간 (초)">
              <input style={S.input} type="number" value={lectureForm.duration_sec} onChange={(e) => setLectureForm((p) => ({ ...p, duration_sec: Number(e.target.value) }))} placeholder="예: 1800 (30분)" />
            </FormField>
          </div>
          <FormField label="강의 제목">
            <input style={S.input} value={lectureForm.title} onChange={(e) => setLectureForm((p) => ({ ...p, title: e.target.value }))} placeholder="강의 제목을 입력하세요" />
          </FormField>
          <FormField label="유튜브 링크 또는 영상 ID">
            <input style={S.input} value={youtubeInput}
              onChange={(e) => {
                setYoutubeInput(e.target.value);
                setLectureForm((p) => ({ ...p, video_url: extractYoutubeId(e.target.value) }));
              }}
              placeholder="https://youtu.be/xxxxx 또는 영상 ID" />
            {lectureForm.video_url && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden" }}>
                <img
                  src={`https://img.youtube.com/vi/${lectureForm.video_url}/mqdefault.jpg`}
                  alt="미리보기"
                  style={{ width: "100%", height: 120, objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div style={{ fontSize: 11, color: "var(--mid)", marginTop: 4 }}>ID: {lectureForm.video_url}</div>
              </div>
            )}
          </FormField>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--mid)", marginBottom: 20, cursor: "pointer" }}>
            <input type="checkbox" checked={lectureForm.is_preview} onChange={(e) => setLectureForm((p) => ({ ...p, is_preview: e.target.checked }))} style={{ accentColor: "var(--terra)" }} />
            무료 미리보기 허용
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={S.cancelBtn} onClick={() => { setShowLectureForm(false); setEditingLecture(null); }}>취소</button>
            <button style={S.saveBtn} onClick={handleSaveLecture}>{editingLecture ? "수정 완료" : "강의 추가"}</button>
          </div>
        </Modal>
      )}

      <Footer goTo={goTo} />
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "white", borderRadius: 20, padding: 32, width: "min(560px,90vw)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--mid)" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "var(--mid)", marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  addBtn:          { padding: "9px 18px", background: "var(--dark)", color: "var(--cream)", border: "none", borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  smBtn:           { padding: "5px 12px", background: "none", border: "1px solid var(--sand)", borderRadius: 100, fontSize: 12, cursor: "pointer", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif" },
  courseCard:      { padding: "16px 18px", border: "1px solid var(--sand)", borderRadius: 14, cursor: "pointer", background: "white" },
  courseCardActive:{ borderColor: "var(--deep)", background: "var(--lsage)" },
  lecRow:          { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: "1px solid rgba(212,196,168,0.4)", borderRadius: 12, background: "white" },
  input:           { width: "100%", padding: "10px 14px", border: "1.5px solid var(--sand)", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "var(--dark)", background: "white" },
  saveBtn:         { padding: "11px 24px", background: "var(--dark)", color: "var(--cream)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  cancelBtn:       { padding: "11px 24px", background: "none", border: "1.5px solid var(--sand)", borderRadius: 100, fontSize: 14, cursor: "pointer", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif" },
};
