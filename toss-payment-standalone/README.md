# 토스페이먼츠 결제 시스템 (Next.js App Router)

## 파일 구조
```
app/
  payment/
    success/page.tsx    ← page-success.tsx
    fail/page.tsx       ← page-fail.tsx
  api/
    payment/
      confirm/route.ts  ← route-confirm.ts
components/
  TossPayment.tsx       ← TossPayment.tsx
```

## 설치
```bash
npm install @tosspayments/tosspayments-sdk@2.5.0
```

## 환경변수 (.env.local)
```
# 결제위젯 전용 키 (gck 포함 — API 개별 연동 키 쓰면 오류남)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm

# 시크릿 키 (gsk 포함 — 절대 외부 노출 금지)
TOSS_SECRET_KEY=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 사용법
```tsx
import TossPayment from '@/components/TossPayment';

export default function CheckoutPage() {
  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">결제하기</h1>
      <TossPayment
        amount={29000}
        orderName="상품명"
        customerId={user._id}
        customerName={user.name}
        customerEmail={user.email}
        metadata={`?itemId=${item.id}`}  // successUrl에 추가될 파라미터 (선택)
        onError={(msg) => alert(msg)}
      />
    </div>
  );
}
```

## 결제 흐름
1. 사용자가 결제 버튼 클릭
2. 토스페이먼츠 결제창 팝업
3. 결제 완료 → /payment/success?paymentKey=...&orderId=...&amount=... 으로 리다이렉트
4. success 페이지에서 /api/payment/confirm 호출 → 서버에서 최종 승인
5. DB에 결제 내역 저장 (route-confirm.ts 주석 참고)

## 실제 서비스 적용 시
- test_gck_... → 실제 gck 키로 교체
- test_gsk_... → 실제 gsk 키로 교체
- route-confirm.ts의 savePaymentToDB 주석 해제 후 구현
