import { useState, useEffect } from "react";
import type { PageKey } from "@/types";
import { paymentApi } from "@/api";

interface PaymentResultProps {
  goTo:     (page: PageKey, id?: number) => void;
  courseId: number;
  success:  boolean;
}

export default function PaymentResult({ goTo, courseId, success }: PaymentResultProps) {
  const [status, setStatus]   = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get("page");

    // failUrl로 온 경우
    if (!success || pageParam === "payment-fail") {
      const msg = params.get("message") || "결제가 취소되었습니다.";
      setStatus("error");
      setMessage(msg);
      window.history.replaceState({}, "", "/");
      return;
    }

    // successUrl로 온 경우 — Toss가 붙여준 파라미터 읽기
    const paymentKey = params.get("paymentKey");
    const orderId    = params.get("orderId");
    const amount     = params.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    paymentApi.confirm({ paymentKey, orderId, amount: Number(amount) })
      .then(() => {
        setStatus("done");
        // URL 파라미터 제거 (새로고침 방지)
        window.history.replaceState({}, "", "/");
      })
      .catch((e) => { setStatus("error"); setMessage((e as Error).message); });
  }, [success]);

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--warm)" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⏳</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, color: "var(--mid)" }}>
              결제를 처리하고 있습니다...
            </div>
          </>
        )}
        {status === "done" && (
          <>
            <div style={{ width: 72, height: 72, background: "var(--lsage)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>✅</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300, marginBottom: 12 }}>결제 완료!</h1>
            <p style={{ fontSize: 14, color: "var(--mid)", marginBottom: 32, lineHeight: 1.8 }}>
              수강 신청이 완료되었습니다.<br />지금 바로 강의를 시작해보세요.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => goTo("player", courseId)}
                style={{ padding: "12px 24px", background: "var(--terra)", color: "white", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                강의 시작하기
              </button>
              <button onClick={() => goTo("my")}
                style={{ padding: "12px 24px", background: "none", border: "1.5px solid var(--sand)", borderRadius: 100, fontSize: 14, cursor: "pointer", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif" }}>
                내 수업 보기
              </button>
            </div>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300, marginBottom: 12 }}>결제 실패</h1>
            <p style={{ fontSize: 14, color: "var(--mid)", marginBottom: 32 }}>{message}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => goTo("payment", courseId)}
                style={{ padding: "12px 24px", background: "var(--dark)", color: "var(--cream)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                다시 시도하기
              </button>
              <button onClick={() => goTo("detail", courseId)}
                style={{ padding: "12px 24px", background: "none", border: "1.5px solid var(--sand)", borderRadius: 100, fontSize: 14, cursor: "pointer", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif" }}>
                강의로 돌아가기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
