"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Highlight } from "prism-react-renderer";

const buildingBlocksCode = `def linear(x, w):
    """Matrix multiplication: x @ w.T"""
    return [sum(wi * xi for wi, xi in zip(wo, x)) for wo in w]

def softmax(logits):
    """Convert logits to probabilities"""
    max_val = max(val.data for val in logits)
    exps = [(val - max_val).exp() for val in logits]
    total = sum(exps)
    return [e / total for e in exps]

def rmsnorm(x):
    """Root Mean Square normalization"""
    ms = sum(xi * xi for xi in x) / len(x)
    scale = (ms + 1e-5) ** -0.5
    return [xi * scale for xi in x]`;

const gptCode = `def gpt(token_id, pos_id, keys, values):
    # 1. Embedding: token + position
    tok_emb = state_dict['wte'][token_id]  # token embedding
    pos_emb = state_dict['wpe'][pos_id]    # position embedding  
    x = [t + p for t, p in zip(tok_emb, pos_emb)]
    x = rmsnorm(x)
    
    for li in range(n_layer):
        # 2. Multi-head attention block
        x_residual = x
        x = rmsnorm(x)
        q = linear(x, state_dict[f'layer{li}.attn_wq'])
        k = linear(x, state_dict[f'layer{li}.attn_wk']) 
        v = linear(x, state_dict[f'layer{li}.attn_wv'])
        
        # Store keys/values for all positions (autoregressive)
        keys[li].append(k)
        values[li].append(v)
        
        x_attn = []
        for h in range(n_head):  # Multi-head attention
            hs = h * head_dim
            q_h = q[hs:hs+head_dim]
            k_h = [ki[hs:hs+head_dim] for ki in keys[li]]
            v_h = [vi[hs:hs+head_dim] for vi in values[li]]
            
            # Attention scores: Q @ K.T / sqrt(d_k)
            attn_logits = [sum(q_h[j] * k_h[t][j] for j in range(head_dim)) / head_dim**0.5 
                          for t in range(len(k_h))]
            attn_weights = softmax(attn_logits)
            
            # Weighted sum of values
            head_out = [sum(attn_weights[t] * v_h[t][j] for t in range(len(v_h))) 
                       for j in range(head_dim)]
            x_attn.extend(head_out)
        
        x = linear(x_attn, state_dict[f'layer{li}.attn_wo'])
        x = [a + b for a, b in zip(x, x_residual)]  # Residual connection
        
        # 3. MLP block
        x_residual = x
        x = rmsnorm(x)
        x = linear(x, state_dict[f'layer{li}.mlp_fc1'])
        x = [xi.relu() ** 2 for xi in x]  # Squared ReLU activation
        x = linear(x, state_dict[f'layer{li}.mlp_fc2'])
        x = [a + b for a, b in zip(x, x_residual)]  # Residual connection
    
    # 4. Language modeling head
    logits = linear(x, state_dict['lm_head'])
    return logits`;

interface AttentionVisualization {
  query: string;
  keys: string[];
  weights: number[];
}

