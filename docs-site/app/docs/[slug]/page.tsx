import { notFound } from 'next/navigation'
import { getAllDocs, getAllSlugs, getDoc } from '@/lib/docs'
import { markdownToHtml } from '@/lib/markdown'
import { Sidebar } from '@/components/Sidebar'

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getDoc(slug)
  return { title: doc ? `${doc.title} — Auric Docs` : 'Auric Docs' }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getDoc(slug)
  if (!doc) notFound()

  const [allDocs, html] = await Promise.all([Promise.resolve(getAllDocs()), markdownToHtml(doc.content)])

  return (
    <div className="layout">
      <Sidebar docs={allDocs} currentSlug={slug} />
      <main className="content">
        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </div>
  )
}
