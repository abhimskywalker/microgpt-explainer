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
  { id: "interactive-trainer", title: "Train It Yourself", icon: "🚀" },
];

export function TableOfContents({ hidden = false }: { hidden?: boolean }) {
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

  if (hidden) {
    return null;
  }

  return (
    <motion.nav
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: isVisible ? 0 : 40, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      className="fixed bottom-4 left-4 right-4 z-50 md:left-1/2 md:-translate-x-1/2 md:w-[34rem]"
      aria-label="Section navigation"
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
  );
}
