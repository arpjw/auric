"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const isDark = pathname === "/";

  const bg = isDark ? "rgba(6,6,10,0.78)" : "rgba(255,255,255,0.92)";
  const border = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid var(--border)";
  const wordmark = isDark ? "#FFFFFF" : "var(--text)";
  const mutedLink = isDark ? "rgba(255,255,255,0.55)" : "var(--muted)";
  const activeLink = isDark ? "#FFFFFF" : "var(--text)";

  function navLink(href: string) {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return {
      fontSize: 13,
      color: active ? activeLink : mutedLink,
      textDecoration: "none",
      letterSpacing: "0.015em",
      fontWeight: active ? 500 : 400,
      transition: "color 0.15s",
    } as const;
  }

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        background: bg,
        borderBottom: border,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        zIndex: 100,
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 20,
          fontWeight: 700,
          color: wordmark,
          letterSpacing: "-0.02em",
          textDecoration: "none",
        }}
      >
        Auric
      </Link>

      <nav style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <Link href="/" style={navLink("/")}>Home</Link>
        <Link href="/docs" style={navLink("/docs")}>Docs</Link>
        <Link href="/app" style={navLink("/app")}>App</Link>
        <Link href="/about" style={navLink("/about")}>About</Link>
      </nav>
    </header>
  );
}
