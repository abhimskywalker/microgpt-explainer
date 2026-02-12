# MicroGPT Explainer

An interactive visual walkthrough of [Karpathy's microgpt](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95) — a complete GPT implementation in 243 lines of pure, dependency-free Python.

> *"This is the full algorithmic content of what is needed. Everything else is just for efficiency."* — [@karpathy](https://x.com/karpathy/status/2021694437152157847)

## What is this?

MicroGPT strips a GPT language model down to its most atomic mathematical operations: `+`, `*`, `**`, `log`, `exp`. A tiny scalar autograd engine (micrograd) handles backpropagation. Adam handles optimization. That's it.

This site walks through every piece — interactively — so you can actually understand what's happening.

## Sections

| # | Section | What you'll learn |
|---|---------|-------------------|
| 1 | **Introduction** | The premise: GPT in 243 lines |
| 2 | **Data & Tokenizer** | How text becomes numbers (type a name, see it tokenized) |
| 3 | **Autograd Engine** | The `Value` class — interactive computation graph with forward/backward pass |
| 4 | **Parameters** | Weight matrices, embedding tables, parameter count breakdown |
| 5 | **Architecture** | Linear layers, softmax, RMSNorm, multi-head attention with heatmap visualization |
| 6 | **Training Loop** | Loss curve simulation, Adam optimizer state, cosine LR decay |
| 7 | **Inference** | Temperature slider — generate names and see how creativity vs coherence works |
| 8 | **Full Code** | The complete 243 lines, syntax-highlighted with copy button |

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **Framer Motion** — scroll-triggered animations
- **React Flow** — computation graph visualization
- **Prism React Renderer** — syntax highlighting
- **Tailwind CSS** — styling
- **JetBrains Mono + Crimson Pro** — typography

## Getting Started

```bash
git clone https://github.com/abhimskywalker/microgpt-explainer.git
cd microgpt-explainer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

One-click deploy to Vercel — just connect the repo. No environment variables needed.

## Credits

- Original code: [Andrej Karpathy](https://x.com/karpathy) — [microgpt.py](https://gist.github.com/karpathy/8627fe009c40f57531cb18360106ce95)
- Explainer: Built by [Abhishek Malik](https://github.com/abhimskywalker)

## License

MIT
