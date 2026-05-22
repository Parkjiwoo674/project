import type { PageKey } from "@/types";

interface FooterProps {
  goTo: (page: PageKey) => void;
}

export default function Footer({ goTo }: FooterProps) {
  return (
    <footer style={S.footer}>
      <div style={S.logo}>SŌ<span style={{ color: "var(--terra)" }}>MA</span></div>
      <div style={{ display: "flex", gap: 22 }}>
        {(["강의", "강사진", "이용약관", "개인정보처리방침", "고객센터"] as const).map((label) => (
          <button
            key={label}
            style={S.link}
            onClick={label === "강의" ? () => goTo("courses") : undefined}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12 }}>© 2025 SOMA. All rights reserved.</div>
    </footer>
  );
}

const S: Record<string, React.CSSProperties> = {
  footer: {
    background: "var(--dark)", color: "rgba(245,240,232,0.4)",
    padding: "48px 80px", display: "flex", justifyContent: "space-between",
    alignItems: "center", flexWrap: "wrap", gap: 20,
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300,
    letterSpacing: "0.2em", color: "var(--cream)",
  },
  link: {
    color: "rgba(245,240,232,0.35)", fontSize: 12, cursor: "pointer",
    background: "none", border: "none", fontFamily: "'DM Sans', sans-serif",
  },
};
