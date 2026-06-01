import { notFound } from "next/navigation";
import { getAllSlugs, getDoc } from "@/lib/docs";
import { markdownToHtml } from "@/lib/markdown";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);
  return { title: doc ? `${doc.title} — Auric Docs` : "Auric Docs" };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();
  const html = await markdownToHtml(doc.content);
  return <article className="docs-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
