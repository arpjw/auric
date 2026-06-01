import fs from "fs";
import path from "path";
import matter from "gray-matter";

// docs/ lives one level above the web/ project root
const docsDir = path.join(process.cwd(), "../docs");

export interface DocMeta {
  slug: string;
  title: string;
  sidebarPosition: number;
}

export interface Doc extends DocMeta {
  content: string;
}

export function getAllDocs(): DocMeta[] {
  return fs
    .readdirSync(docsDir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(docsDir, file), "utf8"));
      return {
        slug,
        title: (data.title as string) || slug,
        sidebarPosition: (data.sidebar_position as number) || 99,
      };
    })
    .sort((a, b) => a.sidebarPosition - b.sidebarPosition);
}

export function getDoc(slug: string): Doc | null {
  const filePath = path.join(docsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
  return {
    slug,
    title: (data.title as string) || slug,
    sidebarPosition: (data.sidebar_position as number) || 99,
    content,
  };
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(docsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}
