import type { Metadata } from 'next';
import Link from 'next/link';

import { getPayProduct } from '@/lib/pay-product';

export const metadata: Metadata = {
  title: '결제 결과',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

const todayKst = () =>
  new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date())
    .replace(/\s/g, ' ');

/** 나이스페이 결제 결과 — 영수증 카드 한 장. 푸터는 이 화면에서 숨긴다. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pick = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : '');
  const ok = pick('result') === 'ok';
  const amt = Number(pick('amt')) || 0;
  const moid = pick('moid');
  const message = pick('message');
  const { goodsName } = getPayProduct();

  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: 14, padding: '14px 0', borderBottom: '1px solid #eef0f3' };
  const label: React.CSSProperties = { color: '#8b95a1', flexShrink: 0 };
  const value: React.CSSProperties = { color: '#333d4b', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' };
  const btn: React.CSSProperties = { flex: 1, display: 'block', textAlign: 'center', padding: '15px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f2f4f6' }}>
      <style>{`footer { display: none !important; }`}</style>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, boxShadow: '0 6px 24px rgba(15,23,42,0.06)', padding: '48px 28px 32px', textAlign: 'center' }}>
        {ok ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/complete-check.png" alt="" aria-hidden="true" style={{ display: 'block', width: 84, height: 84, objectFit: 'contain', margin: '0 auto 20px' }} />
        ) : (
          <p style={{ fontSize: 48, margin: '0 0 12px' }}>❌</p>
        )}

        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: '#191f28' }}>
          {ok ? '결제가 완료되었습니다' : '결제가 완료되지 않았습니다'}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7684', margin: '0 0 28px' }}>
          {ok ? `${goodsName} 결제가 정상 처리되었습니다.` : message || '결제가 취소되었거나 실패했습니다. 다시 시도해주세요.'}
        </p>

        {ok ? (
          <div style={{ background: '#f9fafb', borderRadius: 12, padding: '4px 18px', marginBottom: 28, textAlign: 'left' }}>
            <div style={row}><span style={label}>상품명</span><span style={value}>{goodsName}</span></div>
            <div style={row}><span style={label}>결제일</span><span style={value}>{todayKst()}</span></div>
            {moid ? <div style={row}><span style={label}>주문번호</span><span style={{ ...value, fontSize: 12.5, fontWeight: 500, color: '#8b95a1' }}>{moid}</span></div> : null}
            <div style={{ ...row, borderBottom: 'none' }}>
              <span style={label}>결제금액</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#3182f6' }}>{amt.toLocaleString()}원</span>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/" style={{ ...btn, background: '#3182f6', color: '#fff' }}>{ok ? '홈으로' : '다시 결제하기'}</Link>
        </div>

        {ok ? (
          <p style={{ fontSize: 12.5, color: '#b0b8c1', margin: '20px 0 0' }}>
            결제 확인 후 담당자가 순차적으로 처리해드립니다.
          </p>
        ) : null}
      </div>
    </main>
  );
}
