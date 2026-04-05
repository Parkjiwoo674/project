import type { PageKey } from "@/types";
import Footer from "@/components/Footer";

interface LandingProps {
  goTo: (page: PageKey) => void;
}

const FEATURES = [
  ["01", "🌿", "맞춤형 커리큘럼", "초보자부터 중급자까지, 나의 수준에 맞는 클래스를 자동으로 추천합니다."],
  ["02", "🎥", "4K 고화질 강의", "세밀한 동작 하나하나를 놓치지 않도록 멀티 앵글 4K 카메라로 촬영합니다."],
  ["03", "🕐", "라이브 & VOD", "매일 진행되는 실시간 라이브 클래스와 언제든 볼 수 있는 VOD를 제공합니다."],
] as const;

const COURSES = [
  { emoji: "🧘‍♀️", thumb: "t1", badge: "🔥 인기", level: "입문 · 4주 과정", name: "아침을 여는 하타 요가", desc: "하루를 상쾌하게 시작하는 30분 루틴.", meta: "📹 32강 · ⭐ 4.9 · 3.2k명" },
  { emoji: "🏋️‍♀️", thumb: "t2", badge: "✨ 신규", level: "중급 · 8주 과정", name: "파워 빈야사 플로우",   desc: "전신 근력을 키우는 역동적인 과정.",  meta: "📹 56강 · ⭐ 4.8 · 1.8k명" },
  { emoji: "🌿",   thumb: "t3", badge: "🌙 야간", level: "전체 · 상시",     name: "숙면을 위한 인 요가",  desc: "하루의 긴장을 풀어주는 저녁 루틴.", meta: "📹 24강 · ⭐ 5.0 · 2.5k명" },
];

const TESTIMONIALS = [
  { av: "av1", em: "🌸", text: "운동이라곤 전혀 몰랐는데, 소마 덕분에 3개월 만에 완전히 달라졌어요. 강의가 체계적이고 설명이 너무 친절해서 포기하지 않을 수 있었어요.", name: "박지은", sub: "직장인 · 3개월" },
  { av: "av2", em: "🌿", text: "새벽 5시에 혼자 매트 펴고 수업 들으면서 하루를 여는 게 이제 제 루틴이 됐어요. 화질도 선명하고 편집도 깔끔해서 집중이 잘 돼요.", name: "이민준", sub: "프리랜서 · 6개월" },
  { av: "av3", em: "🌙", text: "유튜브 무료 강의랑 차원이 다릅니다. 자세 교정 포인트를 꼼꼼하게 짚어줘서 부상 없이 실력이 늘고 있어요.", name: "정수아", sub: "입문자 · 2개월" },
];

const thumbGrad: Record<string, string> = {
  t1: "linear-gradient(135deg,#D4E8D4,#A8C8A0)",
  t2: "linear-gradient(135deg,#E8D4C4,#D4A88A)",
  t3: "linear-gradient(135deg,#D4D8E8,#A0A8C8)",
};
const avBg: Record<string, string> = { av1: "#D4E8D4", av2: "#E8D4C4", av3: "#D4D8E8" };

