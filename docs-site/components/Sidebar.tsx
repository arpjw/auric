import Link from 'next/link'
import type { DocMeta } from '@/lib/docs'

export function Sidebar({ docs, currentSlug }: { docs: DocMeta[]; currentSlug: string }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link href="/docs/overview" className="sidebar-title">
          Auric
        </Link>
        <span className="sidebar-subtitle">Documentation</span>
      </div>
      <ul className="sidebar-nav">
        {docs.map(doc => (
          <li key={doc.slug}>
            <Link
              href={`/docs/${doc.slug}`}
              className={`sidebar-link${currentSlug === doc.slug ? ' active' : ''}`}
            >
              {doc.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
