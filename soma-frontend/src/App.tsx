import { useState } from "react";
import type { PageKey } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import Nav                from "@/components/Nav";
import Landing            from "@/pages/Landing";
import CourseList         from "@/pages/CourseList";
import Auth               from "@/pages/Auth";
import CourseDetail       from "@/pages/CourseDetail";
import MyPage             from "@/pages/MyPage";
import Player             from "@/pages/Player";
import WishlistPage       from "@/pages/WishlistPage";
import InstructorDashboard from "@/pages/InstructorDashboard";
import InstructorProfile  from "@/pages/InstructorProfile";
import PaymentPage        from "@/pages/PaymentPage";
import PaymentResult      from "@/pages/PaymentResult";

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
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes spin  { to { transform: rotate(360deg); } }
  @media (max-width: 768px) {
    .grid-3 { grid-template-columns: 1fr !important; }
    .grid-2 { grid-template-columns: 1fr !important; }
    .pad-80 { padding-left: 20px !important; padding-right: 20px !important; }
    .hide-mobile { display: none !important; }
  }
`;

export default function App() {
  // URL 파라미터에서 초기 페이지/courseId 읽기 (Toss 결제 리다이렉트 처리)
  const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page") as PageKey | null;
    const id = params.get("courseId");
    // Toss 성공 리다이렉트: paymentKey가 있으면 무조건 success
    const hasPaymentKey = params.has("paymentKey");
    if (hasPaymentKey && id) return { page: "payment-success" as PageKey, courseId: Number(id) };
    if (p && id) return { page: p, courseId: Number(id) };
    if (p) return { page: p, courseId: 1 };
    return { page: "home" as PageKey, courseId: 1 };
  };

  const initial = getInitialState();
  const [page, setPage]         = useState<PageKey>(initial.page);
  const [courseId, setCourseId] = useState<number>(initial.courseId);
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

      {page === "home"            && <Landing             goTo={goTo} />}
      {page === "courses"         && <CourseList           goTo={goTo} />}
      {page === "auth"            && <Auth                 goTo={goTo} auth={auth} />}
      {page === "detail"          && <CourseDetail         goTo={goTo} courseId={courseId} loggedIn={!!auth.user} userId={auth.user?.id} />}
      {page === "my"              && <MyPage               goTo={goTo} />}
      {page === "player"          && <Player               goTo={goTo} courseId={courseId} />}
      {page === "wishlist"        && <WishlistPage         goTo={goTo} />}
      {page === "instructor"      && <InstructorDashboard  goTo={goTo} />}
      {page === "instructor-profile" && <InstructorProfile goTo={goTo} />}
      {page === "payment"         && <PaymentPage          goTo={goTo} courseId={courseId} user={auth.user} />}
      {page === "payment-success" && <PaymentResult        goTo={goTo} courseId={courseId} success={true} />}
      {page === "payment-fail"    && <PaymentResult        goTo={goTo} courseId={courseId} success={false} />}
    </>
  );
}
