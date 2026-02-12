"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Highlight } from "prism-react-renderer";

const parametersCode = `# Initialize the parameters
n_embd = 16     # embedding dimension  
n_head = 4      # number of attention heads
n_layer = 1     # number of layers
block_size = 8  # maximum sequence length
head_dim = n_embd // n_head # dimension of each head

matrix = lambda nout, nin, std=0.02: [[Value(random.gauss(0, std)) for _ in range(nin)] for _ in range(nout)]

state_dict = {
    'wte': matrix(vocab_size, n_embd),    # token embeddings
    'wpe': matrix(block_size, n_embd),    # position embeddings  
    'lm_head': matrix(vocab_size, n_embd) # language model head
}

for i in range(n_layer):
    state_dict[f'layer{i}.attn_wq'] = matrix(n_embd, n_embd)  # query weights
    state_dict[f'layer{i}.attn_wk'] = matrix(n_embd, n_embd)  # key weights
    state_dict[f'layer{i}.attn_wv'] = matrix(n_embd, n_embd)  # value weights
    state_dict[f'layer{i}.attn_wo'] = matrix(n_embd, n_embd, std=0)  # output weights
    state_dict[f'layer{i}.mlp_fc1'] = matrix(4 * n_embd, n_embd)     # MLP layer 1
    state_dict[f'layer{i}.mlp_fc2'] = matrix(n_embd, 4 * n_embd, std=0)  # MLP layer 2

params = [p for mat in state_dict.values() for row in mat for p in row]
print(f"num params: {len(params)}")`;

interface MatrixVisualization {
  name: string;
  description: string;
  shape: [number, number];
  color: string;
  count: number;
}

const matrices: MatrixVisualization[] = [
  {
    name: "wte",
    description: "Token Embeddings",
    shape: [27, 16], // vocab_size × n_embd
    color: "bg-blue-500",
    count: 27 * 16
  },
  {
    name: "wpe", 
    description: "Position Embeddings",
    shape: [8, 16], // block_size × n_embd
    color: "bg-green-500",
    count: 8 * 16
  },
  {
    name: "attn_wq",
    description: "Attention Query",
    shape: [16, 16], // n_embd × n_embd
    color: "bg-purple-500", 
    count: 16 * 16
  },
  {
    name: "attn_wk",
    description: "Attention Key",
    shape: [16, 16],
    color: "bg-purple-400",
    count: 16 * 16
  },
  {
    name: "attn_wv",
    description: "Attention Value", 
    shape: [16, 16],
    color: "bg-purple-300",
    count: 16 * 16
  },
  {
    name: "attn_wo",
    description: "Attention Output",
    shape: [16, 16],
    color: "bg-purple-600",
    count: 16 * 16
  },
  {
    name: "mlp_fc1",
    description: "MLP Layer 1",
    shape: [64, 16], // 4 * n_embd × n_embd
    color: "bg-orange-500",
    count: 64 * 16
  },
  {
    name: "mlp_fc2", 
    description: "MLP Layer 2",
    shape: [16, 64], // n_embd × 4 * n_embd
    color: "bg-orange-400",
    count: 16 * 64
  },
  {
    name: "lm_head",
    description: "Language Model Head",
    shape: [27, 16], // vocab_size × n_embd
    color: "bg-red-500",
    count: 27 * 16
  }
];

const totalParams = matrices.reduce((sum, m) => sum + m.count, 0);

