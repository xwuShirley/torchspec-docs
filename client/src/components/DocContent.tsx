/*
 * Design: Engineering Blueprint — Clean documentation content renderer
 * - Renders doc section content with proper code highlighting
 * - Tables styled as engineering spec sheets
 * - Code blocks with copy button and syntax highlighting
 */

import { getAllSections, getSectionById, type DocSection } from "@/lib/docs-content";
import { Check, Copy, Link } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import python from "highlight.js/lib/languages/python";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("python", python);

interface DocContentProps {
  sectionId: string;
  onNavigate: (sectionId: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2.5 right-2.5 p-1.5 rounded-md
                 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/90
                 transition-colors"
      title="复制代码"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function renderContent(content: string, onNavigate: (id: string) => void) {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```

      const code = codeLines.join("\n");
      let highlighted: string;
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(code, { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(code).value;
        }
      } catch {
        highlighted = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      elements.push(
        <div key={key++} className="relative group my-4">
          {lang && (
            <div className="absolute top-0 left-0 px-3 py-1 text-[11px] font-mono text-white/40 uppercase tracking-wider">
              {lang}
            </div>
          )}
          <CopyButton text={code} />
          <pre
            className="bg-[#1e1e2e] text-[#cdd6f4] rounded-lg px-4 py-4 pt-8 overflow-x-auto
                        text-[13px] leading-[1.7] font-mono border border-white/5"
          >
            <code dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        </div>
      );
      continue;
    }

    // Table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith("|") &&
        lines[i].trim().endsWith("|")
      ) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split("|")
          .filter((c) => c.trim())
          .map((c) => c.trim());
        const bodyRows = tableLines.slice(2).map((row) =>
          row
            .split("|")
            .filter((c) => c.trim())
            .map((c) => c.trim())
        );

        elements.push(
          <div key={key++} className="my-4 overflow-x-auto">
            <table className="w-full text-[13.5px] border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  {headerCells.map((cell, ci) => (
                    <th
                      key={ci}
                      className="text-left py-2.5 px-3 font-sans font-semibold text-foreground"
                    >
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="py-2.5 px-3 text-foreground/85"
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} className="my-3 ml-5 space-y-1.5 list-decimal">
          {listItems.map((item, li) => (
            <li
              key={li}
              className="text-[15px] leading-[1.75] text-foreground/85 pl-1"
            >
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list
    if (line.trim().startsWith("- ")) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} className="my-3 ml-5 space-y-1.5 list-disc">
          {listItems.map((item, li) => (
            <li
              key={li}
              className="text-[15px] leading-[1.75] text-foreground/85 pl-1"
            >
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Bold heading line (e.g. **推理侧**（InferenceEngine）：)
    if (line.trim().startsWith("**") && line.trim().includes("**")) {
      elements.push(
        <p
          key={key++}
          className="text-[15px] leading-[1.75] text-foreground mt-4 mb-1"
        >
          {renderInline(line.trim())}
        </p>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].trim().startsWith("- ") &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith("**") && lines[i].trim().endsWith("："))
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      elements.push(
        <p
          key={key++}
          className="text-[15px] leading-[1.8] text-foreground/85 my-3"
        >
          {renderInline(paraLines.join(" "))}
        </p>
      );
    }
  }

  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Process inline code and bold
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let k = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    let firstMatch: { type: "code" | "bold"; index: number; full: string; inner: string } | null = null;

    if (codeMatch && codeMatch.index !== undefined) {
      firstMatch = { type: "code", index: codeMatch.index, full: codeMatch[0], inner: codeMatch[1] };
    }
    if (boldMatch && boldMatch.index !== undefined) {
      if (!firstMatch || boldMatch.index < firstMatch.index) {
        firstMatch = { type: "bold", index: boldMatch.index, full: boldMatch[0], inner: boldMatch[1] };
      }
    }

    if (!firstMatch) {
      parts.push(remaining);
      break;
    }

    // Text before match
    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }

    if (firstMatch.type === "code") {
      parts.push(
        <code
          key={k++}
          className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-[0.88em]"
        >
          {firstMatch.inner}
        </code>
      );
    } else {
      parts.push(
        <strong key={k++} className="font-semibold text-foreground">
          {firstMatch.inner}
        </strong>
      );
    }

    remaining = remaining.slice(firstMatch.index + firstMatch.full.length);
  }

  return parts;
}

export default function DocContent({ sectionId, onNavigate }: DocContentProps) {
  const section = useMemo(() => getSectionById(sectionId), [sectionId]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [sectionId]);

  if (!section) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-sans">
        选择一个章节开始阅读
      </div>
    );
  }

  return (
    <div ref={contentRef} className="h-full overflow-y-auto">
      <article className="max-w-[720px] px-6 py-8 lg:px-10 lg:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] font-sans text-muted-foreground mb-4">
          <span>{section.category}</span>
          <span className="text-border">/</span>
          <span className="text-foreground/70">{section.title}</span>
        </div>

        {/* Title */}
        <h1 className="font-sans font-bold text-[28px] text-foreground leading-tight mb-6 flex items-center gap-3">
          {section.title}
          <button
            onClick={() => {
              const url = `${window.location.origin}/#${section.id}`;
              navigator.clipboard.writeText(url);
            }}
            className="opacity-0 hover:opacity-100 focus:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
            title="复制链接"
          >
            <Link size={18} />
          </button>
        </h1>

        {/* Content */}
        <div className="doc-content">
          {renderContent(section.content, onNavigate)}
        </div>

        {/* Bottom navigation */}
        <div className="mt-12 pt-6 border-t border-border">
          <NavigationLinks sectionId={sectionId} onNavigate={onNavigate} />
        </div>
      </article>
    </div>
  );
}

function NavigationLinks({
  sectionId,
  onNavigate,
}: {
  sectionId: string;
  onNavigate: (id: string) => void;
}) {
  const sections = getAllSections();
  const currentIndex = sections.findIndex(
    (s: DocSection) => s.id === sectionId
  );
  const prev = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const next =
    currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  return (
    <div className="flex justify-between gap-4">
      {prev ? (
        <button
          onClick={() => onNavigate(prev.id)}
          className="text-left group"
        >
          <span className="text-[11px] font-sans text-muted-foreground uppercase tracking-wider">
            上一节
          </span>
          <div className="text-[14px] font-sans font-medium text-primary group-hover:underline">
            ← {prev.title}
          </div>
        </button>
      ) : (
        <div />
      )}
      {next ? (
        <button
          onClick={() => onNavigate(next.id)}
          className="text-right group"
        >
          <span className="text-[11px] font-sans text-muted-foreground uppercase tracking-wider">
            下一节
          </span>
          <div className="text-[14px] font-sans font-medium text-primary group-hover:underline">
            {next.title} →
          </div>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
