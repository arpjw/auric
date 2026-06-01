"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/app", label: "App" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const isDark = pathname === "/";
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const bg = isDark ? "rgba(6,6,10,0.92)" : "rgba(255,255,255,0.96)";
  const border = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid var(--border)";
  const wordmark = isDark ? "#FFFFFF" : "var(--text)";
  const mutedLink = isDark ? "rgba(255,255,255,0.55)" : "var(--muted)";
  const activeLink = isDark ? "#FFFFFF" : "var(--text)";

  function navLink(href: string, mobile = false) {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return {
      fontSize: mobile ? 15 : 13,
      color: active ? activeLink : mutedLink,
      textDecoration: "none",
      letterSpacing: "0.015em",
      fontWeight: active ? 500 : 400,
      transition: "color 0.15s",
      ...(mobile && { display: "block", padding: "14px 24px" }),
    } as const;
  }

  return (
    <>
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
          padding: "0 clamp(20px, 5vw, 40px)",
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

        <nav className="nav-desktop" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={navLink(href)}>{label}</Link>
          ))}
        </nav>

        <button
          className={`nav-hamburger${isOpen ? " open" : ""}`}
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          style={{ color: wordmark }}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {isOpen && (
        <div
          className="nav-mobile-menu"
          style={{ background: bg, borderBottom: border }}
        >
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={navLink(href, true)} onClick={() => setIsOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
