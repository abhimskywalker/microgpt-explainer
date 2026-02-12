"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";

type GuidedStep = {
  id: string;
  sectionId: string;
  title: string;
  instruction: string;
  why: string;
  selector?: string;
};

const STEPS: GuidedStep[] = [
  {
    id: "intro",
    sectionId: "hero",
    title: "Start Here",
    instruction: "Click Explore the Algorithm to enter the walkthrough.",
    why: "We move in a fixed order so you do not have to decide what to read next.",
    selector: '[data-guide-anchor="hero-explore"]',
  },
  {
    id: "tokenize",
    sectionId: "data",
    title: "Tokenize a Name",
    instruction: "Type a short name and observe token IDs.",
    why: "Everything in GPT begins as discrete tokens.",
    selector: '[data-guide-anchor="data-input"]',
  },
  {
    id: "backprop",
    sectionId: "autograd",
    title: "Run Backprop",
    instruction: "Press Run Backward Pass and watch gradients propagate.",
    why: "This is the core learning mechanism behind model updates.",
    selector: '[data-guide-anchor="autograd-run"]',
  },
  {
    id: "weights",
    sectionId: "parameters",
    title: "Inspect a Matrix",
    instruction: "Click any weight matrix tile to open its detail panel.",
    why: "Parameters are the memory of the model.",
    selector: '[data-guide-anchor="matrix-wte"]',
  },
  {
    id: "attention",
    sectionId: "architecture",
    title: "Trigger Attention Pattern",
    instruction: "Click Same Letters and compare the attention bars.",
    why: "Attention determines which context tokens matter.",
    selector: '[data-guide-anchor="attention-same"]',
  },
  {
    id: "train",
    sectionId: "training",
    title: "Simulate Training",
    instruction: "Click Start Training and observe the loss curve.",
    why: "You can see optimization dynamics instead of reading theory.",
    selector: '[data-guide-anchor="training-start"]',
  },
  {
    id: "temp",
    sectionId: "inference",
    title: "Adjust Temperature",
    instruction: "Move temperature and then generate sample names.",
    why: "Temperature directly controls creativity vs stability.",
    selector: '[data-guide-anchor="inference-temp"]',
  },
  {
    id: "generate",
    sectionId: "inference",
    title: "Generate Names",
    instruction: "Press Generate Names and compare outputs.",
    why: "This is inference: sampling from next-token probabilities.",
    selector: '[data-guide-anchor="inference-generate"]',
  },
  {
    id: "copy",
    sectionId: "full-code",
    title: "Take the Full Code",
    instruction: "Use Copy to grab the complete microGPT file.",
    why: "You leave with a runnable reference, not just visuals.",
    selector: '[data-guide-anchor="fullcode-copy"]',
  },
];

const STORAGE_KEY = "microgpt-guided-mode-v1";

function readStoredProgress(): { stepIndex: number; completed: number[] } {
  if (typeof window === "undefined") {
    return { stepIndex: 0, completed: [] };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { stepIndex: 0, completed: [] };
  }
  try {
    const parsed = JSON.parse(raw) as { stepIndex?: number; completed?: number[] };
    const stepIndex =
      typeof parsed.stepIndex === "number"
        ? Math.min(STEPS.length - 1, Math.max(0, parsed.stepIndex))
        : 0;
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((n) => Number.isInteger(n) && n >= 0 && n < STEPS.length)
      : [];
    return { stepIndex, completed };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { stepIndex: 0, completed: [] };
  }
}

type GuidedModeProps = {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
};

