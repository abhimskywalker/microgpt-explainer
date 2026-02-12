"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon 
} from "@heroicons/react/24/outline";

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!resolvedTheme) {
    return null;
  }

  const themes = [
    { key: "light", label: "Light", icon: SunIcon },
    { key: "dark", label: "Dark", icon: MoonIcon },
    { key: "system", label: "System", icon: ComputerDesktopIcon },
  ];

  const currentTheme = themes.find(t => t.key === theme);
  const CurrentIcon = currentTheme?.icon || ComputerDesktopIcon;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Open theme selector"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-[var(--card-bg)] border border-[var(--border)] shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300"
        style={{
          background: `color-mix(in srgb, var(--card-bg) 80%, transparent)`,
        }}
      >
        <CurrentIcon className="w-5 h-5 text-[var(--foreground)]" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-40"
            />
            
            {/* Theme options */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="fixed top-20 right-6 z-50 p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] shadow-xl backdrop-blur-sm"
              style={{
                background: `color-mix(in srgb, var(--card-bg) 95%, transparent)`,
              }}
              role="menu"
              aria-label="Theme options"
            >
              <div className="space-y-1">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isActive = theme === themeOption.key;
                  
                  return (
                    <motion.button
                      key={themeOption.key}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setTheme(themeOption.key);
                        setIsOpen(false);
                      }}
                      type="button"
                      aria-checked={isActive}
                      role="menuitemradio"
                      className={`
                        flex items-center space-x-3 w-full px-4 py-2 rounded-lg text-left transition-all duration-200
                        ${isActive 
                          ? 'bg-[var(--accent)]/20 text-[var(--accent)] shadow-sm' 
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{themeOption.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTheme"
                          className="w-2 h-2 bg-[var(--accent)] rounded-full ml-auto"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Tip */}
              <div className="mt-3 pt-2 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] px-1">
                  System follows your OS preference
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
