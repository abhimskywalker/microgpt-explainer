"use client";

import { motion } from "framer-motion";
import { ArrowDownIcon } from "@heroicons/react/24/outline";

export function HeroSection() {
  return (
    <section 
      id="hero" 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* Background pattern */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, var(--background) 0%, color-mix(in srgb, var(--background) 95%, var(--muted)) 50%, var(--background) 100%)`,
        }}
      />
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            var(--accent) 2px,
            var(--accent) 3px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            color-mix(in srgb, var(--accent) 50%, transparent) 40px,
            color-mix(in srgb, var(--accent) 50%, transparent) 41px
          )`,
        }}
      />
      
      <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-12"
        >
          {/* Attribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center px-6 py-3 rounded-full backdrop-blur-sm"
            style={{
              background: `color-mix(in srgb, var(--card-bg) 80%, transparent)`,
              border: `1px solid color-mix(in srgb, var(--accent) 20%, transparent)`,
            }}
          >
            <a 
              href="https://x.com/karpathy/status/2021694437152157847"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm hover:underline transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              @karpathy
            </a>
          </motion.div>

          {/* Main title */}
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-6xl lg:text-8xl font-bold tracking-tight"
            >
              <span style={{ color: 'var(--foreground)' }}>micro</span>
              <span 
                className="text-glow"
                style={{ color: 'var(--accent-bright)' }}
              >
                GPT
              </span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="space-y-4"
            >
              <p 
                className="text-xl lg:text-2xl font-light max-w-4xl mx-auto"
                style={{ color: 'color-mix(in srgb, var(--foreground) 85%, var(--background))' }}
              >
                The complete GPT algorithm in{" "}
                <span 
                  className="font-mono font-semibold"
                  style={{ color: 'var(--accent-bright)' }}
                >
                  243 lines
                </span>{" "}
                of pure Python
              </p>
              
              <p 
                className="text-lg max-w-3xl mx-auto italic"
                style={{ color: 'var(--muted-foreground)' }}
              >
                &quot;Everything else is just efficiency&quot;
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {[
              "8 guided sections",
              "Interactive demos",
              "Read in ~12 minutes",
            ].map((item) => (
              <span
                key={item}
                className="px-4 py-2 rounded-full text-xs font-medium tracking-wide"
                style={{
                  color: "var(--foreground)",
                  background: "color-mix(in srgb, var(--card-bg) 55%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                }}
              >
                {item}
              </span>
            ))}
          </motion.div>

          {/* Interactive elements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <button
              onClick={() => document.getElementById('data')?.scrollIntoView({ behavior: 'smooth' })}
              data-guide-anchor="hero-explore"
              className="group px-8 py-4 font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--background)',
                boxShadow: `0 10px 25px color-mix(in srgb, var(--accent) 25%, transparent)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-bright)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              Explore the Algorithm
              <ArrowDownIcon className="w-5 h-5 ml-2 inline-block group-hover:translate-y-1 transition-transform" />
            </button>
            
            <a
              href="https://gist.githubusercontent.com/karpathy/8627fe009c40f57531cb18360106ce95/raw/36df8c7772381057ed192af017433ce8a9f4bdcd/microgpt.py"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 font-mono text-sm rounded-lg transition-all duration-300"
              style={{
                border: `1px solid color-mix(in srgb, var(--accent) 50%, transparent)`,
                color: 'var(--accent)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.backgroundColor = `color-mix(in srgb, var(--accent) 10%, transparent)`;
                e.currentTarget.style.color = 'color-mix(in srgb, var(--foreground) 90%, var(--accent))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `color-mix(in srgb, var(--accent) 50%, transparent)`;
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--accent)';
              }}
            >
              View Source →
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-6 h-10 border-2 rounded-full p-1"
              style={{
                borderColor: `color-mix(in srgb, var(--accent) 50%, transparent)`,
              }}
            >
              <motion.div 
                className="w-1 h-3 rounded-full mx-auto"
                style={{ backgroundColor: 'var(--accent-bright)' }}
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
