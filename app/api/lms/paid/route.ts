import { NextResponse } from 'next/server';

import { normalizePhone } from '@/lib/lms';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * LMS(덧셈원격평생교육원)가 회원가입 시 "이 번호가 결제한 사람인지" 물어보는 조회 API.
 *
 *   GET /api/lms/paid?phone=01012345678
 *   Authorization: Bearer <LMS_API_KEY>
 *
 * 응답: { paid: boolean, payments: [{ name, phone, amount, goods_name, moid, tid, paid_at }] }
 * 결제 완료를 우리가 LMS로 밀어주는(webhook) 방식이 어려울 때 LMS 쪽에서 당겨갈 수 있게 둡니다.
 */
export async function GET(request: Request) {
  const apiKey = process.env.LMS_API_KEY?.trim();
  const auth = request.headers.get('authorization') ?? '';
  if (!apiKey || auth !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phone = normalizePhone(searchParams.get('phone') ?? '');
  if (!/^01\d{8,9}$/.test(phone)) {
    return NextResponse.json({ error: 'invalid phone' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('name, phone, amount, goods_name, moid, tid, paid_at')
    .eq('phone', phone)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false });

  if (error) {
    console.error('[lms/paid] 조회 실패:', error.message);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
  return NextResponse.json({ paid: (data?.length ?? 0) > 0, payments: data ?? [] });
}
