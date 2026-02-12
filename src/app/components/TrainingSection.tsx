"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Highlight } from "prism-react-renderer";

const trainingCode = `# Adam optimizer
learning_rate, beta1, beta2, eps_adam = 1e-2, 0.9, 0.95, 1e-8
m = [0.0] * len(params)  # first moment buffer
v = [0.0] * len(params)  # second moment buffer

# Training loop
num_steps = 500
for step in range(num_steps):
    # Take single document, tokenize it
    doc = docs[step % len(docs)]
    tokens = [BOS] + [uchars.index(ch) for ch in doc] + [BOS]
    n = min(block_size, len(tokens) - 1)
    
    # Forward pass: build computation graph
    keys, values = [[] for _ in range(n_layer)], [[] for _ in range(n_layer)]
    losses = []
    for pos_id in range(n):
        token_id, target_id = tokens[pos_id], tokens[pos_id + 1]
        logits = gpt(token_id, pos_id, keys, values)
        probs = softmax(logits)
        loss_t = -probs[target_id].log()  # negative log likelihood
        losses.append(loss_t)
    loss = (1 / n) * sum(losses)  # average loss over sequence
    
    # Backward pass: compute gradients
    loss.backward()
    
    # Adam optimizer update
    lr_t = learning_rate * 0.5 * (1 + math.cos(math.pi * step / num_steps))  # cosine decay
    for i, p in enumerate(params):
        m[i] = beta1 * m[i] + (1 - beta1) * p.grad
        v[i] = beta2 * v[i] + (1 - beta2) * p.grad ** 2
        m_hat = m[i] / (1 - beta1 ** (step + 1))
        v_hat = v[i] / (1 - beta2 ** (step + 1))
        p.data -= lr_t * m_hat / (v_hat ** 0.5 + eps_adam)
        p.grad = 0
    
    print(f"step {step+1:4d} / {num_steps:4d} | loss {loss.data:.4f}")`;

interface LossPoint {
  step: number;
  loss: number;
}

// Simulate realistic loss curve
const generateLossCurve = (steps: number): LossPoint[] => {
  const points: LossPoint[] = [];
  let currentLoss = 3.5; // Start high
  
  for (let step = 1; step <= steps; step++) {
    // Exponential decay with noise
    const baseLoss = 0.5 + 2.5 * Math.exp(-step / 150);
    const noise = (Math.random() - 0.5) * 0.2;
    currentLoss = baseLoss + noise;
    
    // Ensure loss doesn't go below reasonable minimum
    currentLoss = Math.max(currentLoss, 0.3);
    
    points.push({ step, loss: currentLoss });
  }
  
  return points;
};

