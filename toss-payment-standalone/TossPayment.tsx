'use client';
/**
 * 토스페이먼츠 결제 위젯 컴포넌트
 * 
 * 설치: npm install @tosspayments/tosspayments-sdk@2.5.0
 * 
 * 환경변수:
 *   NEXT_PUBLIC_TOSS_CLIENT_KEY=test_gck_...  (결제위젯 전용 키, gck 포함)
 *   NEXT_PUBLIC_BASE_URL=http://localhost:3000
 */

import { useState, useEffect, useRef } from 'react';

interface TossPaymentProps {
  amount: number;           // 결제 금액
  orderName: string;        // 상품명
  customerId: string;       // 구매자 고유 ID
  customerName: string;     // 구매자 이름
  customerEmail: string;    // 구매자 이메일
  metadata?: string;        // 결제 성공 후 successUrl에 붙을 추가 파라미터 (예: ?itemId=123)
  onError?: (msg: string) => void;
}

export default function TossPayment({
  amount, orderName, customerId, customerName, customerEmail, metadata = '', onError,
}: TossPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const widgetsRef = useRef<any>(null);

  // 컴포넌트 인스턴스마다 고유 ID 생성 (중복 마운트 방지)
  const paymentId = useRef(`pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).current;
  const agreementId = useRef(`agr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).current;

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await new Promise(r => setTimeout(r, 80)); // DOM 준비 대기
        if (cancelled || !document.getElementById(paymentId)) return;

        const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
        const tossPayments = await loadTossPayments(clientKey);
        if (cancelled) return;

        // customerKey: 영문+숫자만 허용
        const safeKey = `u-${customerId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 38)}`;
        const widgets = tossPayments.widgets({ customerKey: safeKey });
        widgetsRef.current = widgets;

        await widgets.setAmount({ currency: 'KRW', value: amount });
        if (cancelled) return;

        await Promise.all([
          widgets.renderPaymentMethods({ selector: `#${paymentId}`, variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: `#${agreementId}`, variantKey: 'AGREEMENT' }),
        ]);

        if (!cancelled) { setReady(true); setLoading(false); }
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message || '결제 위젯을 불러오지 못했습니다.';
          setError(msg);
          setLoading(false);
          onError?.(msg);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, []); // 마운트 시 1회만

  const handlePay = async () => {
    if (!widgetsRef.current || !ready) return;

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName: orderName.slice(0, 100),
        customerName,
        customerEmail,
        successUrl: `${base}/payment/success${metadata}`,
        failUrl: `${base}/payment/fail`,
      });
    } catch (e: any) {
      if (e?.code !== 'USER_CANCEL') {
        const msg = e?.message || '결제 오류';
        onError?.(msg);
      }
    }
  };

  if (error) return (
    <div className="py-6 text-center">
      <p className="text-sm text-red-500 mb-2">{error}</p>
      <p className="text-xs text-gray-400">페이지를 새로고침 후 다시 시도해 주세요.</p>
    </div>
  );

  return (
    <div>
      {/* 결제 수단 위젯 */}
      <div id={paymentId} className="min-h-[200px]" />
      {/* 약관 위젯 */}
      <div id={agreementId} className="mt-2" />

      {loading && (
        <div className="py-6 text-center text-sm text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          결제 수단 불러오는 중...
        </div>
      )}

      {ready && (
        <button
          onClick={handlePay}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-sm transition-colors"
        >
          {amount.toLocaleString()}원 결제하기
        </button>
      )}
    </div>
  );
}
