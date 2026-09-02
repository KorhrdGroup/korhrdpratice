/** 결제 상품 — 금액과 상품명은 환경변수로 고정합니다 (클라이언트가 정하지 않음). */
export function getPayProduct() {
  const amount = Number(process.env.PAY_AMOUNT) || 0;
  const goodsName = process.env.PAY_GOODS_NAME?.trim() || "실습 결제비";
  return { amount, goodsName };
}
