import { getAllDocs, getDoc } from '@/lib/docs'
import { markdownToHtml } from '@/lib/markdown'
import { Sidebar } from '@/components/Sidebar'

export const metadata = { title: 'Overview — Auric Docs' }

export default async function Home() {
  const doc = getDoc('overview')!
  const [allDocs, html] = await Promise.all([Promise.resolve(getAllDocs()), markdownToHtml(doc.content)])

  return (
    <div className="layout">
      <Sidebar docs={allDocs} currentSlug="overview" />
      <main className="content">
        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </div>
  )
}
