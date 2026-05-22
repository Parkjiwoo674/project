import type { PageKey, User } from "@/types";

interface NavProps {
  goTo:     (page: PageKey) => void;
  user:     User | null;
  onLogout: () => void;
}

export default function Nav({ goTo, user, onLogout }: NavProps) {
  return (
    <nav style={S.nav}>
      <span style={S.logo} onClick={() => goTo("home")}>
        SŌ<span style={{ color: "var(--terra)" }}>MA</span>
      </span>

      <ul style={S.links}>
        {user?.role !== "instructor" && user?.role !== "admin" && <li><button style={S.link} onClick={() => goTo("courses")}>강의</button></li>}
        {user?.role === "instructor" && <li><button style={S.link} onClick={() => goTo("instructor")}>내 강의 관리</button></li>}
        {user?.role === "user" && <li><button style={S.link} onClick={() => goTo("my")}>내 수업</button></li>}
        {user?.role === "user" && <li><button style={S.link} onClick={() => goTo("wishlist")}>찜 목록</button></li>}
        {user?.role === "admin" && <li><button style={S.link} onClick={() => goTo("admin")}>관리자 대시보드</button></li>}
        {!user && <li><button style={S.link} onClick={() => goTo("courses")}>강의</button></li>}
        {!user ? (
          <li>
            <button style={S.cta} onClick={() => goTo("auth")}>로그인 / 가입</button>
          </li>
        ) : (
          <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--mid)", cursor: "pointer" }}
              onClick={() => user.role === "instructor" ? goTo("instructor-profile") : user.role === "user" ? goTo("student-profile") : undefined}>
              {user.nickname}님
            </span>
            {user.role === "instructor" && (
              <span style={{ fontSize: 10, background: "var(--terra)", color: "white", padding: "2px 8px", borderRadius: 100, fontWeight: 500, cursor: "pointer" }}
                onClick={() => goTo("instructor-profile")}>강사</span>
            )}
            {user.role === "admin" && (
              <span style={{ fontSize: 10, background: "var(--deep)", color: "white", padding: "2px 8px", borderRadius: 100, fontWeight: 500 }}>관리자</span>
            )}
            <button style={S.avatar} onClick={onLogout} title="로그아웃">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : "🌿"
              }
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

const S: Record<string, React.CSSProperties> = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 60px",
    background: "rgba(250,248,244,0.9)", backdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(138,158,126,0.15)",
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300,
    letterSpacing: "0.25em", cursor: "pointer", color: "var(--dark)",
  },
  links: { display: "flex", gap: 32, listStyle: "none", alignItems: "center" },
  link: {
    fontSize: 13, color: "var(--mid)", cursor: "pointer", background: "none",
    border: "none", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em",
  },
  cta: {
    background: "var(--deep)", color: "#fff", padding: "10px 22px",
    borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: "pointer",
    border: "none", fontFamily: "'DM Sans', sans-serif",
  },
  avatar: {
    width: 34, height: 34, borderRadius: "50%", background: "var(--lsage)",
    border: "2px solid var(--sage)", fontSize: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
};