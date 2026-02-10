/*
 * Design: Engineering Blueprint — Minimal top bar for mobile + theme toggle
 * - Only visible on mobile as a hamburger menu trigger
 * - On desktop, shows a thin reading progress bar
 * - Theme toggle (light/dark) on the right
 */

import { useTheme } from "@/contexts/ThemeContext";
import { Menu, Moon, Sun } from "lucide-react";

interface TopBarProps {
  onMenuOpen: () => void;
  progress: number;
}

export default function TopBar({ onMenuOpen, progress }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[272px] z-30 bg-background/80 backdrop-blur-md border-b border-border">
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />

      <div className="flex items-center justify-between px-4 h-12">
        {/* Mobile menu button */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Mobile title */}
        <div className="lg:hidden font-sans font-semibold text-[14px] text-foreground">
          TorchSpec Docs
        </div>

        {/* Desktop spacer */}
        <div className="hidden lg:block" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/torchspec/torchspec"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="GitHub"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={theme === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