const AdamVisualization = ({ step }: { step: number }) => {
  const gradient = 0.5 + 0.3 * Math.sin(step * 0.1);
  const momentum = Math.min(0.9, step * 0.02);
  const velocity = Math.min(0.95, step * 0.015);
  
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-[var(--accent)]">Adam Optimizer State</h4>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] text-sm">Gradient</span>
          <div className="flex items-center space-x-3">
            <div className="w-32 bg-[color-mix(in_srgb,var(--muted)_78%,var(--background))] rounded-full h-2">
              <motion.div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${gradient * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${gradient * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] font-mono text-xs w-12 text-right">
              {gradient.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] text-sm">Momentum (m)</span>
          <div className="flex items-center space-x-3">
            <div className="w-32 bg-[color-mix(in_srgb,var(--muted)_78%,var(--background))] rounded-full h-2">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${momentum * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] font-mono text-xs w-12 text-right">
              {momentum.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] text-sm">Velocity (v)</span>
          <div className="flex items-center space-x-3">
            <div className="w-32 bg-[color-mix(in_srgb,var(--muted)_78%,var(--background))] rounded-full h-2">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${velocity * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] font-mono text-xs w-12 text-right">
              {velocity.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-[color-mix(in_srgb,var(--card-bg)_50%,transparent)] border border-[var(--border)] rounded p-3 text-xs text-[var(--muted-foreground)]">
        <p><strong className="text-[var(--accent)]">Step {step}:</strong> Adam adapts learning rate per parameter using gradient momentum and variance estimates.</p>
      </div>
    </div>
  );
};

const LossCurveChart = ({ points, currentStep }: { points: LossPoint[]; currentStep: number }) => {
  const maxLoss = Math.max(...points.map(p => p.loss));
  const minLoss = Math.min(...points.map(p => p.loss));
  const lossRange = maxLoss - minLoss;
  
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-[var(--accent)]">Training Loss</h4>
      
      <div className="bg-[color-mix(in_srgb,var(--card-bg)_50%,transparent)] border border-[var(--border)] rounded-lg p-4">
        <div className="relative h-48 w-full">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <div
                key={fraction}
                className="absolute w-full border-t border-[color-mix(in_srgb,var(--border)_30%,transparent)]"
                style={{ top: `${fraction * 100}%` }}
              />
            ))}
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((fraction) => (
              <div
                key={fraction}
                className="absolute h-full border-l border-[color-mix(in_srgb,var(--border)_30%,transparent)]"
                style={{ left: `${fraction * 100}%` }}
              />
            ))}
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute -left-12 top-0 h-full flex flex-col justify-between text-xs text-[var(--muted-foreground)]">
            <span>{maxLoss.toFixed(1)}</span>
            <span>{((maxLoss + minLoss) / 2).toFixed(1)}</span>
            <span>{minLoss.toFixed(1)}</span>
          </div>
          
          {/* Loss curve */}
          <svg className="absolute inset-0 w-full h-full">
            <motion.path
              d={`M ${points.slice(0, currentStep).map((point, i) => 
                `${(i / (points.length - 1)) * 100},${((maxLoss - point.loss) / lossRange) * 100}`
              ).join(' L ')}`}
              stroke="var(--accent)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2 }}
            />
          </svg>
          
          {/* Current step indicator */}
          {currentStep > 0 && currentStep <= points.length && (
            <motion.div
              className="absolute w-2 h-2 bg-[var(--accent-bright)] rounded-full transform -translate-x-1 -translate-y-1"
              style={{
                left: `${((currentStep - 1) / (points.length - 1)) * 100}%`,
                top: `${((maxLoss - points[currentStep - 1].loss) / lossRange) * 100}%`
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
        </div>
        
        {/* X-axis */}
        <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-2">
          <span>0</span>
          <span>Steps</span>
          <span>{points.length}</span>
        </div>
      </div>
      
      {currentStep > 0 && currentStep <= points.length && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] rounded-lg">
            <span className="text-[var(--accent)] font-mono">
              Step {currentStep}: Loss = {points[currentStep - 1].loss.toFixed(3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export function TrainingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isTraining, setIsTraining] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [lossPoints] = useState(() => generateLossCurve(100));

  const startTraining = async () => {
    if (isTraining) return;
    
    setIsTraining(true);
    setCurrentStep(0);
    
    for (let step = 1; step <= 100; step++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setCurrentStep(step);
    }
    
    setIsTraining(false);
  };

  const resetTraining = () => {
    setIsTraining(false);
    setCurrentStep(0);
  };

  return (
    <section id="training" ref={ref} className="min-h-screen py-20 px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="space-y-16"
        >
          {/* Section header */}
          <div className="text-center space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl font-bold"
            >
              <span className="text-[var(--accent-bright)]">The Training Loop</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-[var(--muted-foreground)] max-w-4xl mx-auto"
            >
              Training is where the magic happens. The model learns by repeatedly adjusting 
              its parameters to minimize prediction errors using gradient descent.
            </motion.p>
          </div>

          <div className="grid xl:grid-cols-2 gap-12">
            {/* Code explanation */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-[var(--accent)]">Training Loop & Adam</h3>
              
              <div className="bg-[color-mix(in_srgb,var(--code-bg)_76%,transparent)] border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="bg-[color-mix(in_srgb,var(--card-bg)_72%,var(--muted))] px-4 py-2 border-b border-[var(--border)]">
                  <span className="text-[var(--accent-bright)] font-mono text-sm">Training implementation</span>
                </div>
                <div className="p-4 font-mono text-xs overflow-x-auto max-h-80 overflow-y-auto">
                  <Highlight
                    language="python"
                    code={trainingCode}
                    theme={{
                      plain: { backgroundColor: 'transparent', color: 'var(--foreground)' },
                      styles: [
                        { types: ['keyword'], style: { color: 'var(--accent)' }},
                        { types: ['string'], style: { color: '#84cc16' }},
                        { types: ['number'], style: { color: '#06b6d4' }},
                        { types: ['comment'], style: { color: 'var(--muted-foreground)', fontStyle: 'italic' }},
                        { types: ['function'], style: { color: '#8b5cf6' }},
                        { types: ['operator'], style: { color: 'var(--accent)' }},
                        { types: ['punctuation'], style: { color: 'var(--muted-foreground)' }},
                      ]
                    }}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre className={className} style={{ ...style, background: 'transparent', margin: 0, padding: 0 }}>
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

              <div className="space-y-4">
                <div className="bg-[color-mix(in_srgb,var(--card-bg)_50%,transparent)] border-l-4 border-[var(--accent)] p-4 rounded-r-lg">
                  <p className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))]">
                    <strong className="text-[var(--accent-bright)]">Key Insight:</strong> Adam optimizer adapts 
                    the learning rate for each parameter using momentum (past gradients) and 
                    velocity (past squared gradients). This helps training converge faster.
                  </p>
                </div>
                
                <div className="bg-[color-mix(in_srgb,var(--card-bg)_38%,transparent)] border border-[var(--border)] rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-[var(--accent)] mb-2">Training Process:</h4>
                  <ul className="space-y-2 text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] text-sm">
                    <li>• <strong>Forward pass:</strong> Predict next token, compute loss</li>
                    <li>• <strong>Backward pass:</strong> Calculate gradients via autograd</li>
                    <li>• <strong>Optimizer step:</strong> Update parameters using Adam</li>
                    <li>• <strong>Repeat:</strong> Until loss converges to minimum</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Interactive training visualization */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-[var(--accent)]">Training Simulation</h3>
                <div className="space-x-2">
                  <button
                    onClick={resetTraining}
                    className="px-3 py-1 text-xs bg-[color-mix(in_srgb,var(--muted)_78%,var(--background))] text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] rounded hover:bg-[color-mix(in_srgb,var(--muted)_92%,var(--background))] transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={startTraining}
                    data-guide-anchor="training-start"
                    disabled={isTraining}
                    className="px-4 py-2 bg-[var(--accent)] text-[var(--background)] text-sm font-medium rounded hover:bg-[var(--accent-bright)] transition-colors disabled:opacity-50"
                  >
                    {isTraining ? `Training... (${currentStep}/100)` : 'Start Training'}
                  </button>
                </div>
              </div>
              
              <div className="bg-[color-mix(in_srgb,var(--code-bg)_56%,transparent)] border border-[var(--border)] rounded-lg p-6 space-y-8">
                <LossCurveChart points={lossPoints} currentStep={currentStep} />
                
                <AdamVisualization step={currentStep} />
              </div>

              {/* Training insights */}
              <div className="bg-[color-mix(in_srgb,var(--card-bg)_38%,transparent)] border border-[var(--border)] rounded-lg p-4">
                <h4 className="text-lg font-semibold text-[var(--accent)] mb-3">What&apos;s Happening:</h4>
                <div className="space-y-2 text-sm text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))]">
                  <div className="flex items-start space-x-3">
                    <span className="w-2 h-2 bg-[var(--accent-bright)] rounded-full mt-2 flex-shrink-0"></span>
                    <span>
                      <strong className="text-[color-mix(in_srgb,var(--accent)_75%,var(--foreground))]">Loss decreases:</strong> Model predictions get better over time
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-2 h-2 bg-[var(--accent-bright)] rounded-full mt-2 flex-shrink-0"></span>
                    <span>
                      <strong className="text-[color-mix(in_srgb,var(--accent)_75%,var(--foreground))]">Adam adapts:</strong> Learning rate adjusts per parameter
                    </span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="w-2 h-2 bg-[var(--accent-bright)] rounded-full mt-2 flex-shrink-0"></span>
                    <span>
                      <strong className="text-[color-mix(in_srgb,var(--accent)_75%,var(--foreground))]">Gradients flow:</strong> Autograd computes derivatives automatically
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