const AttentionMatrix = ({ attention }: { attention: AttentionVisualization }) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-[var(--accent)] mb-2">Attention Weights</h4>
        <p className="text-[var(--muted-foreground)] text-sm">Query: &quot;{attention.query}&quot; attending to keys</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {attention.keys.map((key, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center space-x-4"
          >
            <div className="w-16 text-right text-sm text-[var(--muted-foreground)] font-mono">
              pos {i}:
            </div>
            <div className="flex-1 bg-[color-mix(in_srgb,var(--card-bg)_72%,var(--muted))] rounded-lg p-3 flex items-center justify-between">
              <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] font-mono">&quot;{key}&quot;</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-[color-mix(in_srgb,var(--muted)_78%,var(--background))] rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${attention.weights[i] * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                  />
                </div>
                <span className="text-[var(--accent)] font-mono text-sm font-bold w-12 text-right">
                  {(attention.weights[i] * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export function ArchitectureSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeTab, setActiveTab] = useState<'blocks' | 'gpt'>('blocks');
  const [attentionExample, setAttentionExample] = useState<AttentionVisualization>({
    query: "a",
    keys: ["<BOS>", "e", "m", "m"],
    weights: [0.1, 0.2, 0.3, 0.4]
  });

  const runAttentionExample = (example: 'name' | 'position') => {
    if (example === 'name') {
      setAttentionExample({
        query: "m",
        keys: ["<BOS>", "e", "m", "m"],
        weights: [0.05, 0.15, 0.4, 0.4]
      });
    } else {
      setAttentionExample({
        query: "a",
        keys: ["<BOS>", "e", "m", "m", "a"],
        weights: [0.6, 0.1, 0.1, 0.1, 0.1]
      });
    }
  };

  return (
    <section id="architecture" ref={ref} className="min-h-screen py-20 px-6 lg:px-8">
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
              <span className="text-[var(--accent-bright)]">The Architecture</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-[var(--muted-foreground)] max-w-4xl mx-auto"
            >
              GPT combines simple building blocks into a powerful architecture. 
              Attention lets the model focus on relevant parts of the input.
            </motion.p>
          </div>

          {/* Tab navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="bg-[color-mix(in_srgb,var(--card-bg)_72%,var(--muted))] rounded-lg p-1 border border-[var(--border)]">
              <button
                onClick={() => setActiveTab('blocks')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'blocks'
                    ? 'bg-[var(--accent)] text-[var(--background)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Building Blocks
              </button>
              <button
                onClick={() => setActiveTab('gpt')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'gpt'
                    ? 'bg-[var(--accent)] text-[var(--background)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                GPT Function
              </button>
            </div>
          </motion.div>

          {activeTab === 'blocks' && (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Building blocks code */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-semibold text-[var(--accent)]">Core Functions</h3>
                
                <div className="bg-[color-mix(in_srgb,var(--code-bg)_76%,transparent)] border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="bg-[color-mix(in_srgb,var(--card-bg)_72%,var(--muted))] px-4 py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--accent-bright)] font-mono text-sm">Building blocks</span>
                  </div>
                  <div className="p-4 font-mono text-sm overflow-x-auto">
                    <Highlight
                      language="python"
                      code={buildingBlocksCode}
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
                      <strong className="text-[var(--accent-bright)]">Key Insight:</strong> Complex neural networks 
                      are built from simple mathematical operations. Linear transforms, normalization, 
                      and non-linearities combine to create powerful representations.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Function explanations */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-semibold text-[var(--accent)]">How They Work</h3>
                
                <div className="space-y-4">
                  <div className="bg-[color-mix(in_srgb,var(--card-bg)_38%,transparent)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                    <h4 className="text-lg font-semibold text-[color-mix(in_srgb,var(--accent)_75%,var(--foreground))] flex items-center">
                      <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">L</span>
                      Linear Layer
                    </h4>
                    <p className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] text-sm">
                      Matrix multiplication that transforms input vectors to output vectors. 
                      This is where most learning happens - the weights capture relationships between features.
                    </p>
                    <div className="text-xs text-[var(--muted-foreground)] font-mono bg-[color-mix(in_srgb,var(--code-bg)_76%,transparent)] p-2 rounded">
                      output = input @ weights.T
                    </div>
                  </div>

                  <div className="bg-[color-mix(in_srgb,var(--card-bg)_38%,transparent)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                    <h4 className="text-lg font-semibold text-[color-mix(in_srgb,var(--accent)_75%,var(--foreground))] flex items-center">
                      <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">S</span>
                      Softmax
                    </h4>
                    <p className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] text-sm">
                      Converts raw scores (logits) into probabilities that sum to 1. 
                      Essential for attention weights and final token predictions.
                    </p>
                    <div className="text-xs text-[var(--muted-foreground)] font-mono bg-[color-mix(in_srgb,var(--code-bg)_76%,transparent)] p-2 rounded">
                      prob_i = exp(x_i) / sum(exp(x_j))
                    </div>
                  </div>

                  <div className="bg-[color-mix(in_srgb,var(--card-bg)_38%,transparent)] border border-[var(--border)] rounded-lg p-5 space-y-3">
                    <h4 className="text-lg font-semibold text-[color-mix(in_srgb,var(--accent)_75%,var(--foreground))] flex items-center">
                      <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">N</span>
                      RMSNorm
                    </h4>
                    <p className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] text-sm">
                      Normalizes vectors to have consistent magnitude. Helps with training stability 
                      and prevents exploding gradients. Simpler than LayerNorm.
                    </p>
                    <div className="text-xs text-[var(--muted-foreground)] font-mono bg-[color-mix(in_srgb,var(--code-bg)_76%,transparent)] p-2 rounded">
                      scale = 1 / sqrt(mean(x²) + ε)
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'gpt' && (
            <div className="grid xl:grid-cols-2 gap-12">
              {/* GPT function code */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-semibold text-[var(--accent)]">The GPT Function</h3>
                
                <div className="bg-[color-mix(in_srgb,var(--code-bg)_76%,transparent)] border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="bg-[color-mix(in_srgb,var(--card-bg)_72%,var(--muted))] px-4 py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--accent-bright)] font-mono text-sm">Complete forward pass</span>
                  </div>
                  <div className="p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                    <Highlight
                      language="python"
                      code={gptCode}
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

                <div className="bg-[color-mix(in_srgb,var(--card-bg)_50%,transparent)] border-l-4 border-[var(--accent)] p-4 rounded-r-lg">
                  <p className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))]">
                    <strong className="text-[var(--accent-bright)]">The Magic:</strong> Attention lets the model 
                    &quot;look back&quot; at all previous tokens when predicting the next one. Each position 
                    can attend to relevant context, not just adjacent tokens.
                  </p>
                </div>
              </motion.div>

              {/* Attention visualization */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-semibold text-[var(--accent)]">Attention in Action</h3>
                
                <div className="bg-[color-mix(in_srgb,var(--code-bg)_56%,transparent)] border border-[var(--border)] rounded-lg p-6">
                  <AttentionMatrix attention={attentionExample} />
                  
                  <div className="mt-6 space-y-3">
                    <p className="text-sm text-[var(--muted-foreground)] text-center">
                      Try different attention patterns:
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => runAttentionExample('name')}
                        className="px-4 py-2 bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] text-sm rounded-lg border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] transition-colors"
                      >
                        Same Letters
                      </button>
                      <button
                        onClick={() => runAttentionExample('position')}
                        className="px-4 py-2 bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)] text-sm rounded-lg border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] transition-colors"
                      >
                        Start Token
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[color-mix(in_srgb,var(--card-bg)_38%,transparent)] border border-[var(--border)] rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-[var(--accent)] mb-3">Architecture Flow:</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
                      <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))]">Token + Position Embeddings</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
                      <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))]">Multi-Head Attention (focus on context)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</span>
                      <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))]">MLP Layer (transform features)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">4</span>
                      <span className="text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))]">Output Logits (next token predictions)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
