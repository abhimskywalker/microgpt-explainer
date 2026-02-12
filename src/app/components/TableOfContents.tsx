"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const sections = [
  { id: "hero", title: "Introduction", icon: "🎯" },
  { id: "data", title: "The Data", icon: "📚" },
  { id: "autograd", title: "Autograd Engine", icon: "⚡" },
  { id: "parameters", title: "Parameters", icon: "🔧" },
  { id: "architecture", title: "Architecture", icon: "🏗️" },
  { id: "training", title: "Training Loop", icon: "🔄" },
  { id: "inference", title: "Inference", icon: "🎭" },
  { id: "fullcode", title: "Full Code", icon: "📜" },
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
      { threshold: 0.3 }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    // Show TOC after initial load
    setTimeout(() => setIsVisible(true), 1000);

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: isVisible ? 0 : -100, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block"
    >
      <div className="bg-stone-900/90 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-4 shadow-xl">
        <div className="space-y-2">
          {sections.map(({ id, title, icon }, index) => (
            <motion.button
              key={id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
              onClick={() => scrollToSection(id)}
              className={`
                group flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-300
                ${activeSection === id
                  ? 'bg-amber-500/20 text-amber-300 shadow-lg'
                  : 'text-stone-400 hover:text-amber-200 hover:bg-stone-800/50'
                }
              `}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-lg">{icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate group-hover:text-amber-200 transition-colors">
                  {title}
                </p>
              </div>
              
              {activeSection === id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="w-2 h-2 bg-amber-400 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 pt-4 border-t border-stone-700">
          <div className="relative h-2 bg-stone-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ 
                width: `${((sections.findIndex(s => s.id === activeSection) + 1) / sections.length) * 100}%` 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}