export function GuidedMode({ enabled, onEnabledChange }: GuidedModeProps) {
  const [stepIndex, setStepIndex] = useState(() => readStoredProgress().stepIndex);
  const [completed, setCompleted] = useState<number[]>(() => readStoredProgress().completed);
  const [showWhy, setShowWhy] = useState(false);

  const activeStep = STEPS[stepIndex];
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;
  const markDone = useCallback(() => {
    setCompleted((prev) => (prev.includes(stepIndex) ? prev : [...prev, stepIndex]));
  }, [stepIndex]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ enabled, stepIndex, completed })
    );
  }, [enabled, stepIndex, completed]);

  useEffect(() => {
    const sectionEls = Array.from(document.querySelectorAll("section[id]"));
    sectionEls.forEach((section) => {
      section.removeAttribute("data-guided-active");
      section.removeAttribute("data-guided-dimmed");
    });
    document.querySelectorAll(".guided-focus").forEach((el) => el.classList.remove("guided-focus"));

    if (!enabled) {
      return;
    }

    sectionEls.forEach((section) => {
      const isActive = section.id === activeStep.sectionId;
      section.setAttribute("data-guided-active", String(isActive));
      section.setAttribute("data-guided-dimmed", String(!isActive));
    });

    const activeSection = document.getElementById(activeStep.sectionId);
    activeSection?.scrollIntoView({ behavior: "smooth", block: "start" });

    let cleanupClick: (() => void) | undefined;
    if (activeStep.selector) {
      const target = document.querySelector<HTMLElement>(activeStep.selector);
      if (target) {
        target.classList.add("guided-focus");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        const onClick = () => markDone();
        target.addEventListener("click", onClick, { once: true });
        cleanupClick = () => target.removeEventListener("click", onClick);
      }
    }

    return () => {
      if (cleanupClick) cleanupClick();
    };
  }, [enabled, activeStep, markDone]);

  const goToStep = (next: number) => {
    setShowWhy(false);
    setStepIndex(Math.min(STEPS.length - 1, Math.max(0, next)));
  };

  const isCurrentDone = useMemo(() => completed.includes(stepIndex), [completed, stepIndex]);

  return (
    <>
      <button
        type="button"
        onClick={() => onEnabledChange(!enabled)}
        className="fixed top-6 right-24 z-[60] px-3 py-2 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm"
        style={{
          background: enabled
            ? "color-mix(in srgb, var(--accent) 20%, var(--card-bg))"
            : "color-mix(in srgb, var(--card-bg) 88%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          color: enabled ? "var(--accent)" : "var(--foreground)",
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          <SparklesIcon className="w-4 h-4" />
          {enabled ? "Guided On" : "Guided Mode"}
        </span>
      </button>

      <AnimatePresence>
        {enabled && (
          <motion.aside
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed z-[60] left-4 right-4 bottom-24 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[42rem] rounded-2xl p-4 shadow-2xl backdrop-blur-md"
            style={{
              background: "color-mix(in srgb, var(--card-bg) 94%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "var(--muted-foreground)" }}>
                  Guided Mode
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Step {stepIndex + 1} of {STEPS.length}: {activeStep.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEnabledChange(false)}
                className="text-xs px-2 py-1 rounded-md"
                style={{
                  color: "var(--muted-foreground)",
                  background: "color-mix(in srgb, var(--muted) 55%, transparent)",
                }}
              >
                Exit
              </button>
            </div>

            <p className="text-sm" style={{ color: "color-mix(in srgb, var(--foreground) 90%, var(--background))" }}>
              {activeStep.instruction}
            </p>

            {showWhy && (
              <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                {activeStep.why}
              </p>
            )}

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => goToStep(stepIndex - 1)}
                disabled={stepIndex === 0}
                className="px-3 py-2 rounded-md text-xs disabled:opacity-40"
                style={{ background: "color-mix(in srgb, var(--muted) 55%, transparent)" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={markDone}
                className="px-3 py-2 rounded-md text-xs font-semibold"
                style={{
                  background: isCurrentDone
                    ? "color-mix(in srgb, #10b981 22%, transparent)"
                    : "color-mix(in srgb, var(--accent) 18%, transparent)",
                  color: isCurrentDone ? "#047857" : "var(--accent)",
                }}
              >
                {isCurrentDone ? "Done" : "Mark Done"}
              </button>
              <button
                type="button"
                onClick={() => setShowWhy((v) => !v)}
                className="px-3 py-2 rounded-md text-xs"
                style={{ background: "color-mix(in srgb, var(--muted) 45%, transparent)" }}
              >
                {showWhy ? "Hide Why" : "Why This"}
              </button>
              <button
                type="button"
                onClick={() => goToStep(stepIndex + 1)}
                disabled={stepIndex === STEPS.length - 1}
                className="px-3 py-2 rounded-md text-xs col-span-2 sm:col-span-2 disabled:opacity-40"
                style={{
                  background: "color-mix(in srgb, var(--accent) 18%, transparent)",
                  color: "var(--accent)",
                }}
              >
                Next Step
              </button>
            </div>

            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <motion.div
                className="h-full"
                animate={{ width: `${progressPct}%` }}
                style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-bright))" }}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
