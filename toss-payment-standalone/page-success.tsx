'use client';
/**
 * 결제 성공 페이지
 * 파일 위치: app/payment/success/page.tsx
 * 
 * 토스페이먼츠가 결제 완료 후 이 페이지로 리다이렉트합니다.
 * URL 파라미터: paymentKey, orderId, amount
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      setErrorMsg('결제 정보가 올바르지 않습니다.');
      return;
    }

    // 서버에서 결제 최종 승인
    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setPaymentData(data);
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg(data.error || '결제 승인 실패');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('네트워크 오류가 발생했습니다.');
      });
  }, [searchParams]);

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">결제를 처리하고 있습니다...</p>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl border p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold mb-2">결제에 실패했습니다</h1>
        <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
        <Link href="/" className="bg-blue-600 text-white font-bold px-8 py-3 rounded-full text-sm">
          홈으로
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl border p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">✅</div>
        <h1 className="text-2xl font-bold mb-2">결제 완료!</h1>
        <p className="text-gray-500 mb-2">결제가 정상적으로 처리됐습니다.</p>
        {paymentData && (
          <p className="text-xl font-bold text-blue-600 mb-6">
            {paymentData.amount?.toLocaleString()}원
          </p>
        )}
        <Link href="/" className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
