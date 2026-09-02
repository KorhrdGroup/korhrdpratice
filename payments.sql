-- 결제 기록 (나이스페이 경유). Supabase SQL Editor에서 실행하세요.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,                          -- 숫자만 (01012345678) — LMS 매칭 키
  amount integer not null,
  goods_name text not null,
  status text not null default 'ready',         -- ready | paid | failed | canceled
  pg_provider text not null default 'nicepay',
  moid text not null,                           -- 우리쪽 주문번호
  tid text,                                     -- 나이스페이 거래번호
  result_code text,
  result_msg text,
  paid_at timestamptz,
  lms_synced boolean not null default false,    -- LMS에 결제자 정보 전달 성공 여부
  lms_synced_at timestamptz,
  lms_sync_detail text,
  created_at timestamptz not null default now()
);

create unique index if not exists payments_moid_idx on payments (moid);
create index if not exists payments_phone_idx on payments (phone);
create index if not exists payments_created_idx on payments (created_at desc);

comment on table payments is '이름·번호 수집 후 나이스페이 결제 이력. phone 으로 덧셈원격평생교육원 LMS 회원과 매칭.';
