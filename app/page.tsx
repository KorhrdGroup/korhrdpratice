import { getPayProduct } from "@/lib/pay-product";

import PayForm from "./pay/PayForm";
import styles from "./stepflow.module.css";

export const dynamic = "force-dynamic";

/** 홈 — 이름·연락처 입력 후 나이스페이 결제. 다른 입력 항목은 없습니다. */
export default function Home() {
  const { amount, goodsName } = getPayProduct();
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="덧셈원격평생교육원" style={{ height: "auto", width: "220px" }} />
        </div>
      </header>
      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px 48px" }}>
        <PayForm amount={amount} goodsName={goodsName} />
      </main>
    </div>
  );
}
