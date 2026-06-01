import type { Metadata } from "next";
import { getDoc } from "@/lib/docs";
import { markdownToHtml } from "@/lib/markdown";

export const metadata: Metadata = { title: "Overview — Auric Docs" };

export default async function DocsPage() {
  const doc = getDoc("overview")!;
  const html = await markdownToHtml(doc.content);
  return <article className="docs-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
