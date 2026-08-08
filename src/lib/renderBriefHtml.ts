import { marked } from "marked";

export async function renderBriefHtml(title: string, markdown: string): Promise<string> {
  const bodyHtml = await marked.parse(markdown);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    max-width: 780px;
    margin: 3rem auto;
    padding: 0 1.5rem;
    line-height: 1.6;
    color: #1a1a1a;
  }
  h1 { font-size: 1.75rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
  h2 { font-size: 1.3rem; margin-top: 2.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
  h3 { font-size: 1.05rem; margin-top: 1.5rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.9rem; }
  th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; }
  th { background: #f5f5f5; }
  a { color: #2563eb; }
  code { background: #f5f5f5; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
