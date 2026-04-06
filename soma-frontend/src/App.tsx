import { useState } from "react";
import type { PageKey } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import Nav           from "@/components/Nav";
import Landing       from "@/pages/Landing";
import CourseList    from "@/pages/CourseList";
import Auth          from "@/pages/Auth";
import CourseDetail  from "@/pages/CourseDetail";
import MyPage        from "@/pages/MyPage";
import Player        from "@/pages/Player";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&family=Noto+Serif+KR:wght@300;400&display=swap');
  :root {
    --cream: #F5F0E8; --warm: #FAF8F4; --sage: #8A9E7E;
    --deep:  #4A6741; --terra:#C8714A; --sand: #D4C4A8;
    --dark:  #2A2A2A; --mid:  #6B6558; --lsage:#E8EDDF;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: var(--warm); color: var(--dark); overflow-x: hidden; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes spin  { to { transform: rotate(360deg); } }
`;

export default function App() {
  const [page, setPage]     = useState<PageKey>("home");
  const [courseId, setCourseId] = useState<number>(1);
  const auth = useAuth();

  const goTo = (p: PageKey, id?: number) => {
    if (id !== undefined) setCourseId(id);
    setPage(p);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠어요?")) auth.logout();
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {page !== "player" && <Nav goTo={goTo} user={auth.user} onLogout={handleLogout} />}

      {page === "home"    && <Landing     goTo={goTo} />}
      {page === "courses" && <CourseList  goTo={goTo} />}
      {page === "auth"    && <Auth        goTo={goTo} auth={auth} />}
      {page === "detail"  && <CourseDetail goTo={goTo} courseId={courseId} loggedIn={!!auth.user} />}
      {page === "my"      && <MyPage      goTo={goTo} />}
      {page === "player"  && <Player      goTo={goTo} courseId={courseId} />}
    </>
  );
}
