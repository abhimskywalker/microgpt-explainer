"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Highlight } from "prism-react-renderer";

const fullCode = `"""
The most atomic way to train and inference a GPT in pure, dependency-free Python.
This file is the complete algorithm.
Everything else is just efficiency.

@karpathy
"""

import os       # os.path.exists
import math     # math.log, math.exp
import random   # random.seed, random.choices, random.gauss, random.shuffle
random.seed(42) # Let there be order among chaos

# Let there be an input dataset
if not os.path.exists('input.txt'):
    import urllib.request
    names_url = 'https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt'
    urllib.request.urlretrieve(names_url, 'input.txt')
docs = [l.strip() for l in open('input.txt').read().strip().split('\\n') if l.strip()]
random.shuffle(docs)
print(f"num docs: {len(docs)}")

# Let there be a Tokenizer
uchars = sorted(set(''.join(docs)))
BOS = len(uchars)
vocab_size = len(uchars) + 1
print(f"vocab size: {vocab_size}")

# Let there be an Autograd
class Value:
    def __init__(self, data, children=(), local_grads=()):
        self.data = data
        self.grad = 0
        self._children = children
        self._local_grads = local_grads

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data + other.data, (self, other), (1, 1))

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data * other.data, (self, other), (other.data, self.data))

    def __pow__(self, other): return Value(self.data**other, (self,), (other * self.data**(other-1),))
    def log(self): return Value(math.log(self.data), (self,), (1/self.data,))
    def exp(self): return Value(math.exp(self.data), (self,), (math.exp(self.data),))
    def relu(self): return Value(max(0, self.data), (self,), (float(self.data > 0),))
    def __neg__(self): return self * -1
    def __radd__(self, other): return self + other
    def __sub__(self, other): return self + (-other)
    def __rsub__(self, other): return other + (-self)
    def __rmul__(self, other): return self * other
    def __truediv__(self, other): return self * other**-1
    def __rtruediv__(self, other): return other * self**-1

    def backward(self):
        topo = []
        visited = set()
        def build_topo(v):
            if v not in visited:
                visited.add(v)
                for child in v._children:
                    build_topo(child)
                topo.append(v)
        build_topo(self)
        self.grad = 1
        for v in reversed(topo):
            for child, local_grad in zip(v._children, v._local_grads):
                child.grad += local_grad * v.grad

# Initialize the parameters
n_embd = 16
n_head = 4
n_layer = 1
block_size = 8
head_dim = n_embd // n_head
matrix = lambda nout, nin, std=0.02: [[Value(random.gauss(0, std)) for _ in range(nin)] for _ in range(nout)]
state_dict = {'wte': matrix(vocab_size, n_embd), 'wpe': matrix(block_size, n_embd), 'lm_head': matrix(vocab_size, n_embd)}
for i in range(n_layer):
    state_dict[f'layer{i}.attn_wq'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wk'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wv'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wo'] = matrix(n_embd, n_embd, std=0)
    state_dict[f'layer{i}.mlp_fc1'] = matrix(4 * n_embd, n_embd)
    state_dict[f'layer{i}.mlp_fc2'] = matrix(n_embd, 4 * n_embd, std=0)
params = [p for mat in state_dict.values() for row in mat for p in row]
print(f"num params: {len(params)}")

# Model architecture
def linear(x, w):
    return [sum(wi * xi for wi, xi in zip(wo, x)) for wo in w]

def softmax(logits):
    max_val = max(val.data for val in logits)
    exps = [(val - max_val).exp() for val in logits]
    total = sum(exps)
    return [e / total for e in exps]

def rmsnorm(x):
    ms = sum(xi * xi for xi in x) / len(x)
    scale = (ms + 1e-5) ** -0.5
    return [xi * scale for xi in x]

def gpt(token_id, pos_id, keys, values):
    tok_emb = state_dict['wte'][token_id]
    pos_emb = state_dict['wpe'][pos_id]
    x = [t + p for t, p in zip(tok_emb, pos_emb)]
    x = rmsnorm(x)
    for li in range(n_layer):
        x_residual = x
        x = rmsnorm(x)
        q = linear(x, state_dict[f'layer{li}.attn_wq'])
        k = linear(x, state_dict[f'layer{li}.attn_wk'])
        v = linear(x, state_dict[f'layer{li}.attn_wv'])
        keys[li].append(k)
        values[li].append(v)
        x_attn = []
        for h in range(n_head):
            hs = h * head_dim
            q_h = q[hs:hs+head_dim]
            k_h = [ki[hs:hs+head_dim] for ki in keys[li]]
            v_h = [vi[hs:hs+head_dim] for vi in values[li]]
            attn_logits = [sum(q_h[j] * k_h[t][j] for j in range(head_dim)) / head_dim**0.5 for t in range(len(k_h))]
            attn_weights = softmax(attn_logits)
            head_out = [sum(attn_weights[t] * v_h[t][j] for t in range(len(v_h))) for j in range(head_dim)]
            x_attn.extend(head_out)
        x = linear(x_attn, state_dict[f'layer{li}.attn_wo'])
        x = [a + b for a, b in zip(x, x_residual)]
        x_residual = x
        x = rmsnorm(x)
        x = linear(x, state_dict[f'layer{li}.mlp_fc1'])
        x = [xi.relu() ** 2 for xi in x]
        x = linear(x, state_dict[f'layer{li}.mlp_fc2'])
        x = [a + b for a, b in zip(x, x_residual)]
    logits = linear(x, state_dict['lm_head'])
    return logits

# Adam optimizer
learning_rate, beta1, beta2, eps_adam = 1e-2, 0.9, 0.95, 1e-8
m = [0.0] * len(params)
v = [0.0] * len(params)

# Training loop
num_steps = 500
for step in range(num_steps):
    doc = docs[step % len(docs)]
    tokens = [BOS] + [uchars.index(ch) for ch in doc] + [BOS]
    n = min(block_size, len(tokens) - 1)
    keys, values = [[] for _ in range(n_layer)], [[] for _ in range(n_layer)]
    losses = []
    for pos_id in range(n):
        token_id, target_id = tokens[pos_id], tokens[pos_id + 1]
        logits = gpt(token_id, pos_id, keys, values)
        probs = softmax(logits)
        loss_t = -probs[target_id].log()
        losses.append(loss_t)
    loss = (1 / n) * sum(losses)
    loss.backward()
    lr_t = learning_rate * 0.5 * (1 + math.cos(math.pi * step / num_steps))
    for i, p in enumerate(params):
        m[i] = beta1 * m[i] + (1 - beta1) * p.grad
        v[i] = beta2 * v[i] + (1 - beta2) * p.grad ** 2
        m_hat = m[i] / (1 - beta1 ** (step + 1))
        v_hat = v[i] / (1 - beta2 ** (step + 1))
        p.data -= lr_t * m_hat / (v_hat ** 0.5 + eps_adam)
        p.grad = 0
    print(f"step {step+1:4d} / {num_steps:4d} | loss {loss.data:.4f}")

# Inference
temperature = 0.5
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

export function FullCodeSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="full-code" ref={ref} className="min-h-screen py-20 px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl font-bold"
            >
              <span className="text-[var(--accent-bright)]">The Full Code</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto"
            >
              243 lines. Pure Python. No dependencies. The complete algorithm for training
              and running a GPT language model.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-[color-mix(in_srgb,var(--code-bg)_76%,transparent)] border border-[var(--border)] rounded-lg overflow-hidden"
          >
            <div className="bg-[color-mix(in_srgb,var(--card-bg)_72%,var(--muted))] px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--muted-foreground)]/50" />
                  <div className="w-3 h-3 rounded-full bg-[var(--accent)]/70" />
                  <div className="w-3 h-3 rounded-full bg-[var(--accent-bright)]/80" />
                </div>
                <span className="text-[var(--accent-bright)] font-mono text-sm">microgpt.py</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[var(--muted-foreground)] text-xs font-mono">243 lines</span>
                <button
                  onClick={copyCode}
                  data-guide-anchor="fullcode-copy"
                  className="px-3 py-1 text-xs bg-[color-mix(in_srgb,var(--muted)_78%,var(--background))] text-[color-mix(in_srgb,var(--foreground)_88%,var(--background))] rounded hover:bg-[color-mix(in_srgb,var(--muted)_92%,var(--background))] transition-colors"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>
            <div className="p-4 font-mono text-xs overflow-x-auto max-h-[70vh] overflow-y-auto">
              <Highlight
                language="python"
                code={fullCode}
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
                    { types: ["builtin"], style: { color: "var(--accent)" } },
                    { types: ["class-name"], style: { color: "var(--accent-bright)" } },
                  ],
                }}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={className} style={{ ...style, background: "transparent", margin: 0, padding: 0 }}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })} className="flex">
                        <span className="text-[color-mix(in_srgb,var(--muted-foreground)_82%,var(--background))] select-none w-8 text-right mr-4 flex-shrink-0">
                          {i + 1}
                        </span>
                        <span>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </span>
                      </div>
                    ))}
                  </pre>
                )}
              </Highlight>
            </div>
          </motion.div>

          {/* Footer attribution */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-center space-y-4 py-12"
          >
            <p className="text-[var(--muted-foreground)] text-sm">
              Original code by{" "}
              <a
                href="https://x.com/karpathy/status/2021694437152157847"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-bright)] hover:text-[var(--accent-bright)] transition-colors"
              >
                @karpathy
              </a>
              {" "}· Interactive explainer built with Next.js, Framer Motion & React Flow
            </p>
            <p className="text-[color-mix(in_srgb,var(--muted-foreground)_82%,var(--background))] text-xs font-mono">
              &quot;This is the *full* algorithmic content of what is needed. Everything else is just for efficiency.&quot;
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
