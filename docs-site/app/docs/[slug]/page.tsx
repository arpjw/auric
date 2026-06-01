import { notFound } from 'next/navigation'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeStringify from 'rehype-stringify'
import { getAllDocs, getAllSlugs, getDoc } from '@/lib/docs'
import { Sidebar } from '@/components/Sidebar'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)

async function markdownToHtml(content: string): Promise<string> {
  // Process admonition blocks (:::type\n...\n:::) by extracting each segment,
  // running inner content through the full markdown pipeline, then reassembling.
  type Segment =
    | { kind: 'md'; text: string }
    | { kind: 'admonition'; adType: string; text: string }

  const segments: Segment[] = []
  let lastIndex = 0
  const re = /:::(\w+)\n([\s\S]*?):::/g
  let m: RegExpExecArray | null

  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) segments.push({ kind: 'md', text: content.slice(lastIndex, m.index) })
    segments.push({ kind: 'admonition', adType: m[1], text: m[2].trim() })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < content.length) segments.push({ kind: 'md', text: content.slice(lastIndex) })

  const parts = await Promise.all(
    segments.map(async seg => {
      if (seg.kind === 'md') return String(await processor.process(seg.text))
      const inner = String(await processor.process(seg.text))
      return `<div class="admonition admonition-${seg.adType}"><div class="admonition-heading">${seg.adType.toUpperCase()}</div><div class="admonition-content">${inner}</div></div>`
    }),
  )

  return parts.join('\n')
}

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

  const [allDocs, html] = await Promise.all([
    Promise.resolve(getAllDocs()),
    markdownToHtml(doc.content),
  ])

  return (
    <div className="layout">
      <Sidebar docs={allDocs} currentSlug={slug} />
      <main className="content">
        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </div>
  )
}
