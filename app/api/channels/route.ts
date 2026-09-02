import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET: 채널 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const query = supabaseAdmin
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true });

  if (type) query.eq('type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST: 채널 추가
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id, name, type = 'mamcafe' } = body;

  if (!id || !name) {
    return NextResponse.json({ error: 'id와 name은 필수입니다.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('channels')
    .insert([{ id, name, type }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 존재하는 카페 ID입니다.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PATCH: 채널 수정 (이름 또는 ID 변경)
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, newId, name } = body;

  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  // ID 변경 없이 이름만 수정
  if (!newId || newId === id) {
    if (!name) return NextResponse.json({ error: 'name이 필요합니다.' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('channels')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // ID 변경: 기존 레코드 조회 → 새 ID로 삽입 → 기존 삭제
  const { data: existing } = await supabaseAdmin.from('channels').select('*').eq('id', id).single();
  if (!existing) return NextResponse.json({ error: '카페를 찾을 수 없습니다.' }, { status: 404 });

  const { error: insertError } = await supabaseAdmin
    .from('channels')
    .insert([{ id: newId, name: name || existing.name, type: existing.type }]);

  if (insertError) {
    if (insertError.code === '23505') return NextResponse.json({ error: '이미 존재하는 카페 ID입니다.' }, { status: 409 });
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabaseAdmin.from('channels').delete().eq('id', id);
  return NextResponse.json({ id: newId, name: name || existing.name, type: existing.type });
}

// DELETE: 채널 삭제
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  const { error } = await supabaseAdmin.from('channels').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