export default function Landing({ goTo }: LandingProps) {
  return (
    <div>
      {/* ── Hero ── */}
      <section style={S.hero}>
        <div style={S.heroLeft}>
          <div style={S.eyebrow}>온라인 요가 클래스</div>
          <h1 style={S.heroTitle}>
            몸과 마음이<br />
            <em style={{ fontStyle: "italic", color: "var(--deep)" }}>하나가 되는</em><br />
            순간
          </h1>
          <p style={S.heroSub}>
            언제 어디서든, 나만의 속도로.<br />
            국내 최고 강사진과 함께하는 프리미엄 요가 인강으로 진정한 웰니스를 경험하세요.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button style={S.btnDark}  onClick={() => goTo("courses")}>클래스 둘러보기</button>
            <button style={S.btnGhost} onClick={() => goTo("auth")}>가입하기 →</button>
          </div>
          <div style={S.heroStats}>
            {(["12k+|수강생", "180+|클래스", "4.9|평균 평점"] as const).map((s) => {
              const [num, lbl] = s.split("|");
              return (
                <div key={lbl}>
                  <div style={S.statNum}>{num}</div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 2 }}>{lbl}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={S.heroRight}>
          <div style={S.heroBg} />
          <div style={S.heroEmoji}>🧘</div>

        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "100px 80px", background: "var(--cream)" }}>
        <div style={{ maxWidth: 540, marginBottom: 60 }}>
          <div style={S.sLabel}>왜 소마인가</div>
          <h2 style={S.sTitle}>다른 곳에선 경험할 수<br /><em style={{ fontStyle: "italic", color: "var(--deep)" }}>없는 것들</em></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
          {FEATURES.map(([num, icon, title, desc]) => (
            <div key={num} style={S.featCard}>
              <span style={{ position: "absolute", top: 18, right: 22, fontFamily: "'Cormorant Garamond',serif", fontSize: 60, fontWeight: 300, color: "rgba(138,158,126,0.1)", lineHeight: 1 }}>{num}</span>
              <span style={{ fontSize: 28, marginBottom: 22, display: "block" }}>{icon}</span>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400, marginBottom: 12 }}>{title}</div>
              <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 13, lineHeight: 1.8, color: "var(--mid)", fontWeight: 300 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular Courses ── */}
      <section style={{ padding: "100px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 52 }}>
          <div>
            <div style={S.sLabel}>클래스</div>
            <h2 style={S.sTitle}>인기 <em style={{ fontStyle: "italic", color: "var(--deep)" }}>강의</em></h2>
          </div>
          <button style={S.btnGhost} onClick={() => goTo("courses")}>모든 클래스 보기 →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {COURSES.map((c) => (
            <div key={c.name} style={S.courseCard} onClick={() => goTo("courses")}>
              <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 68, position: "relative", background: thumbGrad[c.thumb] }}>
                <span style={{ position: "absolute", top: 14, left: 14, background: "white", borderRadius: 100, padding: "5px 12px", fontSize: 11, fontWeight: 500 }}>{c.badge}</span>
                {c.emoji}
              </div>
              <div style={{ padding: 22 }}>
                <div style={{ fontSize: 11, color: "var(--sage)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{c.level}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 400, marginBottom: 8 }}>{c.name}</div>
                <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 13, color: "var(--mid)", fontWeight: 300, lineHeight: 1.65, marginBottom: 14 }}>{c.desc}</p>
                <div style={{ fontSize: 12, color: "var(--mid)" }}>{c.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Instructor ── */}
      <section style={{ padding: "100px 80px", background: "var(--dark)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: "100%", aspectRatio: "3/4", background: "linear-gradient(160deg,var(--sage),var(--deep))", borderRadius: "180px 180px 20px 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 110, color: "rgba(255,255,255,0.15)" }}>🧘‍♀️</div>
          <div style={{ position: "absolute", bottom: -20, right: -20, width: 110, height: 110, background: "var(--terra)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond',serif", fontSize: 12, color: "white", textAlign: "center", lineHeight: 1.5 }}>10년+<br />경력</div>
        </div>
        <div>
          <div style={{ ...S.sLabel, color: "var(--sage)" }} className="inst-label">강사 소개</div>
          <h2 style={{ ...S.sTitle, color: "var(--cream)" }}>김소라 <em style={{ fontStyle: "italic", color: "var(--deep)" }}>선생님</em></h2>
          <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 14, lineHeight: 1.9, color: "rgba(245,240,232,0.65)", fontWeight: 300, margin: "22px 0 30px" }}>
            인도 리시케시에서 요가를 수련한 뒤, 10년간 국내외 5,000명 이상의 수강생을 가르쳐온 국내 최고의 요가 강사입니다.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["RYT 500 인증", "아쉬탕가 수련", "명상 지도사", "프리네탈 요가"].map((c) => (
              <span key={c} style={{ border: "1px solid rgba(138,158,126,0.35)", color: "var(--sage)", fontSize: 12, padding: "7px 14px", borderRadius: 100 }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "100px 80px", background: "var(--lsage)" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ ...S.sLabel, justifyContent: "center" }}>수강 후기</div>
          <h2 style={S.sTitle}>12,000명의 <em style={{ fontStyle: "italic", color: "var(--deep)" }}>실제 경험</em></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={S.testiCard}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 46, color: "var(--sage)", lineHeight: 0.8, marginBottom: 12 }}>"</div>
              <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 13, lineHeight: 1.85, color: "var(--mid)", fontWeight: 300, marginBottom: 20 }}>{t.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: avBg[t.av], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{t.em}</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 2 }}>{t.sub}</div>
                  <div style={{ color: "var(--terra)", fontSize: 12, marginTop: 2 }}>★★★★★</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer goTo={goTo} />
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  hero:      { minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" },
  heroLeft:  { display: "flex", flexDirection: "column", justifyContent: "center", padding: "140px 80px 80px" },
  eyebrow:   { fontSize: 11, letterSpacing: "0.3em", color: "var(--terra)", textTransform: "uppercase", fontWeight: 500, marginBottom: 28, display: "flex", alignItems: "center", gap: 12 },
  heroTitle: { fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(52px,5.5vw,80px)", fontWeight: 300, lineHeight: 1.05, marginBottom: 26 },
  heroSub:   { fontFamily: "'Noto Serif KR',serif", fontSize: 15, fontWeight: 300, lineHeight: 1.85, color: "var(--mid)", maxWidth: 380, marginBottom: 42 },
  heroRight: { position: "relative", overflow: "hidden" },
  heroBg:    { position: "absolute", inset: 0, background: "linear-gradient(135deg,var(--lsage),var(--sand))" },
  heroEmoji: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 200, opacity: 0.13 },
  floatCard: { position: "absolute", bottom: 80, left: -40, background: "white", borderRadius: 20, padding: "20px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", minWidth: 220, zIndex: 3, animation: "float 4s ease-in-out infinite" },
  heroStats: { display: "flex", gap: 36, marginTop: 56, paddingTop: 36, borderTop: "1px solid rgba(138,158,126,0.2)" },
  statNum:   { fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 300 },
  sLabel:    { fontSize: 11, letterSpacing: "0.3em", color: "var(--terra)", textTransform: "uppercase", fontWeight: 500, display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  sTitle:    { fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 300, lineHeight: 1.15 },
  featCard:  { background: "var(--warm)", padding: "44px 36px", position: "relative", overflow: "hidden" },
  courseCard:{ borderRadius: 20, overflow: "hidden", background: "var(--cream)", cursor: "pointer" },
  btnDark:   { background: "var(--dark)", color: "var(--cream)", padding: "14px 30px", borderRadius: 100, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  btnGhost:  { background: "none", border: "none", fontSize: 14, cursor: "pointer", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif" },
  testiCard: { background: "white", borderRadius: 20, padding: "30px 26px" },
};
