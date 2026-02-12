"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { Highlight } from "prism-react-renderer";

const inferenceCode = `# Inference: may the model babble back to us
temperature = 0.5  # control "creativity", low to high
print("\\n--- inference ---")
for sample_idx in range(20):
    keys, values = [[] for _ in range(n_layer)], [[] for _ in range(n_layer)]
    token_id = BOS
    sample = []
    for pos_id in range(block_size):
        logits = gpt(token_id, pos_id, keys, values)
        probs = softmax([l / temperature for l in logits])
        token_id = random.choices(range(vocab_size), weights=[p.data for p in probs])[0]
        if token_id == BOS:
            break
        sample.append(uchars[token_id])
    print(f"sample {sample_idx+1:2d}: {''.join(sample)}")`;

// Simulated name generation at different temperatures
const sampleNames: Record<number, string[]> = {
  0.2: ["anna", "john", "mary", "james", "sarah", "david", "emma", "michael", "lisa", "robert"],
  0.5: ["arlen", "jorah", "mira", "kellan", "sonia", "davin", "elara", "matteo", "lina", "ronan"],
  0.8: ["axelry", "joquin", "mytha", "kelvorn", "suneya", "daxim", "elvyra", "mozzik", "lynqua", "rovain"],
  1.0: ["azxlry", "jqpwn", "mzthk", "kvbrn", "sxnyq", "dxzm", "ezvyr", "mzqk", "lxqa", "rxvn"],
};

const getNames = (temp: number): string[] => {
  const key = temp <= 0.3 ? 0.2 : temp <= 0.6 ? 0.5 : temp <= 0.85 ? 0.8 : 1.0;
  return sampleNames[key];
};

export function InferenceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [temperature, setTemperature] = useState(0.5);
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGeneratedNames([]);

    const names = getNames(temperature);
    for (let i = 0; i < names.length; i++) {
      await new Promise((r) => setTimeout(r, 150));
      setGeneratedNames((prev) => [...prev, names[i]]);
    }
    setIsGenerating(false);
  }, [temperature, isGenerating]);

  return (
    <section id="inference" ref={ref} className="min-h-screen py-20 px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="space-y-16"
        >
          <div className="text-center space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl font-bold"
            >
              <span className="text-[var(--accent-bright)]">Inference</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto"
            >
              After training, the model generates new names by sampling from its learned
              probability distribution. Temperature controls the creativity vs coherence
              tradeoff.
            </motion.p>
          </div>

          <div className="grid xl:grid-cols-2 gap-12">
            {/* Code */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-[var(--accent)]">Generation Loop</h3>

              <div className="bg-[color-mix(in_srgb,var(--code-bg)_76%,transparent)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="bg-[color-mix(in_srgb,var(--card-bg)_72%,var(--muted))] px-4 py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--accent-bright)] font-mono text-sm">Inference code</span>
                </div>
                <div className="p-4 font-mono text-xs overflow-x-auto">
                  <Highlight
                    language="python"
                    code={inferenceCode}
                    theme={{
                      plain: { backgroundColor: "transparent", color: "var(--foreground)" },
                      styles: [
                        { types: ["keyword"], style: { color: "var(--accent)" } },
                        { types: ["string"], style: { color: "#84cc16" } },
                        { types: ["number"], style: { color: "#06b6d4" } },
                        { types: ["comment"], style: { color: "var(--muted-foreground)", fontStyle: "italic" } },
                        { types: ["function"], style: { color: "#8b5cf6" } },
                        { types: ["operator"], style: { color: "var(--accent)" } },
                        { types: ["punctuation"], style: { color: "var(--muted-foreground)" } },
                      ],
                    }}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre className={className} style={{ ...style, background: "transparent", margin: 0, padding: 0 }}>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </div>
              </div>

              <div className="bg-[color-mix(in_srgb,var(--card-bg)_50%,transparent)] border-l-4 border-[var(--accent)] p-4 rounded-r-lg">
                <p className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))]">
                  <strong className="text-[var(--accent-bright)]">Temperature</strong> divides the logits before
                  softmax. Low temperature → sharp distribution (safe, repetitive). High temperature
                  → flat distribution (creative, chaotic).
                </p>
              </div>
            </motion.div>

            {/* Interactive generator */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-[var(--accent)]">Try It</h3>

              <div className="bg-[color-mix(in_srgb,var(--code-bg)_56%,transparent)] border border-[var(--border)] rounded-lg p-6 space-y-6">
                {/* Temperature slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] text-sm">Temperature</label>
                    <span className="text-[var(--accent-bright)] font-mono text-lg">{temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    data-guide-anchor="inference-temp"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[color-mix(in_srgb,var(--muted)_78%,var(--background))] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                    <span>Conservative</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                <button
                  onClick={generate}
                  data-guide-anchor="inference-generate"
                  disabled={isGenerating}
                  className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--background)] font-semibold rounded-lg hover:bg-[var(--accent-bright)] transition-colors disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Names"}
                </button>

                {/* Output terminal */}
                <div className="bg-[color-mix(in_srgb,var(--code-bg)_88%,#000000)] border border-[var(--border)] rounded-lg p-4 min-h-[200px] font-mono text-sm">
                  <div className="text-[var(--muted-foreground)] mb-2">--- inference ---</div>
                  {generatedNames.map((name, i) => (
                    <motion.div
                      key={`${name}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[color-mix(in_srgb,var(--accent)_75%,var(--foreground))]"
                    >
                      sample {String(i + 1).padStart(2)}: {name}
                    </motion.div>
                  ))}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-[var(--accent-bright)] animate-pulse" />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
