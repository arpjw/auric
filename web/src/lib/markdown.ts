import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

type Segment =
  | { kind: "md"; text: string }
  | { kind: "admonition"; adType: string; text: string };

// Splits content on :::type\n...\n::: blocks, processes each piece through
// the full markdown pipeline so inner content (bold, code, etc.) renders.
export async function markdownToHtml(content: string): Promise<string> {
  const segments: Segment[] = [];
  let lastIndex = 0;
  const re = /:::(\w+)\n([\s\S]*?):::/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex)
      segments.push({ kind: "md", text: content.slice(lastIndex, m.index) });
    segments.push({ kind: "admonition", adType: m[1], text: m[2].trim() });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length)
    segments.push({ kind: "md", text: content.slice(lastIndex) });

  const parts = await Promise.all(
    segments.map(async (seg) => {
      if (seg.kind === "md") return String(await processor.process(seg.text));
      const inner = String(await processor.process(seg.text));
      return `<div class="admonition admonition-${seg.adType}"><div class="admonition-heading">${seg.adType.toUpperCase()}</div><div class="admonition-content">${inner}</div></div>`;
    }),
  );

  return parts.join("\n");
}
