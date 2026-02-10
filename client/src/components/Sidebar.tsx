/*
 * Design: Engineering Blueprint — SGLang-style sidebar navigation
 * - Fixed left sidebar with logo, search trigger, and categorized nav links
 * - Active section highlighted with left border accent
 * - Clean, functional, no-frills documentation navigation
 */

import { getCategories } from "@/lib/docs-content";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface SidebarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onSearchOpen: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  activeSection,
  onNavigate,
  onSearchOpen,
  isOpen,
  onClose,
}: SidebarProps) {
  const categories = getCategories();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = useCallback((name: string) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  // Close sidebar on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[272px]
          bg-sidebar border-r border-sidebar-border
          overflow-y-auto
          transition-transform duration-200 ease-out
          lg:translate-x-0 lg:z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo area */}
        <div className="sticky top-0 bg-sidebar z-10 px-4 pt-5 pb-3 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-sans font-bold text-sm">
                  TS
                </span>
              </div>
              <div>
                <h1 className="font-sans font-bold text-[15px] text-sidebar-foreground leading-tight">
                  TorchSpec
                </h1>
                <span className="font-sans text-[11px] text-muted-foreground">
                  v0.0.1
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search trigger */}
          <button
            onClick={onSearchOpen}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-md
                       border border-sidebar-border bg-background/50
                       text-muted-foreground text-[13px] font-sans
                       hover:border-primary/30 hover:bg-background transition-colors"
          >
            <Search size={14} />
            <span>搜索文档...</span>
            <kbd className="ml-auto text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-3">
          {categories.map((cat) => {
            const isCollapsed = collapsed[cat.name];
            return (
              <div key={cat.name} className="mb-1">
                <button
                  onClick={() => toggleCategory(cat.name)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5
                             font-sans font-semibold text-[12px] uppercase tracking-wider
                             text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                  {cat.name}
                </button>

                {!isCollapsed && (
                  <ul className="ml-1 mb-2">
                    {cat.sections.map((section) => {
                      const isActive = activeSection === section.id;
                      return (
                        <li key={section.id}>
                          <button
                            onClick={() => {
                              onNavigate(section.id);
                              onClose();
                            }}
                            className={`
                              w-full text-left px-3 py-1.5 text-[13.5px] font-sans
                              border-l-2 transition-colors duration-100
                              ${
                                isActive
                                  ? "border-primary text-primary font-medium bg-sidebar-accent"
                                  : "border-transparent text-sidebar-foreground hover:text-foreground hover:border-border hover:bg-sidebar-accent/50"
                              }
                            `}
                          >
                            {section.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 mt-2 border-t border-sidebar-border">
          <a
            href="https://github.com/torchspec/torchspec"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[12px] font-sans text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="currentColor"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </aside>
    </>
  );
}
