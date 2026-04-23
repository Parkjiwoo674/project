'use client';
/**
 * 결제 실패/취소 페이지
 * 파일 위치: app/payment/fail/page.tsx
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function FailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const code = searchParams.get('code');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl border p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold mb-2">결제가 취소됐습니다</h1>
        <p className="text-gray-400 text-sm mb-2">{message || '결제 처리 중 오류가 발생했습니다.'}</p>
        {code && <p className="text-xs text-gray-300 mb-6">오류 코드: {code}</p>}
        <div className="space-y-2">
          <button onClick={() => history.back()}
            className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm">
            다시 시도하기
          </button>
          <Link href="/"
            className="block w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
      <FailContent />
    </Suspense>
  );
}