function MatrixVisual({ matrix, index }: { matrix: MatrixVisualization; index: number }) {
  const [rows, cols] = matrix.shape;
  const cellSize = Math.min(200 / Math.max(rows, cols), 8);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="bg-stone-800/50 border border-stone-600 rounded-lg p-4 space-y-3"
    >
      <div className="text-center">
        <h4 className="font-mono text-amber-300 font-semibold">{matrix.name}</h4>
        <p className="text-stone-400 text-sm">{matrix.description}</p>
        <p className="text-stone-300 text-xs">
          {rows} × {cols} = {matrix.count.toLocaleString()} params
        </p>
      </div>
      
      <div className="flex justify-center">
        <div 
          className="relative border border-stone-500 rounded bg-stone-900"
          style={{ 
            width: Math.min(200, cols * cellSize), 
            height: Math.min(120, rows * cellSize) 
          }}
        >
          {/* Matrix grid visualization */}
          <div 
            className={`absolute inset-0 ${matrix.color} opacity-60 rounded`}
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent ${cellSize}px,
                rgba(0,0,0,0.2) ${cellSize}px,
                rgba(0,0,0,0.2) ${cellSize + 1}px
              ), repeating-linear-gradient(
                90deg, 
                transparent,
                transparent ${cellSize}px,
                rgba(0,0,0,0.2) ${cellSize}px,
                rgba(0,0,0,0.2) ${cellSize + 1}px
              ), ${matrix.color}`
            }}
          />
          
          {/* Dimensions labels */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-stone-400">
            {cols}
          </div>
          <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 text-xs text-stone-400"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            {rows}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ParametersSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixVisualization | null>(null);

  return (
    <section id="parameters" ref={ref} className="min-h-screen py-20 px-6 lg:px-8">
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
              <span className="text-amber-400">The Parameters</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-stone-400 max-w-4xl mx-auto"
            >
              Neural networks learn by adjusting millions of parameters. Even this tiny GPT 
              has thousands of learnable weights organized into meaningful matrices.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="inline-flex items-center px-6 py-3 bg-amber-500/20 border border-amber-500/50 rounded-full"
            >
              <span className="text-2xl font-mono font-bold text-amber-300">
                {totalParams.toLocaleString()} parameters
              </span>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Code explanation */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-amber-300">Parameter Initialization</h3>
              
              <div className="bg-stone-900/50 border border-stone-700 rounded-lg overflow-hidden">
                <div className="bg-stone-800/50 px-4 py-2 border-b border-stone-700">
                  <span className="text-amber-400 font-mono text-sm">Parameter setup</span>
                </div>
                <div className="p-4 font-mono text-sm overflow-x-auto">
                  <Highlight
                    language="python"
                    code={parametersCode}
                    theme={{
                      plain: { backgroundColor: 'transparent', color: '#fef3c7' },
                      styles: [
                        { types: ['keyword'], style: { color: '#f59e0b' }},
                        { types: ['string'], style: { color: '#84cc16' }},
                        { types: ['number'], style: { color: '#06b6d4' }},
                        { types: ['comment'], style: { color: '#6b7280', fontStyle: 'italic' }},
                        { types: ['function'], style: { color: '#8b5cf6' }},
                        { types: ['operator'], style: { color: '#f59e0b' }},
                        { types: ['punctuation'], style: { color: '#a8a29e' }},
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
                <div className="bg-stone-800/30 border-l-4 border-amber-500 p-4 rounded-r-lg">
                  <p className="text-stone-300">
                    <strong className="text-amber-400">Key Insight:</strong> Each matrix has a specific 
                    purpose - embeddings encode tokens/positions, attention weights focus on relevant 
                    parts, and MLP layers transform representations.
                  </p>
                </div>
                
                <div className="bg-stone-800/20 border border-stone-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-amber-300 mb-2">Parameter Types:</h4>
                  <ul className="space-y-2 text-stone-300 text-sm">
                    <li>• <strong>Embeddings:</strong> Convert tokens/positions to vectors</li>
                    <li>• <strong>Attention:</strong> Learn which tokens to focus on</li>
                    <li>• <strong>MLP:</strong> Transform and combine features</li>
                    <li>• <strong>Output:</strong> Convert vectors back to token probabilities</li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Matrix visualizations */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold text-amber-300">Weight Matrices</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {matrices.map((matrix, index) => (
                  <button
                    key={matrix.name}
                    onClick={() => setSelectedMatrix(matrix)}
                    className="transform hover:scale-105 transition-transform"
                  >
                    <MatrixVisual matrix={matrix} index={index} />
                  </button>
                ))}
              </div>

              {/* Parameter breakdown */}
              <div className="bg-stone-800/30 border border-stone-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-amber-300 mb-3">Parameter Breakdown:</h4>
                <div className="space-y-2 text-sm">
                  {matrices.map((matrix) => (
                    <div key={matrix.name} className="flex justify-between items-center">
                      <span className="text-stone-300 font-mono">{matrix.name}</span>
                      <div className="text-right">
                        <span className="text-stone-400 text-xs">
                          {matrix.shape[0]} × {matrix.shape[1]}
                        </span>
                        <span className="text-amber-300 ml-2 font-mono">
                          {matrix.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-stone-600 pt-2 mt-3 flex justify-between font-semibold">
                    <span className="text-amber-300">Total Parameters:</span>
                    <span className="text-amber-300 font-mono">
                      {totalParams.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-stone-400">
                Click on any matrix above to see details about its role in the model.
              </div>
            </motion.div>
          </div>

          {/* Selected matrix details */}
          {selectedMatrix && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-stone-800/20 border border-amber-500/30 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-semibold text-amber-300">
                  {selectedMatrix.name}: {selectedMatrix.description}
                </h4>
                <button
                  onClick={() => setSelectedMatrix(null)}
                  className="text-stone-400 hover:text-stone-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-amber-200 mb-2">Shape & Size:</h5>
                  <p className="text-stone-300 text-sm mb-3">
                    {selectedMatrix.shape[0]} rows × {selectedMatrix.shape[1]} columns = {" "}
                    <span className="font-mono font-semibold text-amber-300">
                      {selectedMatrix.count.toLocaleString()} parameters
                    </span>
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-amber-200 mb-2">Purpose:</h5>
                  <p className="text-stone-300 text-sm">
                    {selectedMatrix.name === "wte" && "Maps each token ID to a dense vector representation that captures semantic meaning."}
                    {selectedMatrix.name === "wpe" && "Encodes positional information so the model knows where each token appears in the sequence."}
                    {selectedMatrix.name === "attn_wq" && "Transforms input to create query vectors for attention mechanism."}
                    {selectedMatrix.name === "attn_wk" && "Transforms input to create key vectors that queries attend to."}
                    {selectedMatrix.name === "attn_wv" && "Transforms input to create value vectors that get aggregated by attention."}
                    {selectedMatrix.name === "attn_wo" && "Projects concatenated attention head outputs back to model dimension."}
                    {selectedMatrix.name === "mlp_fc1" && "First MLP layer that expands dimensionality for non-linear transformations."}
                    {selectedMatrix.name === "mlp_fc2" && "Second MLP layer that projects back down to model dimension."}
                    {selectedMatrix.name === "lm_head" && "Final layer that converts hidden states to vocabulary logits for next token prediction."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}