import { useState } from "react";
import type { PageKey } from "@/types";
import type { useAuth } from "@/hooks/useAuth";

interface AuthProps {
  goTo:   (page: PageKey) => void;
  auth:   ReturnType<typeof useAuth>;
}

type Tab = "login" | "signup";

export default function Auth({ goTo, auth }: AuthProps) {
  const [tab, setTab]   = useState<Tab>("login");
  const [form, setForm] = useState({ name: "", nickname: "", email: "", password: "" });
  const [role, setRole] = useState<"user" | "instructor">("user");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleLogin = async () => {
    const ok = await auth.login(form.email, form.password);
    if (ok) goTo("home");
  };

  const handleSignup = async () => {
    const ok = await auth.signup(form.name, form.nickname, form.email, form.password, role);
    if (ok) goTo("home");
  };

  return (
    <div style={S.page}>
      {/* Visual Side */}
      <div style={S.visual}>
        <div style={S.visualOverlay} />
        <div style={{ fontSize: 120, opacity: 0.2, marginBottom: 28, position: "relative", zIndex: 1 }}>
          <img src="/soma-removebg-preview.png" alt="강사" style={{ width: 120, height: 120, objectFit: "cover", objectPosition: "top", borderRadius: "50%", opacity: 0.6 }} />
        </div>
        <h2 style={S.visualTitle}>
          당신의 수련이<br />
          <em style={{ fontStyle: "italic", color: "var(--sand)" }}>기다리고 있어요</em>
        </h2>
        <p style={S.visualSub}>180개 이상의 클래스와<br />국내 최고 강사진이 함께합니다</p>
        <div style={{ display: "flex", gap: 8, marginTop: 32, position: "relative", zIndex: 1 }}>
          <div style={{ ...S.dot, background: "var(--terra)" }} />
          <div style={S.dot} /><div style={S.dot} />
        </div>
      </div>

      {/* Form Side */}
      <div style={S.formArea}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <span style={S.formLogo} onClick={() => goTo("home")}>
            SŌ<span style={{ color: "var(--terra)" }}>MA</span>
          </span>

          {/* Tabs */}
          <div style={S.tabs}>
            {(["login", "signup"] as const).map((t) => (
              <button key={t} style={{ ...S.tab, ...(tab === t ? S.tabOn : {}) }} onClick={() => setTab(t)}>
                {t === "login" ? "로그인" : "회원가입"}
              </button>
            ))}
          </div>

          {/* Error */}
          {auth.error && (
            <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#c33", marginBottom: 16 }}>
              {auth.error}
            </div>
          )}



          {/* Login Form */}
          {tab === "login" && (
            <>
              <Field label="이메일" type="email"    value={form.email}    onChange={set("email")} placeholder="email@example.com" />
              <Field label="비밀번호" type="password" value={form.password} onChange={set("password")} placeholder="비밀번호" />
              <button style={S.submit} onClick={handleLogin} disabled={auth.loading}>
                {auth.loading ? "로그인 중..." : "로그인"}
              </button>
              <div style={S.footNote}>
                계정이 없으신가요? <button style={S.flink} onClick={() => setTab("signup")}>회원가입</button>
              </div>
            </>
          )}

          {/* Signup Form */}
          {tab === "signup" && (
            <>
              {/* 역할 선택 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {([["user", "학생", "강의를 수강해요"], ["instructor", "강사", "강의를 만들어요"]] as const).map(([r, label, sub]) => (
                  <button key={r} onClick={() => setRole(r)}
                    style={{ padding: "14px 12px", border: `2px solid ${role === r ? "var(--deep)" : "var(--sand)"}`, borderRadius: 14, background: role === r ? "var(--lsage)" : "white", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{label.split(" ")[0]}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: role === r ? "var(--deep)" : "var(--dark)" }}>{label.split(" ")[1]}</div>
                    <div style={{ fontSize: 11, color: "var(--mid)", marginTop: 2 }}>{sub}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="이름"   type="text" value={form.name}     onChange={set("name")}     placeholder="홍길동" />
                <Field label="닉네임" type="text" value={form.nickname} onChange={set("nickname")} placeholder="요가러버" />
              </div>
              <Field label="이메일"   type="email"    value={form.email}    onChange={set("email")}    placeholder="email@example.com" />
              <Field label="비밀번호" type="password" value={form.password} onChange={set("password")} placeholder="8자 이상" hint="영문, 숫자 포함 8자 이상" />
              <div style={{ marginBottom: 16 }}>
                <label style={S.agree}><input type="checkbox" style={{ accentColor: "var(--deep)" }} /> <span><span style={{ color: "var(--deep)" }}>이용약관</span> 및 <span style={{ color: "var(--deep)" }}>개인정보처리방침</span>에 동의합니다 (필수)</span></label>
                <label style={S.agree}><input type="checkbox" style={{ accentColor: "var(--deep)" }} /> <span>마케팅 정보 수신에 동의합니다 (선택)</span></label>
              </div>
              <button style={S.submit} onClick={handleSignup} disabled={auth.loading}>
                {auth.loading ? "가입 중..." : `${role === "instructor" ? "강사로" : "학생으로"} 가입하기`}
              </button>
              <div style={S.footNote}>
                이미 계정이 있으신가요? <button style={S.flink} onClick={() => setTab("login")}>로그인</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label:       string;
  type:        string;
  value:       string;
  onChange:    (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  hint?:       string;
}

function Field({ label, type, value, onChange, placeholder, hint }: FieldProps) {
  return (
    <div style={{ marginBottom: 17 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "var(--mid)", marginBottom: 7, textTransform: "uppercase" }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: "100%", padding: "12px 15px", border: "1.5px solid var(--sand)", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "var(--dark)", background: "white", outline: "none" }}
      />
      {hint && <div style={{ fontSize: 12, color: "var(--mid)", marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page:       { minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" },
  visual:     { background: "linear-gradient(160deg,var(--deep),var(--dark))", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "80px 60px", textAlign: "center", position: "relative", overflow: "hidden" },
  visualOverlay: { content: "", position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%,rgba(200,113,74,0.2),transparent 60%)" },
  visualTitle: { fontFamily: "'Cormorant Garamond',serif", fontSize: 40, fontWeight: 300, color: "var(--cream)", lineHeight: 1.2, position: "relative", zIndex: 1, marginBottom: 14 },
  visualSub:  { fontFamily: "'Noto Serif KR',serif", fontSize: 14, color: "rgba(245,240,232,0.5)", fontWeight: 300, lineHeight: 1.8, position: "relative", zIndex: 1 },
  dot:        { width: 8, height: 8, borderRadius: "50%", background: "rgba(245,240,232,0.2)" },
  formArea:   { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "80px 60px", background: "var(--warm)" },
  formLogo:   { fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, letterSpacing: "0.2em", cursor: "pointer", marginBottom: 28, display: "block", color: "var(--dark)" },
  tabs:       { display: "flex", borderBottom: "1px solid var(--sand)", marginBottom: 28 },
  tab:        { padding: "13px 26px", fontSize: 15, cursor: "pointer", color: "var(--mid)", borderBottom: "2px solid transparent", marginBottom: -1, background: "none", borderTop: "none", borderLeft: "none", borderRight: "none", fontFamily: "'DM Sans',sans-serif" },
  tabOn:      { color: "var(--dark)", borderBottom: "2px solid var(--dark)", fontWeight: 500 },
  social:     { width: "100%", padding: 12, border: "1.5px solid var(--sand)", borderRadius: 12, background: "white", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--dark)", fontFamily: "'DM Sans',sans-serif" },
  divider:    { textAlign: "center", margin: "16px 0", fontSize: 13, color: "var(--mid)" },
  submit:     { width: "100%", padding: 14, background: "var(--dark)", color: "var(--cream)", border: "none", borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: "pointer", marginTop: 6, fontFamily: "'DM Sans',sans-serif" },
  footNote:   { textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--mid)" },
  flink:      { color: "var(--deep)", cursor: "pointer", fontWeight: 500, background: "none", border: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13 },
  agree:      { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, fontSize: 13, color: "var(--mid)", lineHeight: 1.5, cursor: "pointer" },
};
