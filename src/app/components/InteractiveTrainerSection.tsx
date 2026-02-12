"use client";

import { motion, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading" | "running" | "done" | "error";

interface TrainingStep {
  step: number;
  total: number;
  loss: number;
}

interface WorkerMessage {
  type: "loading" | "ready" | "running" | "result" | "error";
  runId?: number;
  stage?: string;
  output?: string;
  progress?: number;
  elapsedMs?: number;
  durationMs?: number;
  initDurationMs?: number;
  trainingDurationMs?: number;
  totalDurationMs?: number;
  usedWarmRuntime?: boolean;
  usedRemoteDataset?: boolean;
  usedOriginalScript?: boolean;
  estimatedStep?: number;
  totalSteps?: number;
  estimatedEtaMs?: number;
  error?: string;
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${sec}.${tenths}s`;
}

function LossChart({ steps }: { steps: TrainingStep[] }) {
  if (steps.length < 2) return null;

  const w = 500;
  const h = 100;
  const losses = steps.map((s) => s.loss);
  const minL = Math.min(...losses) * 0.95;
  const maxL = Math.max(...losses) * 1.05;
  const range = maxL - minL || 1;

  const points = steps.map((s, i) => {
    const x = (i / (steps.length - 1)) * w;
    const y = h - ((s.loss - minL) / range) * h;
    return `${x},${y}`;
  });

  const areaPoints = `0,${h} ${points.join(" ")} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trainerLossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#trainerLossGrad)" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="rgb(16,185,129)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function InteractiveTrainerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const [phase, setPhase] = useState<Phase>("idle");
  const [loadingStage, setLoadingStage] = useState("");
  const [stageProgress, setStageProgress] = useState(0);
  const [runElapsedMs, setRunElapsedMs] = useState(0);
  const [wasmInitMs, setWasmInitMs] = useState(0);
  const [pythonRunMs, setPythonRunMs] = useState(0);
  const [totalRunMs, setTotalRunMs] = useState(0);
  const [usedWarmRuntime, setUsedWarmRuntime] = useState<boolean | null>(null);
  const [usedRemoteDataset, setUsedRemoteDataset] = useState<boolean | null>(null);
  const [usedOriginalScript, setUsedOriginalScript] = useState<boolean | null>(null);
  const [estimatedStep, setEstimatedStep] = useState(0);
  const [estimatedTotalSteps, setEstimatedTotalSteps] = useState(0);
  const [estimatedEtaMs, setEstimatedEtaMs] = useState(0);

  const [lines, setLines] = useState<string[]>([]);
  const [steps, setSteps] = useState<TrainingStep[]>([]);
  const [samples, setSamples] = useState<string[]>([]);
  const [numSteps, setNumSteps] = useState(30);
  const [temperature, setTemperature] = useState(0.8);
  const [strictOriginal, setStrictOriginal] = useState(true);
  const [showSource, setShowSource] = useState(false);
  const [sourceCode, setSourceCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef(0);
  const outputRef = useRef<HTMLDivElement>(null);
  const runTickerRef = useRef<number | null>(null);
  const avgStepMsRef = useRef(220);

  const stopRunTicker = useCallback(() => {
    if (runTickerRef.current !== null) {
      window.clearInterval(runTickerRef.current);
      runTickerRef.current = null;
    }
  }, []);

  const startRunTicker = useCallback((totalSteps: number) => {
    const safeTotalSteps = Math.max(1, totalSteps);
    if (runTickerRef.current !== null) return;

    const startedAt = Date.now();
    const tick = () => {
      const elapsedMs = Date.now() - startedAt;
      const estimate = Math.min(safeTotalSteps, Math.max(1, Math.floor(elapsedMs / avgStepMsRef.current) + 1));
      const etaMs = Math.max(0, Math.round((safeTotalSteps - estimate) * avgStepMsRef.current));
      const pseudoProgress = Math.min(96, 68 + (estimate / safeTotalSteps) * 28);

      setRunElapsedMs(elapsedMs);
      setEstimatedTotalSteps(safeTotalSteps);
      setEstimatedStep(estimate);
      setEstimatedEtaMs(etaMs);
      setStageProgress((prev) => Math.max(prev, pseudoProgress));
    };

    tick();
    runTickerRef.current = window.setInterval(tick, 120);
  }, []);

  const parseOutput = useCallback((allLines: string[]) => {
    const parsedSteps: TrainingStep[] = [];
    const parsedSamples: string[] = [];

    for (const line of allLines) {
      const stepMatch = line.match(/step\s+(\d+)\/(\d+)\s+\|\s+loss\s+([0-9.eE+-]+)/);
      if (stepMatch) {
        parsedSteps.push({
          step: parseInt(stepMatch[1], 10),
          total: parseInt(stepMatch[2], 10),
          loss: parseFloat(stepMatch[3]),
        });
      }

      const sampleMatch = line.match(/^sample\s+\d+:\s*(.*)$/);
      if (sampleMatch) {
        parsedSamples.push(sampleMatch[1]);
      }
    }

    setSteps(parsedSteps);
    setSamples(parsedSamples);
  }, []);

  const startTraining = useCallback(async () => {
    setPhase("loading");
    setLines([]);
    setSteps([]);
    setSamples([]);
    setErrorMsg("");
    setLoadingStage("Loading training script...");
    setStageProgress(8);
    setRunElapsedMs(0);
    setWasmInitMs(0);
    setPythonRunMs(0);
    setTotalRunMs(0);
    setUsedWarmRuntime(null);
    setUsedRemoteDataset(null);
    setUsedOriginalScript(null);
    setEstimatedStep(0);
    setEstimatedTotalSteps(0);
    setEstimatedEtaMs(0);
    stopRunTicker();

    try {
      let code = sourceCode;
      if (!code) {
        const sourcePath = strictOriginal ? "/microgpt-original.py" : "/microgpt-karpathy.py";
        const resp = await fetch(sourcePath);
        if (resp.ok) {
          code = await resp.text();
          setSourceCode(code);
        } else if (!strictOriginal) {
          throw new Error(`Failed to load ${sourcePath}`);
        } else {
          const fallbackResp = await fetch("/microgpt-karpathy.py");
          if (!fallbackResp.ok) throw new Error("Failed to load fallback script");
          code = await fallbackResp.text();
          setSourceCode(code);
        }
      }

      let worker = workerRef.current;
      if (!worker) {
        worker = new Worker("/pyodide-worker.js");
        workerRef.current = worker;
      }

      setLoadingStage("Starting Pyodide worker...");
      setStageProgress(12);

      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      const seed = Math.floor(Math.random() * 2_147_483_647) + 1;

      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data;
        if (msg.runId !== runId) return;

        if (msg.type === "loading") {
          if (msg.stage) setLoadingStage(msg.stage);
          if (typeof msg.progress === "number") setStageProgress(msg.progress);
        } else if (msg.type === "ready") {
          setLoadingStage("Pyodide ready, preparing run...");
          if (typeof msg.progress === "number") setStageProgress(msg.progress);
        } else if (msg.type === "running") {
          setPhase("running");
          if (msg.stage) setLoadingStage(msg.stage);
          if (typeof msg.progress === "number") setStageProgress(msg.progress);
          startRunTicker(msg.totalSteps ?? numSteps);
        } else if (msg.type === "result") {
          stopRunTicker();

          const allLines = (msg.output || "").split("\n");
          setLines(allLines);
          parseOutput(allLines);

          const totalMs = typeof msg.totalDurationMs === "number" ? msg.totalDurationMs : (msg.durationMs || 0);
          setTotalRunMs(totalMs);
          setRunElapsedMs(totalMs);
          if (typeof msg.initDurationMs === "number") setWasmInitMs(msg.initDurationMs);
          if (typeof msg.trainingDurationMs === "number") {
            setPythonRunMs(msg.trainingDurationMs);
            const measuredStepMs = msg.trainingDurationMs / Math.max(1, numSteps);
            avgStepMsRef.current = Math.max(50, Math.round(0.7 * avgStepMsRef.current + 0.3 * measuredStepMs));
          }
          if (typeof msg.usedWarmRuntime === "boolean") setUsedWarmRuntime(msg.usedWarmRuntime);
          if (typeof msg.usedRemoteDataset === "boolean") setUsedRemoteDataset(msg.usedRemoteDataset);
          if (typeof msg.usedOriginalScript === "boolean") setUsedOriginalScript(msg.usedOriginalScript);

          setStageProgress(100);
          setPhase("done");
          if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
        } else if (msg.type === "error") {
          stopRunTicker();
          setPhase("error");
          setErrorMsg(msg.error || "Worker error");
        }
      };

      worker.onerror = (e) => {
        stopRunTicker();
        setPhase("error");
        setErrorMsg(e.message || "Worker error");
      };

      worker.postMessage({
        type: "run",
        runId,
        code,
        numSteps,
        temperature,
        seed,
        useOriginalScript: strictOriginal,
      });
    } catch (err: unknown) {
      stopRunTicker();
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to start");
    }
  }, [numSteps, temperature, strictOriginal, sourceCode, parseOutput, startRunTicker, stopRunTicker]);

  // Prewarm Pyodide on idle
  useEffect(() => {
    const worker = new Worker("/pyodide-worker.js");
    workerRef.current = worker;

    const prewarm = () => worker.postMessage({ type: "prewarm" });
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | null = null;
    let timerId: number | null = null;

    if (typeof idleWindow.requestIdleCallback === "function") {
      idleId = idleWindow.requestIdleCallback(prewarm, { timeout: 1600 });
    } else {
      timerId = window.setTimeout(prewarm, 350);
    }

    return () => {
      if (idleId !== null && typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (timerId !== null) window.clearTimeout(timerId);
      stopRunTicker();
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
  }, [stopRunTicker]);

  const resetToIdle = () => {
    setPhase("idle");
    setLines([]);
    setSteps([]);
    setSamples([]);
    setStageProgress(0);
    setRunElapsedMs(0);
    setWasmInitMs(0);
    setPythonRunMs(0);
    setTotalRunMs(0);
    setUsedWarmRuntime(null);
    setUsedRemoteDataset(null);
    setUsedOriginalScript(null);
    setEstimatedStep(0);
    setEstimatedTotalSteps(0);
    setEstimatedEtaMs(0);
  };

  const currentStep = steps.length > 0 ? steps[steps.length - 1] : null;
  const trainingProgress = currentStep ? (currentStep.step / currentStep.total) * 100 : 0;

  return (
    <section
      id="interactive-trainer"
      ref={sectionRef}
      className="py-20 md:py-32 relative overflow-hidden"
    >
      {/* Emerald/cyan ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[30%] -left-[15%] w-[60%] h-[60%] rounded-full blur-[120px]"
          style={{ background: "color-mix(in srgb, rgb(16,185,129) 8%, transparent)" }}
        />
        <div
          className="absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] rounded-full blur-[100px]"
          style={{ background: "color-mix(in srgb, rgb(6,182,212) 6%, transparent)" }}
        />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Section header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: "color-mix(in srgb, rgb(16,185,129) 10%, transparent)",
                border: "1px solid color-mix(in srgb, rgb(16,185,129) 25%, transparent)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono tracking-wider uppercase" style={{ color: "rgb(110,231,183)" }}>
                Interactive · Pyodide
              </span>
            </motion.div>

            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
              style={{
                background: "linear-gradient(135deg, rgb(167,243,208), rgb(103,232,249), rgb(167,243,208))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Train It Yourself
            </h2>
            <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              You&apos;ve seen every piece — the data, the autograd engine, the architecture, the training loop.
              Now run the real thing. This trains MicroGPT <em>in your browser</em> using Python compiled to WebAssembly.
            </p>
          </div>

          {/* Controls - idle state */}
          {phase === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-4 mb-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <label className="block text-xs uppercase tracking-wider mb-2 font-mono" style={{ color: "var(--muted-foreground)" }}>
                    Training Steps
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={numSteps}
                      onChange={(e) => setNumSteps(parseInt(e.target.value, 10))}
                      className="flex-1 h-1 accent-emerald-500"
                    />
                    <span className="text-lg font-mono w-10 text-right" style={{ color: "rgb(110,231,183)" }}>
                      {numSteps}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <label className="block text-xs uppercase tracking-wider mb-2 font-mono" style={{ color: "var(--muted-foreground)" }}>
                    Temperature
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0.4}
                      max={1.6}
                      step={0.1}
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="flex-1 h-1 accent-emerald-500"
                    />
                    <span className="text-lg font-mono w-10 text-right" style={{ color: "rgb(110,231,183)" }}>
                      {temperature.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              <label
                className="flex items-center gap-3 rounded-xl p-3 text-sm cursor-pointer"
                style={{
                  background: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                  border: "1px solid var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                <input
                  type="checkbox"
                  checked={strictOriginal}
                  onChange={(e) => {
                    setStrictOriginal(e.target.checked);
                    setSourceCode("");
                  }}
                  className="accent-emerald-500"
                />
                Use strict original Karpathy gist
              </label>

              <button
                onClick={startTraining}
                className="w-full py-3.5 rounded-xl font-medium tracking-wide transition-all duration-200 hover:shadow-lg active:scale-[0.98] text-white"
                style={{
                  background: "linear-gradient(135deg, rgb(5,150,105), rgb(8,145,178))",
                  boxShadow: "0 4px 24px color-mix(in srgb, rgb(16,185,129) 20%, transparent)",
                }}
              >
                🚀 Train MicroGPT
              </button>
            </motion.div>
          )}

          {/* Loading / early running state */}
          {(phase === "loading" || (phase === "running" && lines.length === 0)) && (
            <div className="text-center py-12">
              <div
                className="inline-flex items-center gap-3 px-5 py-3 rounded-xl mb-4"
                style={{
                  background: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                  border: "1px solid var(--border)",
                }}
              >
                <svg className="animate-spin w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{loadingStage}</span>
                <span className="text-xs font-mono" style={{ color: "rgb(110,231,183)" }}>{Math.floor(stageProgress)}%</span>
              </div>
              <div
                className="max-w-md mx-auto h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--muted)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${stageProgress}%`,
                    background: "linear-gradient(90deg, rgb(16,185,129), rgb(6,182,212))",
                  }}
                />
              </div>
              <p className="text-[11px] mt-4" style={{ color: "var(--muted-foreground)" }}>
                {phase === "loading"
                  ? "First run loads Python + stdlib into WebAssembly (~15s)"
                  : `Elapsed: ${formatDuration(runElapsedMs)}`}
              </p>
              {phase === "running" && estimatedTotalSteps > 0 && (
                <p className="text-[11px] mt-1 font-mono" style={{ color: "var(--muted-foreground)" }}>
                  Estimated step {estimatedStep}/{estimatedTotalSteps} · ETA {formatDuration(estimatedEtaMs)}
                </p>
              )}
            </div>
          )}

          {/* Error state */}
          {phase === "error" && (
            <div className="mb-8">
              <div
                className="rounded-xl p-4"
                style={{
                  background: "color-mix(in srgb, rgb(239,68,68) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, rgb(239,68,68) 25%, transparent)",
                }}
              >
                <p className="text-sm font-mono break-all" style={{ color: "rgb(252,165,165)" }}>{errorMsg}</p>
              </div>
              <button
                onClick={() => setPhase("idle")}
                className="mt-4 px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                ← Try Again
              </button>
            </div>
          )}

          {/* Training progress bar */}
          {(phase === "running" || phase === "done") && steps.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                <span>Step {currentStep?.step}/{currentStep?.total}</span>
                <span>Loss: {currentStep?.loss.toFixed(4)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${trainingProgress}%`,
                    background: "linear-gradient(90deg, rgb(16,185,129), rgb(6,182,212))",
                  }}
                />
              </div>
            </div>
          )}

          {/* Timing breakdown */}
          {phase === "done" && totalRunMs > 0 && (
            <div
              className="mb-6 rounded-xl p-3 text-xs font-mono"
              style={{
                background: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              Pyodide init: {formatDuration(wasmInitMs)} ({usedWarmRuntime ? "warm" : "cold"}) · Python run: {formatDuration(pythonRunMs)} · Total: {formatDuration(totalRunMs)} · Script: {usedOriginalScript ? "strict original" : "adapted"} · Dataset: {usedRemoteDataset ? "makemore names.txt" : "fallback"}
            </div>
          )}

          {/* Loss curve */}
          {steps.length > 1 && (
            <div
              className="mb-6 rounded-xl p-4"
              style={{
                background: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-[10px] uppercase tracking-wider mb-3 font-mono" style={{ color: "var(--muted-foreground)" }}>
                Loss Curve
              </p>
              <LossChart steps={steps} />
            </div>
          )}

          {/* Generated samples */}
          {samples.length > 0 && phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 rounded-xl p-4"
              style={{
                background: "color-mix(in srgb, rgb(16,185,129) 8%, transparent)",
                border: "1px solid color-mix(in srgb, rgb(16,185,129) 25%, transparent)",
              }}
            >
              <p className="text-[10px] uppercase tracking-wider mb-2 font-mono" style={{ color: "var(--muted-foreground)" }}>
                Generated Names
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm font-mono" style={{ color: "rgb(167,243,208)" }}>
                {samples.slice(0, 12).map((name, i) => (
                  <div key={`${name}-${i}`}>{i + 1}. {name || "<empty>"}</div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Output log */}
          {(phase === "running" || phase === "done") && lines.length > 0 && (
            <div className="mb-6">
              <div
                ref={outputRef}
                className="rounded-xl p-4 font-mono text-xs leading-relaxed max-h-64 overflow-y-auto"
                style={{
                  background: "color-mix(in srgb, var(--code-bg) 90%, transparent)",
                  border: "1px solid var(--border)",
                }}
              >
                {lines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      color: line.startsWith("===")
                        ? "rgb(52,211,153)"
                        : line.startsWith("step")
                        ? "rgb(103,232,249)"
                        : line.startsWith("sample")
                        ? "rgb(134,239,172)"
                        : line.startsWith("[stderr]")
                        ? "rgb(252,165,165)"
                        : "var(--muted-foreground)",
                      fontWeight: line.startsWith("===") ? 700 : 400,
                    }}
                  >
                    {line || "\u00A0"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Train Again button */}
          {phase === "done" && (
            <button
              onClick={resetToIdle}
              className="w-full py-3 rounded-xl text-sm transition-colors mb-6"
              style={{
                background: "color-mix(in srgb, var(--card-bg) 80%, transparent)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              🔄 Train Again {totalRunMs > 0 ? `(${formatDuration(totalRunMs)})` : ""}
            </button>
          )}

          {/* Collapsible source viewer */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "color-mix(in srgb, var(--card-bg) 60%, transparent)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={async () => {
                setShowSource(!showSource);
                if (!sourceCode) {
                  const sourcePath = strictOriginal ? "/microgpt-original.py" : "/microgpt-karpathy.py";
                  const resp = await fetch(sourcePath);
                  if (resp.ok) {
                    setSourceCode(await resp.text());
                  } else {
                    setSourceCode("Failed to load source.");
                  }
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-xs transition-colors"
              style={{ color: "var(--muted-foreground)" }}
            >
              <span className="uppercase tracking-wider font-mono">
                {strictOriginal ? "Python Source (strict original)" : "Python Source (adapted)"}
              </span>
              <span className="text-base">{showSource ? "−" : "+"}</span>
            </button>
            {showSource && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <pre
                  className="p-4 font-mono text-[11px] leading-relaxed max-h-96 overflow-auto whitespace-pre-wrap break-words"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {sourceCode || "Loading..."}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
