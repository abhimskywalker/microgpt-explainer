"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const sections = [
  { id: "hero", title: "Introduction", icon: "🎯" },
  { id: "data", title: "The Data", icon: "📚" },
  { id: "autograd", title: "Autograd Engine", icon: "⚡" },
  { id: "parameters", title: "Parameters", icon: "🔧" },
  { id: "architecture", title: "Architecture", icon: "🏗️" },
  { id: "training", title: "Training Loop", icon: "🔄" },
  { id: "inference", title: "Inference", icon: "🎭" },
  { id: "full-code", title: "Full Code", icon: "📜" },
];

export function TableOfContents() {
  const [activeSection, setActiveSection] = useState("hero");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-15% 0px -45% 0px" }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    // Show TOC after initial load
    const revealTimer = window.setTimeout(() => setIsVisible(true), 900);

    return () => {
      window.clearTimeout(revealTimer);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeSection)
  );
  const progressPct = ((activeIndex + 1) / sections.length) * 100;
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === sections.length - 1;

  const goToAdjacent = (direction: -1 | 1) => {
    const nextIndex = Math.min(
      sections.length - 1,
      Math.max(0, activeIndex + direction)
    );
    scrollToSection(sections[nextIndex].id);
  };

  return (
    <>
      <motion.nav
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: isVisible ? 0 : -100, opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block"
        aria-label="Section navigation"
      >
        <div 
          className="backdrop-blur-sm rounded-2xl p-4 shadow-xl w-[260px]"
          style={{
            background: `color-mix(in srgb, var(--card-bg) 90%, transparent)`,
            border: `1px solid color-mix(in srgb, var(--accent) 20%, transparent)`,
          }}
        >
          <div className="mb-3 px-1">
            <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--muted-foreground)" }}>
              Learning Path
            </p>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Step {activeIndex + 1} of {sections.length}
            </p>
          </div>

          <div className="space-y-2">
            {sections.map(({ id, title, icon }, index) => (
              <motion.button
                key={id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                onClick={() => scrollToSection(id)}
                type="button"
                aria-current={activeSection === id ? "step" : undefined}
                aria-label={`Jump to ${title}`}
                className="group flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-300"
                style={{
                  backgroundColor: activeSection === id 
                    ? `color-mix(in srgb, var(--accent) 20%, transparent)`
                    : 'transparent',
                  color: activeSection === id 
                    ? 'var(--accent)'
                    : 'var(--muted-foreground)',
                  boxShadow: activeSection === id ? `0 4px 12px color-mix(in srgb, var(--accent) 15%, transparent)` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== id) {
                    e.currentTarget.style.color = 'var(--foreground)';
                    e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--muted) 50%, transparent)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== id) {
                    e.currentTarget.style.color = 'var(--muted-foreground)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate transition-colors">
                    {title}
                  </p>
                </div>
                
                {activeSection === id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--accent-bright)' }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          
          <div 
            className="mt-4 pt-4 space-y-3"
            style={{ borderTop: `1px solid var(--border)` }}
          >
            <div 
              className="relative h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--muted)' }}
            >
              <motion.div
                className="h-full"
                style={{
                  background: `linear-gradient(90deg, var(--accent) 0%, var(--accent-bright) 100%)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => goToAdjacent(-1)}
                disabled={isFirst}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: `color-mix(in srgb, var(--muted) 55%, transparent)`,
                  color: "var(--foreground)",
                }}
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={() => goToAdjacent(1)}
                disabled={isLast}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: `color-mix(in srgb, var(--accent) 20%, transparent)`,
                  color: "var(--accent)",
                }}
              >
                Next
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <motion.nav
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: isVisible ? 0 : 40, opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="fixed bottom-4 left-4 right-4 z-50 lg:hidden"
        aria-label="Mobile section navigation"
      >
        <div
          className="rounded-2xl p-3 shadow-xl backdrop-blur-md"
          style={{
            background: "color-mix(in srgb, var(--card-bg) 88%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goToAdjacent(-1)}
              disabled={isFirst}
              className="h-10 w-10 rounded-lg inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "color-mix(in srgb, var(--muted) 55%, transparent)" }}
              aria-label="Go to previous section"
            >
              <ChevronLeftIcon className="w-5 h-5" style={{ color: "var(--foreground)" }} />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection(sections[activeIndex].id)}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-center"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
              aria-label={`Current section: ${sections[activeIndex].title}`}
            >
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Step {activeIndex + 1} of {sections.length}
              </p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                {sections[activeIndex].title}
              </p>
            </button>

            <button
              type="button"
              onClick={() => goToAdjacent(1)}
              disabled={isLast}
              className="h-10 w-10 rounded-lg inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "color-mix(in srgb, var(--accent) 22%, transparent)" }}
              aria-label="Go to next section"
            >
              <ChevronRightIcon className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </button>
          </div>

          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-bright))" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </motion.nav>
    </>
  );
}
