/*
 * Design: Engineering Blueprint — Command-palette style search
 * - Cmd+K triggered modal search
 * - Instant filtering with highlighted matches
 * - Keyboard navigable results
 */

import { searchSections, type DocSection } from "@/lib/docs-content";
import { FileText, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
}

export default function SearchDialog({
  isOpen,
  onClose,
  onNavigate,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocSection[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const found = searchSections(query);
    setResults(found);
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (section: DocSection) => {
      onNavigate(section.id);
      onClose();
    },
    [onNavigate, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [results, selectedIndex, handleSelect, onClose]
  );

  if (!isOpen) return null;

  // Extract a snippet around the match
  function getSnippet(content: string, q: string): string {
    const lower = content.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return content.slice(0, 120).trim() + "...";
    const start = Math.max(0, idx - 40);
    const end = Math.min(content.length, idx + q.length + 80);
    let snippet = content.slice(start, end).trim();
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";
    return snippet;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-[560px] mx-4 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索文档..."
            className="flex-1 bg-transparent text-[15px] font-sans text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-[14px] font-sans">
              没有找到匹配的内容
            </div>
          )}

          {results.map((section, i) => (
            <button
              key={section.id}
              onClick={() => handleSelect(section)}
              className={`
                w-full text-left px-4 py-3 border-b border-border/50
                transition-colors
                ${i === selectedIndex ? "bg-accent" : "hover:bg-accent/50"}
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText size={14} className="text-primary shrink-0" />
                <span className="font-sans font-medium text-[14px] text-foreground">
                  {section.title}
                </span>
                <span className="text-[11px] font-sans text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {section.category}
                </span>
              </div>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed ml-[22px] line-clamp-2 font-sans">
                {getSnippet(section.content, query)}
              </p>
            </button>
          ))}

          {!query.trim() && (
            <div className="px-4 py-6 text-center text-muted-foreground text-[13px] font-sans">
              输入关键词搜索文档内容
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-4 text-[11px] font-sans text-muted-foreground">
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded">↑↓</kbd>{" "}
            导航
          </span>
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded">↵</kbd>{" "}
            选择
          </span>
          <span>
            <kbd className="font-mono bg-muted px-1 py-0.5 rounded">Esc</kbd>{" "}
            关闭
          </span>
        </div>
      </div>
    </div>
  );
}
