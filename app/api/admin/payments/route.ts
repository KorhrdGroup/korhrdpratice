import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/server';

/** 관리자 결제 목록 — 최신순. */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('hpedu_practice_payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[payments] 조회 실패:', error.message);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
  return NextResponse.json(data);
}
