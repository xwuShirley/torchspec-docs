/*
 * Design: Engineering Blueprint — SGLang-style documentation layout
 * - Fixed left sidebar (272px) with categorized navigation
 * - Top bar with progress indicator and theme toggle
 * - Main content area with rendered documentation
 * - Cmd+K search dialog
 */

import DocContent from "@/components/DocContent";
import SearchDialog from "@/components/SearchDialog";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { getAllSections } from "@/lib/docs-content";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle navigation
  const handleNavigate = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
  }, []);

  // Read hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const sections = getAllSections();
      const found = sections.find((s) => s.id === hash);
      if (found) setActiveSection(hash);
    }
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Track reading progress
  useEffect(() => {
    const el = contentRef.current?.querySelector(".h-full.overflow-y-auto");
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el as HTMLElement;
      const progress =
        scrollHeight <= clientHeight
          ? 100
          : (scrollTop / (scrollHeight - clientHeight)) * 100;
      setReadProgress(Math.min(100, progress));
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeSection]);

  return (
    <div className="h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onSearchOpen={() => setSearchOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Top bar */}
      <TopBar
        onMenuOpen={() => setSidebarOpen(true)}
        progress={readProgress}
      />

      {/* Main content */}
      <main
        ref={contentRef}
        className="lg:ml-[272px] mt-12 h-[calc(100vh-48px)]"
      >
        <DocContent sectionId={activeSection} onNavigate={handleNavigate} />
      </main>

      {/* Search dialog */}
      <SearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
