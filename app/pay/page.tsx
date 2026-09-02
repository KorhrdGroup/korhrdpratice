import type { Metadata } from 'next';

import { getPayProduct } from '@/lib/pay-product';

import PayForm from './PayForm';

export const metadata: Metadata = {
  title: '실습 결제비 결제',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

/** 이름·번호 입력 후 나이스페이로 결제하는 단일 페이지. */
export default function Page() {
  const { amount, goodsName } = getPayProduct();
  return (
    <main style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f2f4f6' }}>
      <PayForm amount={amount} goodsName={goodsName} />
    </main>
  );
}
