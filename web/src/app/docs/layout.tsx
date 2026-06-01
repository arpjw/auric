import { getAllDocs } from "@/lib/docs";
import { DocsSidebar } from "@/components/DocsSidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const docs = getAllDocs();
  return (
    <div className="docs-layout">
      <DocsSidebar docs={docs} />
      <main className="docs-main">{children}</main>
    </div>
  );
}
