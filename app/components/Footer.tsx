"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLogo}>
          <span className={styles.logoText}>
            <img src="/logo.svg" alt="한평생원격교육원" />
          </span>
        </div>

        <div className={styles.footerInfo}>
          <p className={styles.infoLine}>
            경기도 의정부시 의정부동 486-11, 601호 일부 | 대표전화 1661-7768 | 상담번호 1661-7769
          </p>
          <p className={styles.infoLine}>
            주식회사 한평생그룹 대표자 양병웅 | 사업자번호 227-88-03196 | 통신판매번호 제2024-서울도봉-0983호
          </p>
          <div className={styles.footerLinks}>
            <Link href="/terms" className={styles.footerLink}>
              이용약관
            </Link>
            <span className={styles.divider}>|</span>
            <Link href="/privacy" className={styles.footerLink}>
              개인정보처리방침
            </Link>
          </div>
          <p className={styles.copyright}>
            COPYRIGHT ⓒ 주식회사한평생그룹 ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
