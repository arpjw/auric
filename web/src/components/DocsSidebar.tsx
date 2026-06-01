"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DocMeta } from "@/lib/docs";

export function DocsSidebar({ docs }: { docs: DocMeta[] }) {
  const pathname = usePathname();

  return (
    <aside className="docs-sidebar">
      <span className="docs-sidebar-label">Documentation</span>
      <nav>
        <ul style={{ listStyle: "none" }}>
          {docs.map((doc) => {
            const href = doc.slug === "overview" ? "/docs" : `/docs/${doc.slug}`;
            const active =
              pathname === href ||
              (doc.slug === "overview" && pathname === "/docs/overview");
            return (
              <li key={doc.slug}>
                <Link
                  href={href}
                  className={`docs-sidebar-link${active ? " active" : ""}`}
                >
                  {doc.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
