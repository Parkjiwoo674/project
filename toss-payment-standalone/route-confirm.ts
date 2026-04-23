/**
 * 토스페이먼츠 결제 승인 API
 * 파일 위치: app/api/payment/confirm/route.ts
 * 
 * 환경변수:
 *   TOSS_SECRET_KEY=test_gsk_...  (시크릿 키, gsk 포함, 절대 외부 노출 금지)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: '필수 파라미터 누락' }, { status: 400 });
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });

    // 토스페이먼츠 결제 승인 API 호출
    const encoded = Buffer.from(`${secretKey}:`).toString('base64');
    const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || '결제 승인 실패' },
        { status: res.status }
      );
    }

    // ✅ 여기서 DB에 결제 내역 저장
    // await savePaymentToDB({
    //   orderId: data.orderId,
    //   paymentKey: data.paymentKey,
    //   amount: data.totalAmount,
    //   method: data.method,
    //   approvedAt: data.approvedAt,
    //   userId: '...',  // 세션에서 가져오기
    // });

    return NextResponse.json({
      success: true,
      paymentKey: data.paymentKey,
      orderId: data.orderId,
      amount: data.totalAmount,
      method: data.method,
      approvedAt: data.approvedAt,
    });
  } catch (err) {
    console.error('결제 승인 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
