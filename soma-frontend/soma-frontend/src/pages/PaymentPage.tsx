import { useState, useEffect, useRef } from "react";
import type { CourseDetail, PageKey } from "@/types";
import { courseApi, paymentApi } from "@/api";

interface PaymentProps {
  goTo:     (page: PageKey, id?: number) => void;
  courseId: number;
  user:     { id: number; name: string; email: string; nickname: string } | null;
}

// 결제 위젯 전용 키 (gck 포함)
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

export default function PaymentPage({ goTo, courseId, user }: PaymentProps) {
  const [course, setCourse]   = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetsRef = useRef<any>(null);

  const paymentId  = useRef(`pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).current;
  const agreementId = useRef(`agr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).current;

  useEffect(() => {
    courseApi.detail(courseId)
      .then((res) => { if (res.data) setCourse(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  // 강의 로드 완료 후 위젯 초기화
  useEffect(() => {
    if (!course || !user) return;
    let cancelled = false;

    const init = async () => {
      try {
        await new Promise((r) => setTimeout(r, 80));
        if (cancelled || !document.getElementById(paymentId)) return;

        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        if (cancelled) return;

        const safeKey = `u-${String(user.id).replace(/[^a-zA-Z0-9]/g, "").slice(0, 38)}`;
        const widgets = tossPayments.widgets({ customerKey: safeKey });
        widgetsRef.current = widgets;

        await widgets.setAmount({ currency: "KRW", value: course.price });
        if (cancelled) return;

        await Promise.all([
          widgets.renderPaymentMethods({ selector: `#${paymentId}`, variantKey: "DEFAULT" }),
          widgets.renderAgreement({ selector: `#${agreementId}`, variantKey: "AGREEMENT" }),
        ]);

        if (!cancelled) setWidgetReady(true);
      } catch (e) {
        if (!cancelled) setWidgetError((e as Error).message || "결제 위젯을 불러오지 못했습니다.");
      }
    };

    init();
    return () => { cancelled = true; };
  }, [course, user]);

  const handlePayment = async () => {
    if (!widgetsRef.current || !widgetReady || !course) return;
    try {
      // 서버에서 주문 준비
      const res = await paymentApi.prepare(courseId);
      if (!res.data) throw new Error("주문 생성에 실패했습니다.");
      const { orderId, orderName } = res.data;

      await widgetsRef.current.requestPayment({
        orderId,
        orderName: orderName.slice(0, 100),
        customerName: user?.nickname,
        customerEmail: user?.email,
        successUrl: `${window.location.origin}/?page=payment-success&courseId=${courseId}`,
        failUrl:    `${window.location.origin}/?page=payment-fail&courseId=${courseId}`,
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code !== "USER_CANCEL") {
        alert(err.message || "결제 오류가 발생했습니다.");
      }
    }
  };

  if (loading) return (
    <div style={{ paddingTop: 80, textAlign: "center", padding: "120px", color: "var(--mid)" }}>불러오는 중...</div>
  );
  if (!course) return (
    <div style={{ paddingTop: 80, textAlign: "center", padding: "120px", color: "var(--mid)" }}>강의를 찾을 수 없습니다.</div>
  );

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", background: "var(--warm)" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 80px" }}>
        <button onClick={() => goTo("detail", courseId)}
          style={{ fontSize: 13, color: "var(--mid)", background: "none", border: "none", cursor: "pointer", marginBottom: 28, display: "flex", alignItems: "center", gap: 6 }}>
          ← 강의 상세로 돌아가기
        </button>

        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300, marginBottom: 28 }}>
          결제 <em style={{ fontStyle: "italic", color: "var(--terra)" }}>확인</em>
        </h1>

        {/* 강의 정보 */}
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 20, border: "1px solid var(--sand)", display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: 10, overflow: "hidden", background: "var(--lsage)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {course.thumbnail_url
              ? <img src={course.thumbnail_url} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 28 }}>🧘</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{course.title}</div>
            <div style={{ fontSize: 12, color: "var(--mid)", marginBottom: 4 }}>👤 {course.instructor_name} · {course.level}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300, color: "var(--terra)" }}>
              ₩{course.price.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Toss 결제 위젯 */}
        {widgetError ? (
          <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: 20, marginBottom: 20, fontSize: 13, color: "#c33", textAlign: "center" }}>
            {widgetError}<br />
            <span style={{ fontSize: 12, color: "#999" }}>페이지를 새로고침 후 다시 시도해 주세요.</span>
          </div>
        ) : (
          <>
            <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 12, border: "1px solid var(--sand)", minHeight: 200 }}>
              <div id={paymentId} />
              {!widgetReady && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--mid)", fontSize: 13 }}>
                  결제 수단 불러오는 중...
                </div>
              )}
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 20, border: "1px solid var(--sand)" }}>
              <div id={agreementId} />
            </div>
          </>
        )}

        {/* 안내 */}
        <div style={{ fontSize: 12, color: "var(--mid)", lineHeight: 1.8, marginBottom: 20 }}>
          · 결제 완료 후 즉시 수강이 가능합니다.<br />
          · 강의는 평생 소장 가능합니다.<br />
          · 환불은 수강 취소 시 자동으로 처리됩니다.
        </div>

        <button
          style={{ display: "block", width: "100%", padding: 16, background: widgetReady ? "var(--dark)" : "var(--sand)", color: "var(--cream)", border: "none", borderRadius: 100, fontSize: 16, fontWeight: 500, cursor: widgetReady ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}
          onClick={handlePayment}
          disabled={!widgetReady}
        >
          {widgetReady ? `₩${course.price.toLocaleString()} 결제하기` : "결제 수단 로딩 중..."}
        </button>
      </div>
    </div>
  );
}
