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
      <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950" />
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(245, 158, 11, 0.1) 2px,
            rgba(245, 158, 11, 0.1) 3px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            rgba(245, 158, 11, 0.05) 40px,
            rgba(245, 158, 11, 0.05) 41px
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
            className="inline-flex items-center px-6 py-3 rounded-full bg-stone-900/80 backdrop-blur-sm border border-amber-500/20"
          >
            <span className="text-amber-300 font-mono text-sm">@karpathy</span>
          </motion.div>

          {/* Main title */}
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-6xl lg:text-8xl font-bold tracking-tight"
            >
              <span className="text-amber-50">micro</span>
              <span className="text-amber-400 text-glow">GPT</span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="space-y-4"
            >
              <p className="text-xl lg:text-2xl text-amber-200 font-light max-w-4xl mx-auto">
                The complete GPT algorithm in{" "}
                <span className="font-mono font-semibold text-amber-400">243 lines</span>{" "}
                of pure Python
              </p>
              
              <p className="text-lg text-stone-400 max-w-3xl mx-auto italic">
                "Everything else is just efficiency"
              </p>
            </motion.div>
          </div>

          {/* Interactive elements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <button
              onClick={() => document.getElementById('data')?.scrollIntoView({ behavior: 'smooth' })}
              className="group px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-1"
            >
              Explore the Algorithm
              <ArrowDownIcon className="w-5 h-5 ml-2 inline-block group-hover:translate-y-1 transition-transform" />
            </button>
            
            <a
              href="https://github.com/karpathy/microgpt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-amber-500/50 text-amber-300 hover:text-amber-200 hover:border-amber-400 font-mono text-sm rounded-lg transition-all duration-300 hover:bg-amber-500/10"
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
              className="w-6 h-10 border-2 border-amber-500/50 rounded-full p-1"
            >
              <motion.div 
                className="w-1 h-3 bg-amber-400 rounded-full mx-auto"
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