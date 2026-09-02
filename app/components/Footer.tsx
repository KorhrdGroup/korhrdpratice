"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLogo}>
          <span className={styles.logoText}>
            <img src="/logo.png" alt="덧셈원격평생교육원" />
          </span>
        </div>

        <div className={styles.footerInfo}>
          {/* TODO: 덧셈원격평생교육원 대표자명·사업자등록번호 확인 후 교체 */}
          <p className={styles.infoLine}>
            덧셈원격평생교육원 | 대표 ○○○ | 사업자등록번호 000-00-00000
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
            2026 © 덧셈원격평생교육원. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
