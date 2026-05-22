import { useState, useEffect, useRef } from "react";
import type { CourseDetail, Lecture, PageKey } from "@/types";
import { courseApi, progressApi } from "@/api";

interface PlayerProps {
  goTo:     (page: PageKey, id?: number) => void;
  courseId: number;
}

const DEFAULT_VIDEO = "0Ad4j-qlG04";

function loadTime(lecId: number): number {
  return Number(localStorage.getItem(`soma_lec_${lecId}`) ?? 0);
}

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function getVideoId(lec: Lecture): string {
  if (lec.video_url) return lec.video_url;
  return DEFAULT_VIDEO;
}

export default function Player({ goTo, courseId }: PlayerProps) {
  const [course, setCourse]       = useState<CourseDetail | null>(null);
  const [activeLec, setActiveLec] = useState<Lecture | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [sideOpen, setSideOpen]   = useState(true);
  const [startSec, setStartSec]   = useState(0);
  const [videoKey, setVideoKey]   = useState(0);
  const currentTimeRef            = useRef<number>(0);
  const activeLecIdRef            = useRef<number>(0);
  const playerRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef              = useRef<Set<number>>(new Set()); // ✅ 추가

  // ✅ completed 상태 바뀔 때 ref 동기화
  useEffect(() => {
    completedRef.current = completed;
  }, [completed]);

  // ✅ saveTime: 완료된 강의는 is_completed = true 유지
  const saveTime = (lecId: number, sec: number) => {
    localStorage.setItem(`soma_lec_${lecId}`, String(Math.floor(sec)));
    const isCompleted = completedRef.current.has(lecId);
    progressApi.save(lecId, Math.floor(sec), isCompleted).catch(() => {});
  };

  useEffect(() => {
    // ✅ 백엔드 진도 불러와서 완료 목록 + localStorage 동기화
    progressApi.myProgress().then((res) => {
      if (res.data) {
        const completedIds = new Set(
          res.data.filter((p) => p.is_completed).map((p) => p.lecture_id)
        );
        setCompleted(completedIds);
        completedRef.current = completedIds;
        res.data.forEach((p) => {
          if (p.watched_sec > 0)
            localStorage.setItem(`soma_lec_${p.lecture_id}`, String(p.watched_sec));
        });
      }
    }).catch(() => {});

    courseApi.detail(courseId).then((res) => {
      if (res.data) {
        setCourse(res.data);
        const first = Object.values(res.data.curriculum)[0] as Lecture[];
        if (first?.length) selectLec(first[0]);
      }
    }).catch(() => {});
  }, [courseId]);

  // YouTube iframe API: onReady 후 1초마다 getCurrentTime 폴링
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === "onReady") {
          if (playerRef.current) clearInterval(playerRef.current);
          playerRef.current = setInterval(() => {
            const iframe = document.querySelector("iframe[data-player]") as HTMLIFrameElement;
            iframe?.contentWindow?.postMessage(
              JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }),
              "*"
            );
          }, 1000);
        }
        if (data.event === "infoDelivery" && data.info?.currentTime != null) {
          currentTimeRef.current = data.info.currentTime;
          saveTime(activeLecIdRef.current, data.info.currentTime);
        }
      } catch {}
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (playerRef.current) clearInterval(playerRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeLec) activeLecIdRef.current = activeLec.id;
  }, [activeLec?.id]);

  useEffect(() => {
    const onUnload = () => saveTime(activeLecIdRef.current, currentTimeRef.current);
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const selectLec = (lec: Lecture) => {
    saveTime(activeLecIdRef.current, currentTimeRef.current);
    currentTimeRef.current = 0;
    setActiveLec(lec);
    setStartSec(loadTime(lec.id));
    setVideoKey((k) => k + 1);
  };

  const allLectures = course ? Object.values(course.curriculum).flat() as Lecture[] : [];
  const currentIdx  = activeLec ? allLectures.findIndex((l) => l.id === activeLec.id) : 0;
  const prevLec     = currentIdx > 0 ? allLectures[currentIdx - 1] : null;
  const nextLec     = currentIdx < allLectures.length - 1 ? allLectures[currentIdx + 1] : null;
  const videoId     = activeLec ? getVideoId(activeLec) : DEFAULT_VIDEO;

  const markComplete = () => {
    if (!activeLec) return;
  const newCompleted = new Set([...completed, activeLec.id]);
  setCompleted(newCompleted);
  completedRef.current = newCompleted;
  progressApi.save(activeLec.id, currentTimeRef.current, true).catch(() => {});
  if (nextLec) selectLec(nextLec);
};

  if (!course || !activeLec) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a", color: "rgba(255,255,255,0.5)" }}>
      강의를 불러오는 중...
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#1a1a1a" }}>
      {/* Top Bar */}
      <div style={S.topBar}>
        <button style={S.backBtn} onClick={() => { saveTime(activeLecIdRef.current, currentTimeRef.current); goTo("my"); }}>← 내 수업</button>
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Video */}
          <div style={S.videoBox}>
            <iframe
              key={videoKey}
              data-player="true"
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?start=${startSec}&autoplay=1&rel=0&enablejsapi=1`}
              title={activeLec.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: "block", border: "none" }}
            />
          </div>

          {/* Controls */}
          <div style={S.controls}>
            <button style={{ ...S.ctrlBtn, opacity: prevLec ? 1 : 0.3 }} disabled={!prevLec}
              onClick={() => prevLec && selectLec(prevLec)}>
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
            <button style={{ ...S.ctrlBtn, ...(completed.has(activeLec.id) ? S.ctrlBtnDone : S.ctrlBtnPrimary) }}
              onClick={markComplete}>
              {completed.has(activeLec.id) ? "✅ 완료됨" : nextLec ? "완료 후 다음 →" : "✅ 강의 완료"}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        {sideOpen && (
          <div style={S.sidebar}>
            <div style={S.sideHead}>커리큘럼</div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {(Object.entries(course.curriculum) as [string, Lecture[]][]).map(([wk, lecs]) => (
                <div key={wk}>
                  <div style={S.weekLabel}>{wk}주차</div>
                  {lecs.map((l) => {
                    const isActive = l.id === activeLec.id;
                    const isDone   = completed.has(l.id);
                    const saved    = loadTime(l.id);
                    return (
                      <div key={l.id} style={{ ...S.lecRow, ...(isActive ? S.lecRowActive : {}) }}
                        onClick={() => selectLec(l)}>
                        <div style={{ ...S.lecIcon, background: isDone ? "var(--deep)" : isActive ? "var(--terra)" : "rgba(255,255,255,0.08)" }}>
                          {isDone ? "✓" : isActive ? "▶" : l.sort_order}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: isActive ? "white" : "rgba(255,255,255,0.7)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.title}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                            {saved > 0 ? `${fmtSec(saved)}까지 시청` : fmtSec(l.duration_sec)}
                          </div>
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
  topBar:         { height: 56, background: "#111", display: "flex", alignItems: "center", padding: "0 20px", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  backBtn:        { fontSize: 13, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", padding: "6px 0" },
  topTitle:       { flex: 1, fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sideToggle:     { fontSize: 12, color: "rgba(255,255,255,0.4)", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  videoBox:       { flex: 1, background: "#0d0d0d", overflow: "hidden" },
  controls:       { height: 80, background: "#111", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  ctrlBtn:        { padding: "9px 20px", borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "'DM Sans',sans-serif", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" },
  ctrlBtnPrimary: { background: "var(--terra)", color: "white" },
  ctrlBtnDone:    { background: "var(--deep)", color: "white" },
  sidebar:        { width: 320, background: "#161616", borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 },
  sideHead:       { padding: "18px 20px 12px", fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 },
  weekLabel:      { padding: "12px 20px 6px", fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--terra)" },
  lecRow:         { display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", cursor: "pointer" },
  lecRowActive:   { background: "rgba(200,113,74,0.1)" },
  lecIcon:        { width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", flexShrink: 0 },
};