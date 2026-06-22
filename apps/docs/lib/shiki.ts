import { createHighlighter, type Highlighter } from "shiki";
import type { DocCodeLang } from "@lib/detect-code-lang";

const THEME = "dark-plus";
const LANGS = ["bash", "json", "toml", "yaml", "text"] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME],
      langs: [...LANGS],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, lang: DocCodeLang): Promise<string> {
  const highlighter = await getHighlighter();
  const source = code.trimEnd();

  try {
    return highlighter.codeToHtml(source, { lang, theme: THEME });
  } catch {
    return highlighter.codeToHtml(source, { lang: "text", theme: THEME });
  }
}
