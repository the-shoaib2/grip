"use client";

import { useEffect, useState } from "react";
import { detectCodeLang, type DocCodeLang } from "@lib/detect-code-lang";
import { highlightCode } from "@lib/shiki";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text.trimEnd());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      className="doc-code-copy"
      onClick={onCopy}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? (
        <>
          <CheckIcon />
          Copied
        </>
      ) : (
        <>
          <CopyIcon />
          Copy
        </>
      )}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CodeBlock({
  children,
  lang,
}: {
  children: string;
  lang?: DocCodeLang;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const resolvedLang = lang ?? detectCodeLang(children);

  useEffect(() => {
    let active = true;
    void highlightCode(children, resolvedLang).then((result) => {
      if (active) setHtml(result);
    });
    return () => {
      active = false;
    };
  }, [children, resolvedLang]);

  return (
    <div className="doc-code-wrap">
      <CopyButton text={children} />
      {html ? (
        <div className="doc-code-shiki" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="doc-code doc-code-fallback">
          <code>{children}</code>
        </pre>
      )}
    </div>
  );
}
